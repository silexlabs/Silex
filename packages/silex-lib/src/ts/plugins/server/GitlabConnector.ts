/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { API_CONNECTOR_LOGIN_CALLBACK, API_CONNECTOR_PATH, API_PATH, WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE } from '../../constants'
import { ServerConfig } from '../../server/config'
import { ConnectorFile, ConnectorFileContent, StatusCallback, StorageConnector, contentToBuffer, contentToString, toConnectorData } from '../../server/connectors/connectors'
import { ApiError, ConnectorType, ConnectorUser, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent } from '../../types'
import fetch from 'node-fetch'
import crypto, { createHash } from 'crypto'
import { PassThrough, Readable } from 'stream'

/**
 * Gitlab connector
 * @fileoverview Gitlab connector for Silex, connect to the user's Gitlab account to store websites
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 */

export interface GitlabOptions {
  clientId: string
  clientSecret: string
  branch: string
}

interface GitlabToken {
  state: string
  codeVerifier: string
  codeChallenge: string
  token?: {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    created_at: number
    id_token: string
    scope: string
  }
  userId?: number
}

interface GitlabSession {
  gitlab?: GitlabToken
}

interface GitlabAction {
  action: 'create' | 'delete' | 'move' | 'update'
  file_path: string
  content?: string
}

interface GitlabWriteFile {
  branch: string
  commit_message: string
  id: string
  actions?: GitlabAction[]
  content?: string
  file_path?: string
  encoding?: 'base64' | 'text'
}

interface GitlabGetToken {
  grant_type: 'authorization_code'
  client_id: string
  client_secret: string
  code: string
  redirect_uri: string
  code_verifier: string
}

interface GitlabWebsiteName {
  name: string
}

interface GitlabCreateBranch {
  branch: string
  ref: string
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default class GitlabConnector implements StorageConnector {
  connectorId = 'gitlab'
  connectorType = ConnectorType.STORAGE
  displayName = 'GitLab'
  icon = 'http://gitlab.lcqb.upmc.fr/assets/favicon-075eba76312e8421991a0c1f89a89ee81678bcde72319dd3e8047e2a47cd3a42.ico'
  disableLogout = false
  color = '#ffffff'
  background = '#FC6D26'
  options: GitlabOptions

  constructor(private config: ServerConfig, opts: Partial<GitlabOptions>) {
    this.options = {
      branch: 'main',
      ...opts,
    } as GitlabOptions
    if(!this.options.clientId) throw new Error('Missing Gitlab client ID')
    if(!this.options.clientSecret) throw new Error('Missing Gitlab client secret')
  }

  // **
  // Convenience methods for the Gitlab API
  private async createFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64 = false): Promise<void> {
    // Remove leading slash
    const safePath = path.replace(/^\//, '')
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${safePath}`, 'POST', {
      id: websiteId,
      branch: this.options.branch,
      content,
      commit_message: `Create file ${path} from Silex`,
      encoding: isBase64 ? 'base64' : undefined,
    })
  }

  private async updateFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64 = false): Promise<void> {
    // Remove leading slash
    const safePath = path.replace(/^\//, '')
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${safePath}`, 'PUT', {
      id: websiteId,
      branch: this.options.branch,
      content: await contentToString(content),
      commit_message: `Update website asset ${path} from Silex`,
      encoding: isBase64 ? 'base64' : undefined,
    })
  }

  private async callApi(session: GitlabSession, path: string, method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'GET', body: GitlabWriteFile | GitlabGetToken | GitlabWebsiteName | GitlabCreateBranch | null = null, params: any = {}): Promise<any> {
    const token = session?.gitlab?.token
    const tokenParam = token ? `access_token=${token.access_token}&` : ''
    const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent((v as any).toString())}`).join('&')
    const url = `https://gitlab.com/${path}?${tokenParam}${paramsStr}`
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    })
    let json: { message: string, error: string } | any
    // Handle the case when the server returns an non-JSON response (e.g. 400 Bad Request)
    const text = await response.text()
    try {
      json = JSON.parse(text)
    } catch (e) {
      if(!response.ok) {
        // A real error
        throw e
      } else {
        // Useless error linked to the fact that the response is not JSON
        //console.error('Gitlab API error - could not parse response', response.status, response.statusText, {url, method, body, params, text})
        return text
      }
    }
    if(!response.ok) {
      if (response.status === 401 && session?.gitlab?.token?.refresh_token) {
        // Refresh the token
        const token = session?.gitlab?.token
        const body = {
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token,
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret,
        }
        const response = await fetch('https://gitlab.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        })
        const refreshJson = await response.json()
        if (response.ok) {
          session.gitlab.token = {
            ...token,
            ...refreshJson,
          }
          return await this.callApi(session, path, method, body as any, params)
        } else {
          //console.error('Gitlab API error - could not refresh token', response.status, response.statusText, { url, method, body, params, refreshJson })
          throw new ApiError(`Gitlab API error: ${refreshJson?.message ?? response.statusText}`, response.status)
        }
      } else {
        //console.error('Gitlab API error', response.status, response.statusText, { url, method, body, params, json })
        throw new ApiError(`Gitlab API error: ${json?.message ?? json?.error ?? response.statusText}`, response.status)
      }
    }
    return json
  }

  private generateCodeVerifier() {
    return crypto.randomBytes(64).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substr(0, 128)
  }

  private async generateCodeChallenge(verifier) {
    const hashed = createHash('sha256').update(verifier).digest()
    let base64Url = hashed.toString('base64')
    // Replace '+' with '-', '/' with '_', and remove '='
    base64Url = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    return base64Url
  }


  private getRedirect() {
    const params = `connectorId=${this.connectorId}&type=${this.connectorType}`
    return `${this.config.url}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?${params}`
  }

  /**
   * Get the OAuth URL to redirect the user to
   * The URL should look like
   * https://gitlab.example.com/oauth/authorize?client_id=APP_ID&redirect_uri=REDIRECT_URI&response_type=code&state=STATE&scope=REQUESTED_SCOPES&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
   * OAuth2 Step #1 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
   */
  async getOAuthUrl(session: GitlabSession): Promise<string> {
    const redirect_uri = encodeURIComponent(this.getRedirect())

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const codeVerifier = this.generateCodeVerifier()

    // Create the code challenge
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)

    // Store the code verifier and code challenge in the session
    session.gitlab = {
      ...session.gitlab,
      state,
      codeVerifier,
      codeChallenge,
    }
    const scope = 'api+read_api+read_user+read_repository+write_repository+email+sudo+profile+openid'
    return `https://gitlab.com/oauth/authorize?client_id=${this.options.clientId}&redirect_uri=${redirect_uri}&response_type=code&state=${session.gitlab.state}&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  }

  getOptions(formData: object): object {
    return {} // FIXME: store branch
  }

  async getLoginForm(session: GitlabSession, redirectTo: string): Promise<null> {
    return null
  }

  async getSettingsForm(session: GitlabSession, redirectTo: string): Promise<null> {
    return null
  }

  async isLoggedIn(session: GitlabSession): Promise<boolean> {
    return !!session?.gitlab?.token
  }

  /**
   * Get the token from return code
   * Set the token in the session
   * OAuth2 Step #2 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
   */
  async setToken(session: GitlabSession, loginResult: any): Promise<void> {
    if(!loginResult.state || loginResult.state !== session.gitlab?.state) throw new ApiError('Invalid state', 401)
    if(!session.gitlab?.codeVerifier) throw new ApiError('Missing code verifier', 401)
    if(!session.gitlab?.codeChallenge) throw new ApiError('Missing code challenge', 401)

    const token = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        code: loginResult.code,
        grant_type: 'authorization_code',
        redirect_uri: this.getRedirect(),
        code_verifier: session.gitlab.codeVerifier,
      }),
    })
      .then((response) => response.json())

    session.gitlab = { token, state: session.gitlab.state, codeVerifier: session.gitlab.codeVerifier, codeChallenge: session.gitlab.codeChallenge }

    // We need to get the user ID for listWebsites
    const user = await this.callApi(session, 'api/v4/user') as any
    session.gitlab.userId = user.id
  }

  async logout(session: GitlabSession): Promise<void> {
    delete session.gitlab
  }

  async getUser(session: GitlabSession): Promise<ConnectorUser> {
    const user = await this.callApi(session, 'api/v4/user') as any
    return {
      name: user.name,
      email: user.email,
      storage: await toConnectorData(session, this as StorageConnector),
    }
  }

  async listWebsites(session: GitlabSession): Promise<WebsiteMeta[]> {
    const projects = await this.callApi(session, `api/v4/users/${session.gitlab?.userId}/projects`) as any[]
    return projects.map(p => ({
      websiteId: p.id,
      name: p.name,
      createdAt: p.created_at,
      updatedAt: p.last_activity_at,
      connectorUserSettings: {},
    }))
  }

  async readWebsite(session: GitlabSession, websiteId: string): Promise<WebsiteData> {
    const result = await this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${WEBSITE_DATA_FILE}`, 'GET', null, {
      ref: this.options.branch,
    }) as any
    const { content } = result
    const contentDecoded = Buffer.from(content, 'base64').toString('utf8')
    const websiteData = JSON.parse(contentDecoded) as WebsiteData
    return websiteData
  }

  async createWebsite(session: GitlabSession, websiteMeta: WebsiteMetaFileContent): Promise<WebsiteId> {
    const project = await this.callApi(session, 'api/v4/projects/', 'POST', {
      name: websiteMeta.name,
    }) as any
    await this.createFile(session, project.id, WEBSITE_DATA_FILE, JSON.stringify({} as WebsiteData))
    await this.createFile(session, project.id, WEBSITE_META_DATA_FILE, JSON.stringify(websiteMeta))
    //await this.updateWebsite(session, project.id, {} as WebsiteData)
    //await this.setWebsiteMeta(session, project.id, websiteMeta)
    return project.id
  }

  async updateWebsite(session: GitlabSession, websiteId: WebsiteId, websiteData: WebsiteData): Promise<void> {
    const project = await this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${WEBSITE_DATA_FILE}`, 'PUT', {
      branch: this.options.branch,
      commit_message: 'Update website data from Silex',
      content: JSON.stringify(websiteData),
      file_path: WEBSITE_DATA_FILE,
      id: websiteId,
    })
  }

  async deleteWebsite(session: GitlabSession, websiteId: WebsiteId): Promise<void> {
    await this.callApi(session, `api/v4/projects/${websiteId}`, 'DELETE')
  }

  async getWebsiteMeta(session: GitlabSession, websiteId: WebsiteId): Promise<WebsiteMeta> {
    const project = await this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${WEBSITE_META_DATA_FILE}`) as any
    return {
      websiteId: project.id,
      name: project.name,
      createdAt: project.created_at,
      updatedAt: project.last_activity_at,
      connectorUserSettings: {},
    }
  }

  async setWebsiteMeta(session: GitlabSession, websiteId: WebsiteId, websiteMeta: WebsiteMetaFileContent): Promise<void> {
    const project = await this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${WEBSITE_META_DATA_FILE}`, 'PUT', {
      branch: this.options.branch,
      commit_message: 'Update website meta data from Silex',
      content: JSON.stringify(websiteMeta),
      file_path: WEBSITE_META_DATA_FILE,
      id: websiteId,
    })
  }

  async writeAssets(session: GitlabSession, websiteId: string, files: ConnectorFile[], status?: StatusCallback | undefined): Promise<void> {
    // For each file
    for (const file of files) {
      // Convert to base64
      const content = (await contentToBuffer(file.content)).toString('base64')
      try {
        await this.updateFile(session, websiteId, file.path, content, true)
      } catch (e) {
        // If the file does not exist, create it
        if (e.statusCode === 404 || e.message.endsWith('A file with this name doesn\'t exist')) {
          await this.createFile(session, websiteId, file.path, content, true)
        } else {
          throw e
        }
      }
    }
  }

  async readAsset(session: GitlabSession, websiteId: string, fileName: string): Promise<ConnectorFileContent> {
    // Remove leading slash
    const safePath = fileName.replace(/^\//, '')
    // Call the API
    const url = `https://gitlab.com/api/v4/projects/${websiteId}/repository/files/${safePath}?ref=${this.options.branch}&access_token=${session.gitlab?.token?.access_token}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await response.json()
    if(!response.ok) throw new ApiError(`Gitlab API error: ${json?.message ?? json?.error ?? response.statusText}`, response.status)
    // From base64 string to buffer
    const buf = Buffer.from(json.content, 'base64')
    return buf
  }

  async deleteAssets(session: GitlabSession, websiteId: string, fileNames: string[]): Promise<void> {
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/commits`, 'POST', {
      id: websiteId,
      branch: this.options.branch,
      commit_message: `Delete assets from Silex: ${fileNames.join(', ')}`,
      actions: fileNames.map(f => ({
        action: 'delete',
        file_path: f,
      })),
    })
  }
}
