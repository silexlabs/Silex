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

import { API_CONNECTOR_LOGIN_CALLBACK, API_CONNECTOR_PATH, API_PATH, WEBSITE_DATA_FILE, WEBSITE_PAGES_FOLDER } from '../../constants'
import { ServerConfig } from '../../server/config'
import { ConnectorFile, ConnectorFileContent, StatusCallback, StorageConnector, contentToBuffer, contentToString, toConnectorData } from '../../server/connectors/connectors'
import { ApiError, ConnectorType, ConnectorUser, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent, JobStatus, Page } from '../../types'
import fetch from 'node-fetch'
import crypto, { createHash } from 'crypto'
import { join } from 'path'
import { Agent } from 'https'
import { getPageSlug } from '../../page'

/**
 * Gitlab connector
 * @fileoverview Gitlab connector for Silex, connect to the user's Gitlab account to store websites
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 */

const MAX_BATCH_UPLOAD_SIZE = 100
const MAX_BODY_SIZE_KB = 8 * 1000 * 1024 // 8MB (note that 10 MB PNG → becomes ~13.3 MB → ❌ often too big for Gitlab)

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

interface GitlabPage {
  id: string
  name: string
  isFile: true
}

interface GitlabWebsiteData {
  pages: GitlabPage[]
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
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${safePath}`, 'POST', {
      id: websiteId,
      branch: this.options.branch,
      content,
      commit_message: `Create file ${encodePath} from Silex`,
      encoding: isBase64 ? 'base64' : undefined,
    })
  }

  async updateFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64 = false): Promise<void> {
    // Remove leading slash
    const safePath = path.replace(/^\//, '')
    const encodePath = decodeURIComponent(path)
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${safePath}`, 'PUT', {
      id: websiteId,
      branch: this.options.branch,
      content: await contentToString(content),
      commit_message: `Update website asset ${encodePath} from Silex`,
      encoding: isBase64 ? 'base64' : undefined,
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
  async callApi(session: GitlabSession, path: string, method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'GET', requestBody: GitlabWriteFile | GitlabGetToken | GitlabWebsiteName | GitlabCreateBranch | GitlabGetTags | GitlabCreateTag | GitlabFetchCommits | null = null, params: any = {}): Promise<any> {
    const token = this.getSessionToken(session).token
    const tokenParam = token ? `access_token=${token.access_token}&` : ''
    const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent((v as any).toString())}`).join('&')
    const url = `${this.options.domain}/${path}?${tokenParam}${paramsStr}`
    const headers = {
      'Content-Type': 'application/json',
    }
    if (method === 'GET' && requestBody) {
      console.error('Gitlab API error (4) - GET request with body', { url, method, body: requestBody, params })
    }
    // With or without body
    let response
    const body = requestBody ? JSON.stringify(requestBody) : undefined
    try {
      if(body && Buffer.byteLength(body) > MAX_BODY_SIZE_KB * 1024) {
        // TODO: warn the end user
        console.warn('Gitlab API warning - body too big', Buffer.byteLength(body), 'bytes', { url, method, params })
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
      console.error('Gitlab API error (0)', e)
      throw new ApiError(`Gitlab API error (0): ${e.message} ${e.text} ${e.code} ${e.name} ${e.type}`, 500)
    }
    // Handle the case when the server returns a non-JSON response (e.g. 400 Bad Request)
    const text = await async function () {
      try {
        return await response.text()
      } catch (e) {
        console.error('Gitlab API error (6) - could not parse response', response.status, response.statusText, { url, method, body: requestBody, params }, e)
        throw new ApiError(`Gitlab API error (6): response body not available. ${e.message}`, 500)
      }
    }()
    if (!response.ok) {
      console.error('Gitlab API error (7) - response not ok', response.status, response.statusText, { url, method, body: requestBody, params, text: text })
      if (text.includes('A file with this name doesn\'t exist')) {
        throw new ApiError('Gitlab API error (5): Not Found', 404)
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
          return await this.callApi(session, path, method, body as any, params)
        } else {
          const message = typeof refreshJson?.message === 'object' ? Object.entries(refreshJson.message).map(entry => entry.join(' ')).join(' ') : refreshJson?.message ?? refreshJson?.error ?? response.statusText
          console.error('Gitlab API error (2) - could not refresh token', response.status, response.statusText, { message }, 'refresh_token:', token?.refresh_token)
          // Workaround for when the token is invalid
          // It happens often which is not normal (refresh token should last 6 months)
          this.logout(session)
          // Notify the user
          throw new ApiError(`Gitlab API error (2): ${message}`, response.status)
        }
      } else {
        const message = response.statusText
        console.error('Gitlab API error (1)', response.status, response.statusText, { url, method, body: requestBody, params, text: text, message })
        throw new ApiError(`Gitlab API error (1): ${message} (${text})`, response.status)
      }
    }
    let json: { message: string, error: string } | any
    try {
      json = JSON.parse(text)
    } catch (e) {
      if (!response.ok) {
        // A real error
        throw e
      } else {
        // Useless error linked to the fact that the response is not JSON
        console.error('Gitlab API error (3) - could not parse response', response.status, response.statusText, { url, method, body: requestBody, params, text: text })
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
        throw new ApiError('GitLab raw error (5): Not Found', 404)
      }
      console.error('GitLab raw error (1)', fileRes.status, fileRes.statusText, { rawUrl, errText })
      throw new ApiError(`GitLab raw error (1): ${fileRes.statusText} (${errText})`, fileRes.status)
    }

    try {
      const buffer = await fileRes.buffer()
      return buffer
    } catch (e) {
      console.error('GitLab raw error (3): could not read buffer', e)
      throw new ApiError('GitLab raw error (3): failed to read binary content', 500)
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
    const user = await this.callApi(session, 'api/v4/user') as any

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
    const user = await this.callApi(session, 'api/v4/user') as any
    return {
      name: user.name,
      email: user.email,
      picture: user.avatar_url,
      storage: await toConnectorData(session, this as StorageConnector),
    }
  }

  async listWebsites(session: GitlabSession): Promise<WebsiteMeta[]> {
    //try {
    //  const result = await this.callApi(session, `api/v4/projects/${this.getMetaRepoPath(session)}/repository/files/${this.options.metaRepoFile}`, 'GET', null, {
    //    ref: this.options.branch,
    //  })
    //  const { content } = result
    //  const contentDecoded = Buffer.from(content, 'base64').toString('utf8')
    //  const websites = (JSON.parse(contentDecoded) as MetaRepoFileContent).websites
    //  return Object.entries(websites).map(([websiteId, {meta, createdAt, updatedAt}]) => ({
    //    websiteId,
    //    createdAt: new Date(createdAt),
    //    updatedAt: new Date(updatedAt),
    //    ...meta,
    //  }))
    //} catch (e) {
    //  console.error('Could not list websites', e.statusCode, e.httpStatusCode, e.code)
    //  if (e.statusCode === 404 || e.httpStatusCode === 404) {
    //    await this.initStorage(session)
    //    return []
    //  } else {
    //    throw e
    //  }
    //}
    const userId = this.getSessionToken(session).userId
    if (!userId) {
      this.logout(session)
      throw new ApiError('Missing Gitlab user ID. User not logged in?', 401)
    }
    const projects = await this.callApi(session, `api/v4/users/${userId}/projects`) as any[]
    return projects
      .filter(p => p.name.startsWith(this.options.repoPrefix))
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
    const websiteData = JSON.parse(websiteDataBuf.toString('utf8')) as GitlabWebsiteData | WebsiteData

    // If the website pages are not in the main file, we need to read them
    // This happens when the website was just created
    // Let grapesjs create the pages in the frontend
    if (!websiteData.pages) {
      return websiteData as WebsiteData
    }

    // Load each page in parallel
    const pages = await Promise.all(websiteData.pages.map(async (page: GitlabPage | Page) => {
      if ((page as GitlabPage).isFile) {
        const name = getPageSlug(page.name)
        const fileName = (`${(getPageSlug(page.name))}-${page.id}`)
        const filePath = `${WEBSITE_PAGES_FOLDER}/${fileName}.json`
        const pageContent = await this.downloadRawFile(session, websiteId, filePath)
        const res = JSON.parse(pageContent.toString('utf8')) as Page
        return res
      }
      return page as Page
    }))

    // Read each page file if needed
    return {
      ...websiteData,
      pages,
    } as WebsiteData
  }

  /**
   * Create a new website, i.e. a new Gitlab repository with an empty website data file
   */
  async createWebsite(session: GitlabSession, websiteMeta: WebsiteMetaFileContent): Promise<WebsiteId> {
    const project = await this.callApi(session, 'api/v4/projects/', 'POST', {
      name: this.options.repoPrefix + websiteMeta.name,
    }) as any
    await this.createFile(session, project.id, WEBSITE_DATA_FILE, JSON.stringify({} as WebsiteData))
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

    // List existing files in the pages folder
    let existingFiles: string[] = []
    try {
      const files = await this.callApi(session, `api/v4/projects/${websiteId}/repository/tree`, 'GET', null, {
        path: WEBSITE_PAGES_FOLDER,
        recursive: false,
      }) as any[]
      existingFiles = files.map(file => file.path)
    } catch (e) {
      if (e.statusCode !== 404 && e.httpStatusCode !== 404) {
        throw e
      }
    }

    // Prepare actions for each page
    const pages = websiteData.pages.map((page: Page) => {
      const file_name = encodeURIComponent(`${(getPageSlug(page.name))}-${page.id}`)
      const file_path = (`${WEBSITE_PAGES_FOLDER}/${file_name}.json`)
      const content = JSON.stringify(page)

      // Determine whether to create or update the file
      if (existingFiles.includes(file_path)) {
        batchActions.push({
          action: 'update',
          file_path,
          content,
        })
      } else {
        batchActions.push({
          action: 'create',
          file_path,
          content,
        })
      }

      return {
        name: page.name,
        id: page.id,
        isFile: true,
      }
    })

    // Prepare the main website data file
    const websiteDataWithGitlabPages = {
      ...websiteData,
      pages,
    } as GitlabWebsiteData

    batchActions.push({
      action: 'update',
      file_path: WEBSITE_DATA_FILE,
      content: JSON.stringify(websiteDataWithGitlabPages),
    })

    // Perform a single batch commit
    const batch = {
      branch: this.options.branch,
      commit_message: 'Update website data from Silex',
      actions: batchActions,
    }

    await this.callApi(session, `api/v4/projects/${websiteId}/repository/commits`, 'POST', batch)
  }

  async deleteWebsite(session: GitlabSession, websiteId: WebsiteId): Promise<void> {
    // Delete repo
    await this.callApi(session, `api/v4/projects/${websiteId}`, 'DELETE')
    //// Load the meta repo data
    //const file = await this.callApi(session, `api/v4/projects/${this.getMetaRepoPath(session)}/repository/files/${this.options.metaRepoFile}`, 'GET', null, {
    //  ref: this.options.branch,
    //})
    //const metaRepo = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) as MetaRepoFileContent
    //const data = metaRepo.websites[websiteId]
    //if(!data) throw new ApiError(`Website ${websiteId} not found`, 404)
    //// Update or create the website meta data
    //delete metaRepo.websites[websiteId]
    //// Save the meta repo data
    //const project = await this.callApi(session, `api/v4/projects/${this.getMetaRepoPath(session)}/repository/files/${this.options.metaRepoFile}`, 'PUT', {
    //  branch: this.options.branch,
    //  commit_message: `Delete meta data of ${data.meta.name} (${websiteId}) from Silex`,
    //  content: JSON.stringify(metaRepo),
    //})
  }

  async duplicateWebsite(session: GitlabSession, websiteId: string): Promise<void> {
    // Get the repo meta data
    const meta = await this.getWebsiteMeta(session, websiteId)
    // List all the repository files
    const blobs = await this.callApi(session, `api/v4/projects/${websiteId}/repository/tree`, 'GET', null, {
      recursive: true,
    })
    const files = blobs
      .filter(item => item.type === 'blob')
      .map(item => item.path)
    // Create a new repo
    const newId = await this.createWebsite(session, {
      ...meta,
      name: meta.name + ' Copy ' + new Date().toISOString().replace(/T.*/, '') + ' ' + Math.random().toString(36).substring(2, 4),
    })
    // Upload all files
    for (const file of files) {
      const content = await this.readFile(session, websiteId, file)
      // From buffer to string
      const contentStr = content.toString('base64')
      const path = encodeURIComponent(file)
      switch (file) {
      case WEBSITE_DATA_FILE:
        await this.updateFile(session, newId, path, contentStr, true)
        break
      default:
        await this.createFile(session, newId, path, contentStr, true)
      }
    }
  }

  async getWebsiteMeta(session: GitlabSession, websiteId: WebsiteId): Promise<WebsiteMeta> {
    //const file = await this.callApi(session, `api/v4/projects/${this.getMetaRepoPath(session)}/repository/files/${this.options.metaRepoFile}`, 'GET', null, {
    //  ref: this.options.branch,
    //})
    //const metaRepo = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) as MetaRepoFileContent
    //if(!metaRepo.websites[websiteId]) throw new ApiError(`Website ${websiteId} not found`, 404)
    //return {
    //  websiteId,
    //  createdAt: new Date(metaRepo.websites[websiteId].createdAt),
    //  updatedAt: new Date(metaRepo.websites[websiteId].updatedAt),
    //  ...metaRepo.websites[websiteId].meta,
    //}
    // const response = await this.callApi(session, `api/v4/projects/${websiteId}/repository/files/${WEBSITE_META_DATA_FILE}`, 'GET', null, {
    //   ref: this.options.branch,
    // }) as any
    // Base64 to string to JSON
    // const contentDecoded = Buffer.from(response.content, 'base64').toString('utf8')
    // const websiteMeta = JSON.parse(contentDecoded) as WebsiteMetaFileContent
    const project = await this.callApi(session, `api/v4/projects/${websiteId}`)
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
      await this.callApi(session, `api/v4/projects/${websiteId}`, 'PUT', {
        name: this.options.repoPrefix + websiteMeta.name,
      })
    }
  }

  async writeAssets(session: GitlabSession, websiteId: string, files: ConnectorFile[], status?: StatusCallback): Promise<void> {
    status && await status({ message: `Preparing ${files.length} files`, status: JobStatus.IN_PROGRESS })

    // List all the files in the repo
    const existingPaths = new Set<string>()
    let page = 1
    let keepGoing = true
    while (keepGoing) {
      const tree = await this.callApi(session, `api/v4/projects/${websiteId}/repository/tree`, 'GET', null, {
        recursive: true,
        per_page: 100,
        page,
      })
      for (const f of tree) {
        if (f.type === 'blob') existingPaths.add(f.path)
      }
      keepGoing = tree.length === 100
      page++
    }

    // Split the files into chunks to avoid the number of files limit
    const chunks: ConnectorFile[][] = []
    for (let i = 0; i < files.length; i += MAX_BATCH_UPLOAD_SIZE) {
      chunks.push(files.slice(i, i + MAX_BATCH_UPLOAD_SIZE))
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]
      if (chunks.length > 1) {
        status && await status({ message: `Batch ${chunkIndex + 1}/${chunks.length}: Downloading ${chunk.length} files`, status: JobStatus.IN_PROGRESS })
      } else {
        status && await status({ message: `Downloading ${files.length} file`, status: JobStatus.IN_PROGRESS })
      }

      // Create the actions for the batch
      const actions = await Promise.all(
        chunk.map(async (file) => {
          const content = (await contentToBuffer(file.content)).toString('base64')
          const file_path = this.getAssetPath(file.path, false)
          const actionType = existingPaths.has(file_path) ? 'update' : 'create'
          return {
            action: actionType,
            file_path,
            content,
            encoding: 'base64',
          }
        })
      ) as GitlabAction[]

      if (chunks.length > 1) {
        status && await status({ message: `Batch ${chunkIndex + 1}/${chunks.length}: Uploading ${chunk.length} files`, status: JobStatus.IN_PROGRESS })
      } else {
        status && await status({ message: `Uploading ${files.length} file`, status: JobStatus.IN_PROGRESS })
      }
      try {
        await this.callApi(session, `api/v4/projects/${websiteId}/repository/commits`, 'POST', {
          branch: 'main',
          commit_message: `Batch update assets (${chunkIndex + 1}/${chunks.length})`,
          actions,
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
    return this.callApi(session, `api/v4/projects/${websiteId}/repository/commits`, 'POST', {
      id: websiteId,
      branch: this.options.branch,
      commit_message: `Delete assets from Silex: ${fileNames.join(', ')}`,
      actions: fileNames.map(f => ({
        action: 'delete',
        file_path: this.getAssetPath(f),
      })),
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

}
