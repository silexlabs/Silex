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

import { Client } from 'basic-ftp'
import { PassThrough, Readable, Writable } from 'stream'
import { ConnectorFile, ConnectorFileContent, HostingConnector, StatusCallback, StorageConnector, contentToReadable, contentToString, toConnectorData, toConnectorEnum} from '../../server/connectors/connectors'
import { requiredParam } from '../../server/utils/validation'
import { WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE } from '../../constants'
import { ConnectorType, ConnectorUser, WebsiteMeta, FileMeta, JobData, JobStatus, WebsiteId, PublicationJobData, WebsiteMetaFileContent, defaultWebsiteData, WebsiteData, ConnectorOptions } from '../../types'
import { jobError, jobSuccess, startJob } from '../../server/jobs'
import { ServerConfig } from '../../server/config'
import { join } from 'path'
import { type } from 'os'
import { v4 as uuid } from 'uuid'

/**
 * @fileoverview FTP connector for Silex
 * This is a connector for Silex, which allows to store the website on a FTP server
 *   and to publish the website on a FTP server
 * FIXME: As a hosting connector, this connector should only store the password in the session and the rest in the website data
 *   to prevent publishing a site on the wrong server + multiple sites on 1 server
 * FIXME: Allow reuse of FTP session between calls
 */

export interface FtpSessionData {
  host: string
  user: string
  pass: string
  port: number
  secure: boolean
  // Storage options
  storageRootPath?: string
  // Hosting options
  publicationPath?: string
  websiteUrl?: string
}

export interface FtpSession {
  [ConnectorType.STORAGE]?: FtpSessionData
  [ConnectorType.HOSTING]?: FtpSessionData
}

interface FileStatus {
  file: ConnectorFile
  message: string
  status: JobStatus
}

export interface FtpOptions {
  type: ConnectorType
  path: string
  assetsFolder: string
  authorizeUrl: string
  authorizePath: string
}

// **
// Utils methos
function formHtml(redirectTo: string, type: ConnectorType, { host, user, pass, port, secure, storageRootPath, publicationPath, websiteUrl}: FtpSessionData, err = '') {
  return `
    ${ err && `<div class="error">${err || ''}</div>` }
    <form method="POST" action="${redirectTo}">
      <label for="host">Host</label>
      <input placeholder="ftp.example.com" type="text" name="host" value="${host || ''}" />
      <label for="user">User</label>
      <input placeholder="user" type="text" name="user" value="${user || ''}" />
      <label for="pass">Pass</label>
      <input placeholder="****" type="password" name="pass" value="${pass || ''}" />
      <label for="port">Port</label>
      <input placeholder="21" type="number" name="port" value="${port || '21'}" />
      <div class="checkbox-container">
        <input class="checkbox" type="checkbox" name="secure" value="true" ${secure ? 'checked' : ''} />
        <label for="secure">Secure</label>
      </div>
      ${ type === ConnectorType.STORAGE ? `
      <details>
        <summary>Storage options</summary>
        <p>If you are not sure, don't change this</p>
        <label for="storageRootPath">Root path where to store the website files</label>
        <input placeholder="/silex/" type="text" name="storageRootPath" value="${storageRootPath || '/silex/'}" />
      </details>
      ` : ''}
      ${ type === ConnectorType.HOSTING ? `
      <fieldset>
        <legend>Publication options</legend>
        <label for="publicationPath">Path where to publish</label>
        <input placeholder="/public_html/" type="text" name="publicationPath" value="${publicationPath || ''}" />
        <label for="websiteUrl">URL where to the site will be accessible</label>
        <input placeholder="https://mysite.com/" type="text" name="websiteUrl" value="${websiteUrl || ''}" />
      </fieldset>
      ` : ''}
      <div class="button-container">
        <button type="submit" class="primary-button">Login</button>
        <button type="button" class="secondary-button">Cancel</button>
      </div>
    </form>
  `
}

const formCss = `
/* Reset default form styles */
form {
  margin: 0;
  padding: 0;
}

/* Center the form */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

/* Style form container */
form {
  width: 400px;
  padding: 20px;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Style form labels */
label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

/* Style form inputs */
input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
input.checkbox {
  width: 20px;
  height: 20px;
}
fieldset {
  padding: 20px;
}

/* Style form buttons */
.button-container {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.primary-button,
.secondary-button {
  width: 48%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.primary-button {
  background-color: #4caf50;
  color: white;
}

.secondary-button {
  background-color: #e0e0e0;
  color: #333;
}

.primary-button:hover,
.secondary-button:hover {
  background-color: #388e3c;
}

/* Style form checkbox */
.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  margin: 20px 0;
}

.checkbox-container label {
  margin-left: 5px;
  color: #333;
}

/* Style details and summary elements */
details {
  margin-top: 20px;
  color: #333;
}

summary {
  font-weight: bold;
  cursor: pointer;
}

details > p {
  margin-top: 10px;
}
`

/**
 * @class FtpConnector
 * @implements {HostingConnector}
 * @implements {StorageConnector}
 */
export default class FtpConnector implements StorageConnector<FtpSession> {
  connectorId = 'ftp'
  displayName = 'Ftp'
  icon = 'ftp'
  options: FtpOptions
  connectorType: ConnectorType

  constructor(config: ServerConfig, opts: Partial<FtpOptions>) {
    this.options = {
      path: '',
      assetsFolder: 'assets',
      authorizeUrl: '/api/authorize/ftp/',
      authorizePath: '/api/authorize/ftp/',
      ...opts,
    } as FtpOptions
    if(!this.options.type) throw new Error('missing type in option of FtpConnector')
    this.connectorType = toConnectorEnum(this.options.type)
  }

  // **
  // Utils
  sessionData(session: FtpSession): FtpSessionData {
    return session[this.options.type] ?? {} as FtpSessionData
  }

  rootPath(session: FtpSession): string {
    return this.connectorType === ConnectorType.STORAGE ?
      requiredParam<string>(this.sessionData(session).storageRootPath, 'storage root path') :
      requiredParam<string>(this.sessionData(session).publicationPath, 'publication path')
  }

  // **
  // FTP methods
  private async write(ftp: Client, path: string, content: ConnectorFileContent, progress?: (message: string) => void): Promise<void> {
    ftp.trackProgress(info => {
      progress && progress(`Uploading ${info.bytes / 1000} KB}`)
    })
    progress && progress('Upload started')
    await ftp.uploadFrom(contentToReadable(content), path)
    progress && progress('Upload complete')
  }

  private async read(ftp: Client, path: string): Promise<Readable> {
    const stream = new PassThrough()
    await ftp.downloadTo(stream, path)
    return stream
  }

  private async readdir(ftp: Client, path: string): Promise<FileMeta[]> {
    const list = await ftp.list(path)
    return list.map((file) => ({
      name: file.name,
      isDir: file.isDirectory,
      size: file.size,
      createdAt: file.modifiedAt,
      updatedAt: file.modifiedAt,
      metaData: file,
    } as FileMeta))
  }

  private async mkdir(ftp: Client, path: string) {
    return ftp.ensureDir(path)
  }

  private async rmdir(ftp: Client, path: string) {
    return ftp.removeDir(path)
  }

  private async unlink(ftp: Client, path: string) {
    return ftp.remove(path)
  }

  private async getClient({host, user, pass, port, secure}): Promise<Client> {
    const ftp = new Client()
    await ftp.access({
      host,
      port,
      user,
      password: pass,
      secure,
    })
    return ftp
  }

  private closeClient(ftp: Client) {
    if(ftp && !ftp.closed) {
      ftp.close()
    } else {
      console.warn('ftp already closed')
    }
  }

  // **
  // Connector interface
  getOptions(formData: object): ConnectorOptions {
    return {
      // Storage
      storageRootPath: formData['storageRootPath'],
      // Hosting
      publicationPath: formData['publicationPath'],
      websiteUrl: formData['websiteUrl'],
    }
  }

  async getOAuthUrl(session: FtpSession): Promise<string | null> { return null }

  async getLoginForm(session: FtpSession, redirectTo: string): Promise<string | null> {
    const { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl } = this.sessionData(session)
    requiredParam(type, 'connector type')
    return `
        <style>
          ${formCss}
        </style>
        ${formHtml(redirectTo, this.connectorType, { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl })}
      `
  }

  async getSettingsForm(session: FtpSession, redirectTo: string): Promise<string | null> { return null }

  async setToken(session: FtpSession, token: object): Promise<void> {
    // Check all required params are present
    const { host, user, pass, port, secure = false, publicationPath, storageRootPath, websiteUrl } = token as FtpSessionData
    requiredParam(session, 'session')
    requiredParam(host, 'host')
    requiredParam(user, 'user')
    requiredParam(pass, 'pass')
    requiredParam(port, 'port')

    // Check if the connection is valid
    const ftp = await this.getClient({ host, user, pass, port, secure })
    // Save the token
    session[this.connectorType] = { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl }
    // Clean up
    this.closeClient(ftp)
  }

  async logout(session: FtpSession) {
    delete session[this.options.type]
  }

  async getUser(session: FtpSession): Promise<ConnectorUser> {
    return {
      name: this.sessionData(session).user,
      picture: 'data://image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAA',
      storage: await toConnectorData(session, this)
    }
  }

  async isLoggedIn(session: FtpSession) {
    try {
      if (!session[this.options.type]) {
        return false
      }
      const ftp = await this.getClient(this.sessionData(session))
      this.closeClient(ftp)
      return true
    } catch(err) {
      return false
    }
  }

  async setWebsiteMeta(session: FtpSession, id: string, data: WebsiteMetaFileContent): Promise<void> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    const path = join(this.rootPath(session), websiteId, WEBSITE_META_DATA_FILE)
    const ftp = await this.getClient(this.sessionData(session))
    await this.write(ftp, path, JSON.stringify(data))
    this.closeClient(ftp)
  }

  async getWebsiteMeta(session: FtpSession, id: WebsiteId): Promise<WebsiteMeta> {
    try {
      const websiteId = requiredParam<WebsiteId>(id, 'website id')
      const ftp = await this.getClient(this.sessionData(session))
      // Get stats for the website folder
      const folder = join(this.rootPath(session), websiteId)
      const lastMod = await ftp.lastMod(folder)
      // Read the meta data file to get the meta data set by the user
      const path = join(this.rootPath(session), websiteId, WEBSITE_META_DATA_FILE)
      const readable = await this.read(ftp, path)
      const meta = JSON.parse(await contentToString(readable)) as WebsiteMetaFileContent
      this.closeClient(ftp)
      // Return all meta
      return {
        websiteId,
        //url: await this.getFileUrl(session, websiteId, WEBSITE_DATA_FILE_NAME),
        createdAt: lastMod,
        updatedAt: lastMod,
        ...meta,
      }
    } catch(err) {
      console.error(err)
      throw err
    }
  }

  // **
  // Storage interface
  /**
   * Create necessary folders
   * Assets and root folders
   */
  async createWebsite(session: FtpSession): Promise<WebsiteId> {
    const ftp = await this.getClient(this.sessionData(session))
    // Generate a random id
    const id = uuid()
    // // create root folder
    // const rootPath = join(this.storageRootPath(session), id)
    // await this.mkdir(ftp, rootPath)
    // create assets folder
    const assetsPath = join(this.rootPath(session), id, '/assets')
    await this.mkdir(ftp, assetsPath)
    // create website data file
    const websiteDataPath = join(this.rootPath(session), id, WEBSITE_DATA_FILE)
    await this.write(ftp, websiteDataPath, JSON.stringify(defaultWebsiteData))
    // create website meta data file
    const websiteMetaDataPath = join(this.rootPath(session), id, WEBSITE_META_DATA_FILE)
    await this.write(ftp, websiteMetaDataPath, JSON.stringify({}))
    // Clean up
    this.closeClient(ftp)
    // All good
    return id
  }

  async listWebsites(session: FtpSession): Promise<WebsiteMeta[]> {
    const storageRootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    const files = await this.readdir(ftp, storageRootPath)
    const list = await Promise.all(files.map(async file => {
      const websiteId = file.name
      const websiteMeta = await this.getWebsiteMeta(session, websiteId)
      return websiteMeta
    }))
    this.closeClient(ftp)
    return list
  }

  async readWebsite(session: FtpSession, websiteId: string): Promise<WebsiteData | Readable> {
    const storageRootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    const websiteDataPath = join(storageRootPath, websiteId, WEBSITE_DATA_FILE)
    const data = await this.read(ftp, websiteDataPath)
    this.closeClient(ftp)
    return data
  }

  async updateWebsite(session: FtpSession, websiteId: string, data: WebsiteData): Promise<void> {
    const storageRootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    const websiteDataPath = join(storageRootPath, websiteId, WEBSITE_DATA_FILE)
    await this.write(ftp, websiteDataPath, JSON.stringify(data))
    this.closeClient(ftp)
  }

  async deleteWebsite(session: FtpSession, websiteId: string): Promise<void> {
    const storageRootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    const websitePath = join(storageRootPath, websiteId)
    await this.rmdir(ftp, websitePath)
    this.closeClient(ftp)
  }

  async writeAssets(
    session: any,
    id: WebsiteId,
    files: ConnectorFile[],
    statusCbk?: StatusCallback,
  ): Promise<void> {
    // Connect to FTP server
    statusCbk && statusCbk({
      message: 'Connecting to FTP server',
      status: JobStatus.IN_PROGRESS,
    })
    const ftp = await this.getClient(this.sessionData(session))
    const rootPath = this.rootPath(session)
    // Make sure that root folder exists
    statusCbk && statusCbk({
      message: 'Making sure that root folder exists',
      status: JobStatus.IN_PROGRESS,
    })
    // Useless as ftp write will create the folder
    // await this.mkdir(ftp, rootPath)
    // Write files
    let lastFile: ConnectorFile | undefined
    try {
      // Sequentially write files
      for(const file of files) {
        statusCbk && statusCbk({
          message: `Writing file ${file.path}`,
          status: JobStatus.IN_PROGRESS,
        })
        const dstPath = join(this.options.path, rootPath, id, this.options.assetsFolder, file.path)
        lastFile = file
        const result = await this.write(ftp, dstPath, file.content, message => {
          statusCbk && statusCbk({
            message: `Writing file ${file.path.split('/').pop()} to ${dstPath.split('/').slice(0, -1).join('/')}: ${message}`,
            status: JobStatus.IN_PROGRESS,
          })
        })
      }
      this.closeClient(ftp)
      statusCbk && statusCbk({
        message: `Finished writing ${files.length} files to ${rootPath}`,
        status: JobStatus.SUCCESS,
      })
    } catch(err) {
      // Not sure why it never gets here
      statusCbk && statusCbk({
        message: `Error writing file ${lastFile?.path}: ${err.message}`,
        status: JobStatus.ERROR,
      })
      this.closeClient(ftp)
    }
  }

  async readAsset(session: FtpSession, id: string, path: string): Promise<ConnectorFileContent> {
    if (!this.sessionData(session)) throw new Error('Not logged in')
    const storageRootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    const dirPath = join(this.options.path, storageRootPath, id, this.options.assetsFolder, path)
    const asset = this.read(ftp, dirPath)
    this.closeClient(ftp)
    return asset
  }

  async deleteAssets(session: FtpSession, id: WebsiteId, paths: string[]): Promise<void> {
    const storageRootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    await Promise.all(
      paths.map((path) => this.unlink(ftp, join(this.options.path, storageRootPath, id, this.options.assetsFolder, path)))
    )
    this.closeClient(ftp)
  }

  // **
  // Hosting interface
  async getUrl(session: FtpSession, id: WebsiteId): Promise<string> {
    // FIXME: do not store websiteUrl in the session, but in the website data
    console.warn('FIXME: do not store websiteUrl in the session, but in the website data')
    return this.sessionData(session).websiteUrl ?? ''
  }

  async publish(session: FtpSession, id: string, files: ConnectorFile[]): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    // Create folders
    const rootPath = this.rootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    await this.mkdir(ftp, rootPath)
    await this.mkdir(ftp, join(rootPath, 'assets'))
    // Write files
    this.writeAssets(session, '', files, async ({status, message}) => {
      // Update the job status
      job.status = status
      job.message = message
      job.logs[0].push(message)
      if(status === JobStatus.SUCCESS) {
        jobSuccess(job.jobId, message)
      } else if(status === JobStatus.ERROR) {
        job.errors[0].push(message)
        jobError(job.jobId, message)
      }
    })
    return job
  }
}
