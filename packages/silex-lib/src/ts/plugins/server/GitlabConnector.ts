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
import { ConnectorFile, ConnectorFileContent, StatusCallback, StorageConnector, contentToString, toConnectorData } from '../../server/connectors/connectors'
import { ApiError, ConnectorType, ConnectorUser, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent } from '../../types'
import fetch from 'node-fetch'
import crypto, { createHash } from 'crypto'

/**
 * Gitlab connector
 * @fileoverview Gitlab connector for Silex, connect to the user's Gitlab account to store websites
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 */

export interface GitlabOptions {
  clientId: string
  clientSecret: string
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
}

interface GitlabSession {
  gitlab?: GitlabToken
}

interface GitlabWriteFile {
  branch: string
  commit_message: string
  id: string
  actions?: {
    action: 'create' | 'delete' | 'move' | 'update'
    file_path: string
    content?: string
  }[]
  content?: string
  file_path?: string
}

interface GitlabGetToken {
  grant_type: 'authorization_code'
  client_id: string
  client_secret: string
  code: string
  redirect_uri: string
  code_verifier: string
}

export default class GitlabConnector implements StorageConnector {
  connectorId = 'gitlab'
  connectorType = ConnectorType.STORAGE
  displayName = 'GitLab'
  icon = 'http://gitlab.lcqb.upmc.fr/assets/favicon-075eba76312e8421991a0c1f89a89ee81678bcde72319dd3e8047e2a47cd3a42.ico'
  disableLogout = false

  constructor(private config: ServerConfig, private options: GitlabOptions) {
    if(!this.options.clientId) throw new Error('Missing Gitlab client ID')
    if(!this.options.clientSecret) throw new Error('Missing Gitlab client secret')
  }

  private async callApi(session: GitlabSession, path: string, method = 'GET', body: GitlabWriteFile | GitlabGetToken | null = null, params: any = {}): Promise<any> {
    const token = session?.gitlab?.token
    const tokenParam = token ? `access_token=${token.access_token}&` : ''
    const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent((v as any).toString())}`).join('&')
    const url = `https://gitlab.com/${path}?${tokenParam}${paramsStr}`
    console.log('Gitlab API call', url, method, body)
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        //'PRIVATE-TOKEN': token,
        //'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined
    })
    const json = await response.json()
    if(!response.ok) {
      throw new ApiError(`Gitlab API error: ${response.status} ${response.statusText}`, response.status)
    }
    return json
  }

  private generateCodeVerifier() {
    return crypto.randomBytes(64).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substr(0, 128);
  }

  private async generateCodeChallenge(verifier) {
    const hashed = createHash('sha256').update(verifier).digest();
    let base64Url = hashed.toString('base64');
    // Replace '+' with '-', '/' with '_', and remove '='
    base64Url = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return base64Url;
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
    const scope = `api+read_api+read_user+read_repository+write_repository+email+sudo+profile+openid`
    return `https://gitlab.com/oauth/authorize?client_id=${this.options.clientId}&redirect_uri=${redirect_uri}&response_type=code&state=${session.gitlab.state}&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  }

  getOptions(formData: object): object {
    console.log('getOptions', formData)
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
    const projects = await this.callApi(session, 'api/v4/projects') as any[]
    return projects.map(p => ({
      websiteId: p.id,
      name: p.name,
      createdAt: p.created_at,
      updatedAt: p.last_activity_at,
      connectorUserSettings: {},
    }))
  }

  async readWebsite(session: GitlabSession, websiteId: string): Promise<WebsiteData> {
    return this.callApi(session, `api/v4/projects/${websiteId}/files/${WEBSITE_DATA_FILE}`) as Promise<WebsiteData>
  }

  async createWebsite(session: GitlabSession, websiteMeta: WebsiteMetaFileContent): Promise<WebsiteId> {
    const project = await this.callApi(session, `api/v4/projects?name=${websiteMeta.name}`) as any
    return project.id
  }

  async updateWebsite(session: GitlabSession, websiteId: WebsiteId, websiteData: WebsiteData): Promise<void> {
    const project = await this.callApi(session, `api/v4/projects/${websiteId}/files/${WEBSITE_DATA_FILE}`, 'PUT', {
      branch: 'master', // FIXME: read this from settings
      commit_message: 'Update website data',
      content: JSON.stringify(websiteData),
      file_path: WEBSITE_DATA_FILE,
      id: websiteId,
    })
  }

  async deleteWebsite(session: GitlabSession, websiteId: WebsiteId): Promise<void> {
    await this.callApi(session, `api/v4/projects/${websiteId}`, 'DELETE')
  }

  async getWebsiteMeta(session: GitlabSession, websiteId: WebsiteId): Promise<WebsiteMeta> {
    const project = await this.callApi(session, `/api/v4projects/${websiteId}/files/${WEBSITE_META_DATA_FILE}`) as any
    return {
      websiteId: project.id,
      name: project.name,
      createdAt: project.created_at,
      updatedAt: project.last_activity_at,
      connectorUserSettings: {},
    }
  }

  async setWebsiteMeta(session: GitlabSession, websiteId: WebsiteId, websiteMeta: WebsiteMetaFileContent): Promise<void> {
    const project = await this.callApi(session, `/api/v4projects/${websiteId}/files/${WEBSITE_META_DATA_FILE}`, 'PUT', {
      branch: 'master', // FIXME: read this from settings
      commit_message: 'Update website meta data',
      content: JSON.stringify(websiteMeta),
      file_path: WEBSITE_META_DATA_FILE,
      id: websiteId,
    })
  }

  async writeAssets(session: GitlabSession, websiteId: string, files: ConnectorFile[], status?: StatusCallback | undefined): Promise<void> {
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/commits`, 'POST', {
      id: websiteId,
      branch: 'master', // FIXME: read this from settings
      commit_message: 'Update website assets',
      actions: await Promise.all(files.map(async f => ({
        action: 'create',
        file_path: f.path,
        content: await contentToString(f.content),
      }))),
    })
  }

  async readAsset(session: GitlabSession, websiteId: string, fileName: string): Promise<ConnectorFileContent> {
    return await this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${fileName}?ref=master`) as string
  }

  async deleteAssets(session: GitlabSession, websiteId: string, fileNames: string[]): Promise<void> {
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/commits`, 'POST', {
      id: websiteId,
      branch: 'master', // FIXME: read this from settings
      commit_message: 'Update website assets',
      actions: fileNames.map(f => ({
        action: 'delete',
        file_path: f,
      })),
    })
  }
}
