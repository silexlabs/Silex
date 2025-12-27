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

import { API_CONNECTOR_LOGIN_CALLBACK, API_CONNECTOR_PATH, API_PATH, WEBSITE_DATA_FILE, LEGACY_WEBSITE_PAGES_FOLDER, WEBSITE_PAGES_FOLDER } from '../../constants'
import { ServerConfig } from '../../server/config'
import { ConnectorFile, ConnectorFileContent, StatusCallback, StorageConnector, contentToBuffer, contentToString, toConnectorData } from '../../server/connectors/connectors'
import { ApiError, ConnectorType, ConnectorUser, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent, JobStatus, EMPTY_WEBSITE } from '../../types'
import fetch from 'node-fetch'
import crypto, { createHash } from 'crypto'
import { join } from 'path'
import { Agent } from 'https'
import { getPageSlug } from '../../page'
import e from 'express'
import { fork } from 'child_process'
import { Page } from 'grapesjs'
import { stringify, split, merge, getPagesFolder } from '../../server/utils/websiteDataSerialization'

/**
 * Gitlab connector
 * @fileoverview Gitlab connector for Silex, connect to the user's Gitlab account to store websites
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 */

const MAX_BATCH_UPLOAD_SIZE = 100
const MAX_BODY_SIZE_KB = 8 * 1000 * 1024 // 8MB (note that 10 MB PNG → becomes ~13.3 MB → ❌ often too big for Gitlab)
const WEBSITE_DATA_FILE_FORMAT_VERSION = '1.0.0'

export interface GitlabOptions {
  clientId: string
  clientSecret: string
  branch: string
  assetsFolder: string
  repoPrefix: string
  scope: string
  domain: string
  timeOut: number
  //metaRepo: string
  //metaRepoFile: string
}

export interface GitlabToken {
  state?: string
  codeVerifier?: string
  codeChallenge?: string
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
  username?: string
}

export type GitlabSession = Record<string, GitlabToken>

interface GitlabAction {
  action: 'create' | 'delete' | 'move' | 'update' | 'cherry-pick'
  file_path?: string
  content?: string
  commit_id?: string
  encoding?: 'base64' | 'text'
}

interface GitlabWriteFile {
  branch: string
  commit_message: string
  id?: string
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

interface GitlabGetTags {
  per_page?: number
}

interface GitlabCreateTag {
  tag_name: string
  ref: string
  message: string
}

interface GitlabFetchCommits {
  ref_name: string
  since: string
}


// interface MetaRepoFileContent {
//   websites: {
//     [websiteId: string]: {
//       meta: WebsiteMetaFileContent,
//       createdAt: string,
//       updatedAt: string,
//     }
//   }
// }

const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="1000"
   height="963.197"
   viewBox="0 0 1000 963.197"
   version="1.1"
   id="svg85">
  <sodipodi:namedview
     id="namedview87"
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1.0"
     inkscape:pageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="0"
     showgrid="false"
     inkscape:zoom="1"
     inkscape:cx="991.5"
     inkscape:cy="964.5"
     inkscape:window-width="1126"
     inkscape:window-height="895"
     inkscape:window-x="774"
     inkscape:window-y="12"
     inkscape:window-maximized="0"
     inkscape:current-layer="svg85" />
  <defs
     id="defs74">
    <style
       id="style72">.cls-1{fill:#e24329;}.cls-2{fill:#fc6d26;}.cls-3{fill:#fca326;}</style>
  </defs>
  <g
     id="LOGO"
     transform="matrix(5.2068817,0,0,5.2068817,-489.30756,-507.76085)">
    <path
       class="cls-1"
       d="m 282.83,170.73 -0.27,-0.69 -26.14,-68.22 a 6.81,6.81 0 0 0 -2.69,-3.24 7,7 0 0 0 -8,0.43 7,7 0 0 0 -2.32,3.52 l -17.65,54 h -71.47 l -17.65,-54 a 6.86,6.86 0 0 0 -2.32,-3.53 7,7 0 0 0 -8,-0.43 6.87,6.87 0 0 0 -2.69,3.24 L 97.44,170 l -0.26,0.69 a 48.54,48.54 0 0 0 16.1,56.1 l 0.09,0.07 0.24,0.17 39.82,29.82 19.7,14.91 12,9.06 a 8.07,8.07 0 0 0 9.76,0 l 12,-9.06 19.7,-14.91 40.06,-30 0.1,-0.08 a 48.56,48.56 0 0 0 16.08,-56.04 z"
       id="path76" />
    <path
       class="cls-2"
       d="m 282.83,170.73 -0.27,-0.69 a 88.3,88.3 0 0 0 -35.15,15.8 L 190,229.25 c 19.55,14.79 36.57,27.64 36.57,27.64 l 40.06,-30 0.1,-0.08 a 48.56,48.56 0 0 0 16.1,-56.08 z"
       id="path78" />
    <path
       class="cls-3"
       d="m 153.43,256.89 19.7,14.91 12,9.06 a 8.07,8.07 0 0 0 9.76,0 l 12,-9.06 19.7,-14.91 c 0,0 -17.04,-12.89 -36.59,-27.64 -19.55,14.75 -36.57,27.64 -36.57,27.64 z"
       id="path80" />
    <path
       class="cls-2"
       d="M 132.58,185.84 A 88.19,88.19 0 0 0 97.44,170 l -0.26,0.69 a 48.54,48.54 0 0 0 16.1,56.1 l 0.09,0.07 0.24,0.17 39.82,29.82 c 0,0 17,-12.85 36.57,-27.64 z"
       id="path82" />
  </g>
</svg>`
const encodedSvg = encodeURIComponent(svg)
const ICON = '/assets/gitlab.png'

export function computeGitBlobSha(content: string, binary: boolean): string {
  const contentBuffer = binary
    ? Buffer.from(content, 'base64')  // for binary files
    : Buffer.from(content, 'utf8')  // for text files

  const header = `blob ${contentBuffer.length}\0`
  const full = Buffer.concat([Buffer.from(header), contentBuffer as Buffer])
  return crypto.createHash('sha1').update(full).digest('hex')
}

function sanitizeGitlabPath(name: string): string {
  return name
    .normalize('NFD')                      // separate accents
    .replace(/[\u0300-\u036f]/g, '')       // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, '-')      // only allow allowed characters
    .replace(/^[-_.]+/, '')                // no starting '-', '_' or '.'
    .replace(/[-_.]+$/, '')                // no ending '-', '_' or '.'
    .replace(/\.git$|\.atom$/i, '')        // forbidden endings
    .toLowerCase()
}


export default class GitlabConnector implements StorageConnector {
  connectorId = 'gitlab'
  connectorType = ConnectorType.STORAGE
  displayName = 'GitLab'
  icon = ICON
  disableLogout = false
  color = '#2B1B63'
  background = 'rgba(252, 109, 38, 0.2)'
  options: GitlabOptions

  constructor(private config: ServerConfig, opts: Partial<GitlabOptions>) {
    this.options = {
      branch: 'main',
      assetsFolder: 'assets',
      //metaRepo: 'silex-meta',
      //metaRepoFile: 'websites.json',
      repoPrefix: 'silex_',
      scope: 'api', // 'api+read_api+read_user+read_repository+write_repository+email+sudo+profile+openid'
      ...opts,
    } as GitlabOptions
    if (!this.options.clientId) throw new Error('Missing Gitlab client ID')
    if (!this.options.clientSecret) throw new Error('Missing Gitlab client secret')
    if (!this.options.domain) throw new Error('Missing Gitlab domain')
    if (!this.options.timeOut) this.options.timeOut = 15000 /* default value */
  }

  // **
  // Convenience methods for the Gitlab API
  private getAssetPath(path: string, encode = true): string {
    const resolvedPath = join(this.options.assetsFolder, path)
    if (encode) return encodeURIComponent(resolvedPath)
    return resolvedPath
  }

  isUsingOfficialInstance(): boolean {
    const gitlabDomainRegexp = /(^|\b)(gitlab\.com)($|\b)/
    return gitlabDomainRegexp.test(this.options.domain)
  }

  async createFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64 = false): Promise<void> {
    // Remove leading slash
    const safePath = path.replace(/^\//, '')
    const encodePath = decodeURIComponent(path)
    return this.callApi({
      session,
      path: `api/v4/projects/${websiteId}/repository/files/${safePath}`,
      method: 'POST',
      requestBody: {
        id: websiteId,
        branch: this.options.branch,
        content,
        commit_message: `Create file ${encodePath} from Silex`,
        encoding: isBase64 ? 'base64' : undefined,
      }
    })
  }

  async updateFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64 = false): Promise<void> {
    // Remove leading slash
    const safePath = path.replace(/^\//, '')
    const encodePath = decodeURIComponent(path)
    return this.callApi({
      session,
      path: `api/v4/projects/${websiteId}/repository/files/${safePath}`,
      method: 'PUT',
      requestBody: {
        id: websiteId,
        branch: this.options.branch,
        content: await contentToString(content),
        commit_message: `Update website asset ${encodePath} from Silex`,
        encoding: isBase64 ? 'base64' : undefined,
      }
    })
  }

  async readFile(session: GitlabSession, websiteId: string, fileName: string): Promise<Buffer> {
    // Remove leading slash
    const safePath = fileName.replace(/^\//, '')
    return this.downloadRawFile(session, websiteId, safePath)
  }

  /**
   * Call the Gitlab API with the user's token and handle errors
   */
  async callApi({
    session,
    path,
    method = 'GET',
    requestBody = null,
    params = {},
    responseHeaders = {}, // Will get the response heaaders
  }: {
    session: GitlabSession,
    path: string,
    method?: 'POST' | 'GET' | 'PUT' | 'DELETE',
    requestBody?: GitlabWriteFile | GitlabGetToken | GitlabWebsiteName | GitlabCreateBranch | GitlabGetTags | GitlabCreateTag | GitlabFetchCommits | null,
    params?: any,
    responseHeaders?: any,
  }): Promise<any> {
    const token = this.getSessionToken(session).token
    const tokenParam = token ? `access_token=${token.access_token}&` : ''
    const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent((v as any).toString())}`).join('&')
    const url = `${this.options.domain}/${path}?${tokenParam}${paramsStr}`
    const headers = {
      'Content-Type': 'application/json',
    }
    if (method === 'GET' && requestBody) {
      console.error('[GitlabConnector] Invalid GET request: GET requests should not have a body', { url, method, body: requestBody, params })
    }
    // With or without body
    let response: Response
    const body = requestBody ? JSON.stringify(requestBody) : undefined
    try {
      if (body && Buffer.byteLength(body) > MAX_BODY_SIZE_KB * 1024) {
        console.warn('[GitlabConnector] Request body size exceeds Gitlab API limit', {
          size: Buffer.byteLength(body),
          maxAllowed: MAX_BODY_SIZE_KB * 1024,
          url,
          method,
          params,
          session,
        })
      }
      response = await fetch(url, requestBody && method !== 'GET' ? {
        agent: this.getAgent(),
        method,
        headers,
        body,
      } : {
        agent: this.getAgent(),
        method,
        headers,
      })
    } catch (e) {
      console.error('[GitlabConnector] Failed to reach Gitlab API endpoint', {
        error: e,
        url,
        method,
        body: requestBody,
        params,
        session,
        stack: e?.stack || new Error().stack,
      })
      throw new ApiError(`Could not reach Gitlab API: ${e.message || e}`, 500)
    }
    // Pass the response headers to the caller
    response.headers.forEach((value, name) => responseHeaders[name] = value)
    // Handle the case when the server returns a non-JSON response (e.g. 400 Bad Request)
    const text = await async function () {
      try {
        return await response.text()
      } catch (e) {
        console.error('[GitlabConnector] Failed to read response body from Gitlab API', {
          status: response.status,
          statusText: response.statusText,
          url,
          method,
          body: requestBody,
          params,
          error: e
        })
        throw new ApiError(`Gitlab API: Could not read response body (${e.message})`, 500)
      }
    }()
    if (!response.ok) {
      console.error('[GitlabConnector] Gitlab API responded with error status', {
        status: response.status,
        statusText: response.statusText,
        url,
        method,
        body: requestBody,
        params,
        responseText: text
      })
      if (text.includes('A file with this name doesn\'t exist')) {
        throw new ApiError('Gitlab API: File not found', 404)
      } else if (response.status === 401 && this.getSessionToken(session).token?.refresh_token) {
        // Refresh the token
        const token = this.getSessionToken(session).token
        const body = {
          grant_type: 'refresh_token',
          refresh_token: token?.refresh_token,
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret,
        }
        const response = await fetch(this.options.domain + '/oauth/token', {
          agent: this.getAgent(),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        })
        const refreshJson = await response.json()
        if (response.ok) {
          this.setSessionToken(session, {
            token: {
              ...token,
              ...refreshJson,
            },
          } as GitlabToken)
          return await this.callApi({
            session,
            path,
            method,
            requestBody: body as any,
            params,
            responseHeaders,
          })
        } else {
          const message = typeof refreshJson?.message === 'object' ? Object.entries(refreshJson.message).map(entry => entry.join(' ')).join(' ') : refreshJson?.message ?? refreshJson?.error ?? response.statusText
          console.error('[GitlabConnector] Failed to refresh Gitlab OAuth token', {
            status: response.status,
            statusText: response.statusText,
            message,
            refresh_token: token?.refresh_token
          })
          this.logout(session)
          throw new ApiError(`Gitlab API: Could not refresh token (${message})`, response.status)
        }
      } else {
        const message = response.statusText
        console.error('[GitlabConnector] Unhandled Gitlab API error response', {
          status: response.status,
          statusText: response.statusText,
          url,
          method,
          body: requestBody,
          params,
          responseText: text,
          message
        })
        throw new ApiError(`Gitlab API error: ${message} (${text})`, response.status)
      }
    }
    let json: { message: string, error: string } | any
    try {
      json = JSON.parse(text)
    } catch (e) {
      if (!response.ok) {
        throw e
      } else {
        console.error('[GitlabConnector] Response from Gitlab API is not valid JSON', {
          statusText: response.statusText,
          url,
          method,
          body: requestBody,
          params,
          responseText: text,
          error: e,
          session,
          stack: e?.stack || new Error().stack,
        })
        return text
      }
    }
    return json
  }

  async downloadRawFile(session: GitlabSession, projectId: string, filePath: string): Promise<Buffer> {
    const token = this.getSessionToken(session).token?.access_token
    const domain = this.options.domain
    const branch = this.options.branch

    // Construct the raw URL
    // GET /projects/:id/repository/files/:file_path/raw
    const rawUrl = `${domain}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${branch}&access_token=${token}`
    const fileRes = await fetch(rawUrl, {
      agent: this.getAgent(),
    })

    const contentType = fileRes.headers.get('content-type')
    if (contentType?.includes('text/html')) {
      const html = await fileRes.text()
      throw new ApiError('GitLab returned HTML instead of file (unauthorized or not found).', 401)
    }

    if (!fileRes.ok) {
      const errText = await fileRes.text()
      if (errText.includes('not found') || fileRes.status === 404) {
        console.error('[GitlabConnector] GitLab raw file not found', {
          status: fileRes.status,
          statusText: fileRes.statusText,
          url: rawUrl,
          responseText: errText
        })
        throw new ApiError(`GitLab raw file not found: filePath="${filePath}" (status ${fileRes.status})`, 404)
      }
      console.error('[GitlabConnector] Failed to fetch raw file from GitLab', {
        filePath,
        url: rawUrl,
        status: fileRes.status,
        statusText: fileRes.statusText,
        responseText: errText
      })
      throw new ApiError(`Failed to fetch raw file from GitLab: filePath="${filePath}" - ${fileRes.statusText} (${errText})`, fileRes.status)
    }

    try {
      const buffer = await fileRes.buffer()
      return buffer
    } catch (e) {
      console.error('[GitlabConnector] Error reading binary content from GitLab raw file', e)
      throw new ApiError('Failed to read binary content from GitLab raw file', 500)
    }
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

  // Force IPv4 when running locally
  private getAgent(): Agent | undefined {
    if (this.config.url.startsWith('http://localhost')) {
      return new Agent({
        family: 4,
      })
    }
    return undefined
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
    this.setSessionToken(session, {
      ...this.getSessionToken(session),
      state,
      codeVerifier,
      codeChallenge,
    })
    return `${this.options.domain}/oauth/authorize?client_id=${this.options.clientId}&redirect_uri=${redirect_uri}&response_type=code&state=${this.getSessionToken(session).state}&scope=${this.options.scope}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  }

  getSessionToken(session: GitlabSession | undefined): GitlabToken {
    return (session ?? {})[this.connectorId] ?? {}
  }
  setSessionToken(session: GitlabSession, token: GitlabToken): void {
    session[this.connectorId] = token
  }
  resetSessionToken(session: GitlabSession): void {
    delete session[this.connectorId]
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
    return !!this.getSessionToken(session).token
  }

  /**
   * Get the token from return code
   * Set the token in the session
   * OAuth2 Step #2 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
   */
  async setToken(session: GitlabSession, loginResult: any): Promise<void> {
    const sessionToken = this.getSessionToken(session)
    if (!loginResult.state || loginResult.state !== sessionToken?.state) {
      this.logout(session)
      throw new ApiError('Invalid state', 401)
    }
    if (!sessionToken?.codeVerifier) {
      this.logout(session)
      throw new ApiError('Missing code verifier', 401)
    }
    if (!sessionToken?.codeChallenge) {
      this.logout(session)
      throw new ApiError('Missing code challenge', 401)
    }

    const response = await fetch(this.options.domain + '/oauth/token', {
      agent: this.getAgent(),
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
        code_verifier: sessionToken.codeVerifier,
      }),
    })

    const token = await response.json()

    // Store the token in the session
    this.setSessionToken(session, {
      ...this.getSessionToken(session),
      token,
    })

    // We need to get the user ID for listWebsites
    const user = await this.callApi({
      session,
      path: 'api/v4/user'
    }) as any

    // Store the user details in the session
    this.setSessionToken(session, {
      ...this.getSessionToken(session),
      userId: user.id,
      username: user.username,
    })
  }

  async logout(session: GitlabSession): Promise<void> {
    this.resetSessionToken(session)
  }

  async getUser(session: GitlabSession): Promise<ConnectorUser> {
    const user = await this.callApi({
      session,
      path: 'api/v4/user'
    }) as any
    return {
      name: user.name,
      email: user.email,
      picture: user.avatar_url,
      storage: await toConnectorData(session, this as StorageConnector),
    }
  }

  async listWebsites(session: GitlabSession): Promise<WebsiteMeta[]> {
    const userId = this.getSessionToken(session).userId
    if (!userId) {
      this.logout(session)
      throw new ApiError('Missing Gitlab user ID. User not logged in?', 401)
    }
    // Handle multiple pages
    let page = 1
    let totalPages = 1
    const projects: any[] = []
    do {
      const responseHeaders: any = {}
      const pageProjects = await this.callApi({
        session,
        path: `api/v4/users/${userId}/projects`,
        params: {
          per_page: 100,
          page,
        },
        responseHeaders,
      }) as any[]
      projects.push(...pageProjects)
      page++
      // Get the total number of pages from the response headers
      const total = responseHeaders['x-total-pages']
      if (total) {
        totalPages = parseInt(total, 10)
      }
    } while (page <= totalPages)

    return projects
      .filter(
        p =>
          p.name.startsWith(this.options.repoPrefix) &&
          !p.marked_for_deletion_on &&
          !p.marked_for_deletion_at
      )
      .map(p => ({
        websiteId: p.id,
        name: p.name.replace(this.options.repoPrefix, ''),
        createdAt: p.created_at,
        updatedAt: p.last_activity_at,
        connectorUserSettings: {},
      }))
  }

  /**
   * Read the website data
   * The website data file is named `website.json` and the pages are named `page-{id}.json`
   * The pages are stored in the `src` folder by default
   */
  async readWebsite(session: GitlabSession, websiteId: string): Promise<WebsiteData> {
    const websiteDataBuf = await this.downloadRawFile(session, websiteId, WEBSITE_DATA_FILE)
    const websiteDataContent = websiteDataBuf.toString('utf8')

    // Use the common merge function to reconstruct website data
    const pageLoader = async (pagePath: string): Promise<string> => {
      const pageBuffer = await this.downloadRawFile(session, websiteId, pagePath)
      return pageBuffer.toString('utf8')
    }

    return await merge(websiteDataContent, pageLoader)
  }

  /**
   * Create a new website, i.e. a new Gitlab repository with an empty website data file
   */
  async createWebsite(session: GitlabSession, websiteMeta: WebsiteMetaFileContent): Promise<WebsiteId> {
    const project = await this.callApi({
      session,
      path: 'api/v4/projects/',
      method: 'POST',
      requestBody: {
        name: this.options.repoPrefix + websiteMeta.name,
      }
    }) as any
    await this.createFile(session, project.id, WEBSITE_DATA_FILE, stringify(EMPTY_WEBSITE))
    //await this.createFile(session, project.id, WEBSITE_META_DATA_FILE, JSON.stringify(websiteMeta))
    //await this.updateWebsite(session, project.id, {} as WebsiteData)
    //await this.setWebsiteMeta(session, project.id, websiteMeta)
    return project.id
  }

  /**
   * Update the website data
   * Split the website data into 1 file per page + 1 file for the website data itself
   * Use gitlab batch API to create/update the files
   */
  async updateWebsite(session: GitlabSession, websiteId: WebsiteId, websiteData: WebsiteData): Promise<void> {
    const batchActions: GitlabAction[] = []

    // **
    // Handle the legacy sites that have no pagesFolder
    // We want them to use "pages/" by default despite their files being in "src/" for now
    let isLegacySite = !websiteData.pagesFolder

    // **
    // Backward compatibility case
    // The second time a legacy site is saved, the new `pages/` folder has been created
    // but the front end still doesn't have the `pagesFolder` key
    // This will be the case until the front end reloads
    if (isLegacySite) {
      const rootFiles = await this.ls({
        session,
        websiteId,
        path: WEBSITE_PAGES_FOLDER,
        recursive: false,
      })
      if (rootFiles.size) {
        // Here the new `pages/` folder has been created already
        isLegacySite = false
        websiteData.pagesFolder = WEBSITE_PAGES_FOLDER
      }
    }

    // **
    // List existing files in the OLD pages folder (to detect files to delete)
    const existingFiles = await this.ls({
      session,
      websiteId,
      path: getPagesFolder(websiteData),
      recursive: false,
    })

    // **
    // Force pagesFolder to 'pages' for writing if not defined
    if (isLegacySite) {
      websiteData.pagesFolder = WEBSITE_PAGES_FOLDER
    }

    // **
    // Use the common split function to create files
    const filesToWrite = split(websiteData)

    // **
    // Process each file to create/update
    for (const file of filesToWrite) {
      const filePath = file.path
      const content = file.content
      const newSha = computeGitBlobSha(content, false)

      const existingSha = existingFiles.get(filePath) || (filePath === WEBSITE_DATA_FILE ? 'always-update' : undefined)

      if (existingSha) {
        if (existingSha !== newSha) {
          batchActions.push({
            action: 'update',
            file_path: filePath,
            content,
          })
        } // else: skip unchanged file
      } else {
        batchActions.push({
          action: 'create',
          file_path: filePath,
          content,
        })
      }
    }

    // **
    // Delete pages that are not in the new website data
    const pathsToWrite = filesToWrite.map(f => f.path)
    for (const filePath of existingFiles.keys()) {
      if (!pathsToWrite.includes(filePath)) {
        batchActions.push({
          action: 'delete',
          file_path: filePath,
        })
      }
    }

    // **
    // Perform a batch commit
    return this.callApi({
      session,
      path: `api/v4/projects/${websiteId}/repository/commits`,
      method: 'POST',
      requestBody: {
        branch: this.options.branch,
        commit_message: 'Update website data from Silex',
        actions: batchActions,
      },
    })
  }


  async deleteWebsite(session: GitlabSession, websiteId: WebsiteId): Promise<void> {
    // Delete repo
    await this.callApi({
      session,
      path: `api/v4/projects/${websiteId}`,
      method: 'DELETE',
    })
  }

  // Fork the repo (user's own project)
  async duplicateWebsite(session: GitlabSession, websiteId: string): Promise<void> {
    const meta = await this.getWebsiteMeta(session, websiteId)

    const forkName = `${meta.name} Copy ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).substring(2, 4)}`
    const safePath = sanitizeGitlabPath(forkName)

    const forkedProject = await this.callApi({
      session,
      path: `api/v4/projects/${websiteId}/fork`,
      method: 'POST',
      requestBody: {
        name: this.options.repoPrefix + forkName,
        /* @ts-ignore */
        path: safePath,
        /* @ts-ignore */
        namespace: meta.namespace?.id || undefined,
      },
    })

    return forkedProject.id
  }

  /**
   * Fork an external/public GitLab project (from any user/organization)
   * @param session - The user session
   * @param gitlabUrl - The GitLab URL or path (e.g., "https://gitlab.com/user/repo" or "user/repo")
   * @returns The new website ID (project ID)
   */
  async forkWebsite(session: GitlabSession, gitlabUrl: string): Promise<string> {
    // Parse the GitLab URL to extract the project path
    // Supports formats:
    // - https://gitlab.com/user/repo
    // - https://gitlab.com/user/repo.git
    // - gitlab.com/user/repo
    // - user/repo
    let projectPath = gitlabUrl
      .replace(/\.git$/, '') // Remove .git suffix
      .replace(/\/$/, '') // Remove trailing slash

    // Extract path from full URL
    const urlMatch = projectPath.match(/(?:https?:\/\/)?(?:[\w.-]+\/)?(.+)/)
    if (urlMatch) {
      // Check if it's a full URL with domain
      const domainMatch = projectPath.match(/(?:https?:\/\/)?([\w.-]+)\/(.+)/)
      if (domainMatch) {
        const [, domain, path] = domainMatch
        // If domain matches our configured domain, use just the path
        const configuredDomain = this.options.domain.replace(/^https?:\/\//, '')
        if (domain === configuredDomain || domain === 'gitlab.com') {
          projectPath = path
        } else {
          // Different GitLab instance - not supported
          throw new ApiError(`Cannot fork from a different GitLab instance (${domain}). Only ${configuredDomain} is supported.`, 400)
        }
      }
    }

    // URL-encode the project path for the API
    const encodedPath = encodeURIComponent(projectPath)

    // First, get the source project info to extract its name
    let sourceProject: any
    try {
      sourceProject = await this.callApi({
        session,
        path: `api/v4/projects/${encodedPath}`,
        method: 'GET',
      })
    } catch (e) {
      if (e.httpStatusCode === 404) {
        throw new ApiError(`Project not found: ${projectPath}. Make sure the project exists and is public or you have access to it.`, 404)
      }
      throw e
    }

    // Generate a unique name for the fork
    const sourceName = sourceProject.name.replace(this.options.repoPrefix, '')
    const forkName = `${sourceName} ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).substring(2, 4)}`
    const safePath = sanitizeGitlabPath(this.options.repoPrefix + forkName)

    // Fork the project to the user's namespace
    const forkedProject = await this.callApi({
      session,
      path: `api/v4/projects/${encodedPath}/fork`,
      method: 'POST',
      requestBody: {
        name: this.options.repoPrefix + forkName,
        /* @ts-ignore */
        path: safePath,
      },
    })

    return forkedProject.id.toString()
  }


  async getWebsiteMeta(session: GitlabSession, websiteId: WebsiteId): Promise<WebsiteMeta> {
    const project = await this.callApi({
      session,
      path: `api/v4/projects/${websiteId}`
    })
    return {
      websiteId,
      name: project.name.replace(this.options.repoPrefix, ''),
      imageUrl: project.avatar_url,
      createdAt: project.created_at,
      updatedAt: project.last_activity_at,
      connectorUserSettings: {},
    }
  }

  async setWebsiteMeta(session: GitlabSession, websiteId: WebsiteId, websiteMeta: WebsiteMetaFileContent): Promise<void> {
    // Rename the repo if needed
    const oldMeta = await this.getWebsiteMeta(session, websiteId)
    if (websiteMeta.name !== oldMeta.name) {
      await this.callApi({
        session,
        path: `api/v4/projects/${websiteId}`,
        method: 'PUT',
        requestBody: {
          name: this.options.repoPrefix + websiteMeta.name,
        }
      })
    }
  }

  async writeAssets(session: GitlabSession, websiteId: string, files: ConnectorFile[], status?: StatusCallback, removeUnlisted = false): Promise<void> {
    status && await status({ message: `Preparing ${files.length} files`, status: JobStatus.IN_PROGRESS })

    // List all the files in assets folder
    const existingFiles = await this.ls({
      session,
      websiteId,
      recursive: true,
      path: this.options.assetsFolder,
    })

    // Create the actions for the batch
    const filesToUpload = [] as GitlabAction[]
    const filesToKeep = new Set(files.map(file => this.getAssetPath(file.path, false)))

    for (const file of files) {
      const filePath = this.getAssetPath(file.path, false)
      const content = (await contentToBuffer(file.content)).toString('base64')
      const existingSha = existingFiles.get(filePath)
      const newSha = computeGitBlobSha(content, true)
      if (existingSha) {
        if (existingSha !== newSha) {
          filesToUpload.push({
            action: 'update',
            file_path: filePath,
            content,
            encoding: 'base64',
          })
        } // else: skip unchanged file
      } else {
        filesToUpload.push({
          action: 'create',
          file_path: filePath,
          content,
          encoding: 'base64',
        })
      }
    }

    // Optionally remove unlisted files
    if (removeUnlisted) {
      for (const [existingFilePath] of existingFiles) {
        if (!filesToKeep.has(existingFilePath)) {
          filesToUpload.push({
            action: 'delete',
            file_path: existingFilePath,
          })
        }
      }
    }

    // Split the files into chunks to avoid the number of files limit
    const chunks: GitlabAction[][] = []
    for (let i = 0; i < filesToUpload.length; i += MAX_BATCH_UPLOAD_SIZE) {
      chunks.push(filesToUpload.slice(i, i + MAX_BATCH_UPLOAD_SIZE))
    }

    // Notify the user if nothing changed
    if (chunks.length === 0) {
      console.info('No files to upload')
      status && await status({ message: 'No files to upload', status: JobStatus.SUCCESS })
      return
    }

    // Upload the files in chunks
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]
      if (chunks.length > 1) {
        status && await status({ message: `Batch ${chunkIndex + 1}/${chunks.length}: Uploading ${chunk.length} files`, status: JobStatus.IN_PROGRESS })
      } else {
        status && await status({ message: `Uploading ${files.length} file(s)`, status: JobStatus.IN_PROGRESS })
      }
      try {
        await this.callApi({
          session,
          path: `api/v4/projects/${websiteId}/repository/commits`,
          method: 'POST',
          requestBody: {
            branch: 'main',
            commit_message: `Batch update assets (${chunkIndex + 1}/${chunks.length})`,
            actions: chunk,
          }
        })
      } catch (e) {
        console.error(`Batch ${chunkIndex + 1} failed`, e)
        status && await status({ message: `Error in batch ${chunkIndex + 1}`, status: JobStatus.ERROR })
        throw e
      }
    }

    status && await status({ message: `All ${files.length} files uploaded`, status: JobStatus.SUCCESS })
  }

  async readAsset(session: GitlabSession, websiteId: string, fileName: string): Promise<ConnectorFileContent> {
    const finalPath = this.getAssetPath(fileName, false)
    return this.readFile(session, websiteId, finalPath)
  }

  async deleteAssets(session: GitlabSession, websiteId: string, fileNames: string[]): Promise<void> {
    return this.callApi({
      session,
      path: `api/v4/projects/${websiteId}/repository/commits`,
      method: 'POST',
      requestBody: {
        id: websiteId,
        branch: this.options.branch,
        commit_message: `Delete assets from Silex: ${fileNames.join(', ')}`,
        actions: fileNames.map(f => ({
          action: 'delete',
          file_path: this.getAssetPath(f),
        })),
      }
    })
  }

  /*
   * Get the meta repo path for the current user
   * The meta repo contains a JSON file which contains the list of websites
   */
  //private getMetaRepoPath(session: GitlabSession): string {
  //  if(!this.getSessionToken(session).username) throw new ApiError('Missing Gitlab user ID. User not logged in?', 401)
  //  return encodeURIComponent(`${this.getSessionToken(session).username}/${this.options.metaRepo}`)
  //}

  ///**
  // * Initialize the storage with a meta repo
  // */
  //private async initStorage(session: GitlabSession): Promise<void> {
  //  // Create the meta repo
  //  try {
  //    const project = await this.callApi(session, 'api/v4/projects/', 'POST', {
  //      name: this.options.metaRepo,
  //    }) as any
  //    return this.createFile(session, this.getMetaRepoPath(session), this.options.metaRepoFile, JSON.stringify({
  //      websites: {}
  //    } as MetaRepoFileContent))
  //  } catch (e) {
  //    console.error('Could not init storage', e.statusCode, e.httpStatusCode, e)
  //    throw e
  //  }
  //}

  /**
   * List all the files in a folder
   * The result is a map of file paths to their SHA
   */
  protected async ls({
    session,
    websiteId,
    recursive = false,
    path,
  }: {
    session: GitlabSession,
    websiteId: string,
    recursive?: boolean,
    path?: string,
  }): Promise<Map<string, string>> {
    const existingPaths = new Map<string, string>()
    let page = 1
    let keepGoing = true
    while (keepGoing) {
      const responseHeaders: any = {}
      let tree: any[] = []
      try {
        const params = {
          recursive,
          per_page: 100,
          page,
        } as any
        if (path) params.path = path
        tree = await this.callApi({
          session,
          path: `api/v4/projects/${websiteId}/repository/tree`,
          method: 'GET',
          params,
          responseHeaders,
        })
      } catch (e) {
        // Allow 404 errors
        // This happens when the folder does not exist
        // In git this just means the files don't exist yet
        if (e.statusCode !== 404 && e.httpStatusCode !== 404) {
          throw e
        }
      }

      // Filter the files
      tree
        .filter(item => item.type === 'blob')
        .forEach(item => existingPaths.set(item.path, item.id))

      // Check if we need to keep going
      const maxPages = responseHeaders['x-total-pages'] ? parseInt(responseHeaders['x-total-pages'], 10) : 1
      keepGoing = page < maxPages
      page++
    }
    // Return the set of existing paths
    return existingPaths
  }
}
