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

import JsFTP from 'jsftp'
import { Readable } from 'stream'
import express, { Application } from 'express'
import { ConnectorFile, HostingConnector, StatusCallback, StorageConnector, contentToString, toConnectorData, toConnectorEnum} from '../server/connectors/connectors'
import { requiredParam } from '../server/utils/validation'
import { API_CONNECTOR_LOGIN_CALLBACK, WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE } from '../constants'
import { ConnectorData, ConnectorType, ConnectorUser, WebsiteMeta, FileMeta, JobData, JobStatus, WebsiteId, PublicationJobData, WebsiteMetaFileContent } from '../types'
import { EVENT_STARTUP_START } from '../events'
import { jobError, jobSuccess, startJob } from '../server/jobs'
import { ServerConfig } from '../server/config'
import { join } from 'path'
import { type } from 'os'

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

interface FtpOptions {
  type: ConnectorType
  rootPath?: string
  authorizeUrl?: string
  authorizePath?: string
}

interface FtpOptionsWithDefaults {
  type: ConnectorType
  rootPath: string
  authorizeUrl: string
  authorizePath: string
}

// **
// Utils methos
function updateStatus(filesStatuses: FileStatus[], status: JobStatus, statusCbk?: ({ message, status }: { message: string, status: JobStatus }) => void) {
  statusCbk && statusCbk({
    message: `Writing files:<ul><li>${filesStatuses.map(({ file, message }) => `${file.path}: ${message}`).join('</li><li>')}</li></ul>`,
    status,
  })
}

function initStatus(files: ConnectorFile[]) {
  return files.map(file => ({
    file,
    message: 'Waiting',
    status: JobStatus.IN_PROGRESS,
  }))
}

function handleInitError(err) {
  if (err.code !== 550) {
    console.error('Error creating folder', err)
    throw err
  } else {
    console.log('Folder already exists', err.message)
  }
}

function formHtml(type: ConnectorType, { host, user, pass, port, secure, storageRootPath, publicationPath, websiteUrl}: FtpSessionData, err = '') {
  return `
    ${ err && `<div class="error">${err || ''}</div>` }
    <form method="post">
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
export default class FtpConnector implements HostingConnector<FtpSession>, StorageConnector<FtpSession> {
  connectorId = 'ftp'
  displayName = 'Ftp'
  icon = 'ftp'
  options: FtpOptionsWithDefaults
  type: ConnectorType

  constructor(config: ServerConfig, opts: FtpOptions) {
    this.options = {
      rootPath: '',
      authorizeUrl: '/api/authorize/ftp/',
      authorizePath: '/api/authorize/ftp/',
      ...opts,
    }
    this.type = this.options.type
    config.on(EVENT_STARTUP_START, ({app}: {app: Application}) => {
      const router = express.Router()
      app.use(router)
      router.post(this.options.authorizePath, express.urlencoded(), async (req, res, next) => {
        if(req.query.type !== this.options.type) {
          next()
          return
        }
        try {
          const session = req['session'] as FtpSession
          req['session'] = {
            ...session,
            ...await this.authorize(session, req.body),
          }
          res.redirect(`/${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${encodeURIComponent(this.connectorId)}&type=${encodeURIComponent(this.type)}`)
        } catch (err) {
          console.error('FTP auth failed', err)
          res
            .status(403)
            .redirect(`/${API_CONNECTOR_LOGIN_CALLBACK}?error=${encodeURIComponent(err.message)}&type=${encodeURIComponent(this.type)}`)
        }
      })
      router.get(this.options.authorizePath, async (req, res, next) => {
        if(req.query.type !== this.options.type) {
          next()
          return
        }
        const session = req['session'] as FtpSession
        // Check if the user is already logged in
        const { host, user, pass, port, secure } = this.sessionData(session)
        if (host && user && pass && port && secure) {
          try {
            await this.checkAuth({ host, user, pass, port, secure })
            res.redirect(API_CONNECTOR_LOGIN_CALLBACK + '?connectorId=' + encodeURIComponent(this.connectorId))
            return
          } catch (err) {
            // TODO: check if the error is a 401
            console.log('User not logged in yet, let\'s display the login form', err.message)
          }
        }
        // If not, display the login form
        res.send(await this.authorizeForm(session, req.query as any))
      })
    })
  }

  sessionData(session: FtpSession): FtpSessionData {
    return session[this.options.type] ?? {} as FtpSessionData
  }

  storageRootPath(session: FtpSession): string {
    return this.type === ConnectorType.STORAGE ? requiredParam<string>(this.sessionData(session).storageRootPath, 'storage root path') : requiredParam<string>(this.sessionData(session).publicationPath, 'publication path')
  }

  // **
  // Ftp specific methods
  async checkAuth({host, user, pass, port, secure}) {
    const ftp = await this.getClient({ host, user, pass, port, secure })
  }

  async authorizeForm(session: FtpSession, query: { error :string, type: string }): Promise<string> {
    const { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl } = this.sessionData(session)
    const { error, type } = query
    requiredParam(type, 'connector type')
    return `
      <html>
        <head>
          <title>FTP auth</title>
          <style>
            ${formCss}
          </style>
        </head>
        <body>
          ${formHtml(toConnectorEnum(type), { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl }, error)}
        </body>
      </html>
      `
  }

  async getClient({host, user, pass, port, secure}): Promise<any> {
    return new Promise((resolve, reject) => {
      const ftp = new JsFTP({
        host,
        port,
        user,
        pass,
      })

      ftp['on']('close', (err) => {
        console.error('FTP CONNEXION close', err)
      })

      ftp['on']('error', (err) => {
        console.error('FTP CONNEXION error', err)
        reject(err)
      })

      ftp['on']('connect', () => {
        ftp.auth(user, pass, (err) => {
          if (err) {
            console.error('FTP AUTH error', err)
            reject(err)
          } else {
            resolve(ftp)
          }
        })
      })
    })
  }

  // **
  // Connector interface
  // **
  async authorize(session: FtpSession, body: any): Promise<FtpSession> {
    const { host, user, pass, port, secure = false, publicationPath, storageRootPath, websiteUrl } = body as FtpSessionData
    requiredParam(session, 'session')
    requiredParam(host, 'host')
    requiredParam(user, 'user')
    requiredParam(pass, 'pass')
    requiredParam(port, 'port')
    await this.checkAuth({ host, user, pass, port, secure })
    return {
      [this.options.type]: { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl },
    }
  }

  async getUserData(session: FtpSession): Promise<ConnectorUser> {
    return {
      name: this.sessionData(session).user,
      picture: this.icon,
      connector: await toConnectorData(session, this)
    }
  }

  async setWebsiteMeta(session: FtpSession, id: string, data: WebsiteMetaFileContent): Promise<void> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    await this.writeWebsiteFiles(session, websiteId, [{
      path: WEBSITE_META_DATA_FILE,
      content: JSON.stringify(data),
    }])
  }

  async getWebsiteMeta(session: FtpSession, id: WebsiteId): Promise<WebsiteMeta> {
    try {
      const websiteId = requiredParam<WebsiteId>(id, 'website id')
      // List the files in the root directory
      const files = await this.listWebsiteDir(session, websiteId, '/')
      // Find the website data file to get its metadata
      const file = files.find(f => f.name === WEBSITE_DATA_FILE)
      if (!file) {
        throw new Error(`Website data file not found for website ${websiteId}`)
      }
      // Read the meta data file to get the meta data set by the user
      const metaFile = await this.readWebsiteFile(session, websiteId, WEBSITE_META_DATA_FILE)
      const meta = JSON.parse(await contentToString(metaFile.content)) as WebsiteMetaFileContent
      // Return all meta
      return {
        websiteId,
        //url: await this.getFileUrl(session, websiteId, WEBSITE_DATA_FILE_NAME),
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        ...meta,
      }
    } catch(err) {
      console.error(err)
      throw err
    }
  }

  async isLoggedIn(session: FtpSession) {
    try {
      if (!session[this.options.type]) {
        return false
      }
      //await this.checkAuth(this.sessionData(session))
    } catch(err) {
      return false
    }
    return true
  }

  async getAuthorizeURL(session: FtpSession) {
    return `${this.options.authorizeUrl}?type=${this.type}`
  }

  //async login(session: FtpSession, userData): Promise<void> {
  //  await this.checkAuth(userData)
  //  session[this.options.sessionKey] = userData
  //  console.log('login success', userData, this.sessionData(session))
  //}

  async logout(session: FtpSession) {
    delete session[this.options.type]
  }

  async getAdminUrl(session: FtpSession, id: WebsiteId) {
    return null
  }

  // **
  // Storage interface
  /**
   * Create necessary folders
   * Assets and root folders
   */
  async createWebsite(session: FtpSession, id: WebsiteId): Promise<void> {
    // create root folder
    const ftp = await this.getClient(this.sessionData(session))
    try {
      await this.createWebsiteDir(session, id, '/')
    } catch(err) {
      handleInitError(err)
    }
    try {
      await this.createWebsiteDir(session, id, '/assets')
    } catch(err) {
      handleInitError(err)
    }
  }

  async readWebsiteFile(session: FtpSession, id: string, path: string): Promise<ConnectorFile> {
    return new Promise((resolve, reject) => {
      if(!this.sessionData(session)) throw new Error('Not logged in')
      const storageRootPath = this.storageRootPath(session)
      this.getClient(this.sessionData(session))
        .then(ftp => {
          const dirPath = join(this.options.rootPath, storageRootPath, id, path)
          ftp.get(
            dirPath,
            (err, socket) => {
              if (err) {
                return reject(err)
              }
              resolve({
                path,
                content: Readable.from(socket),
              })
              socket.resume()
            })
        })
        .catch(err => {
          console.error(`Error reading file ${path}: ${err.message}`)
          reject(err)
        })
    })
  }

  async writeWebsiteFiles(
    session: any,
    id: WebsiteId,
    files: ConnectorFile[],
    statusCbk?: StatusCallback,
  ): Promise<string[]> {
    statusCbk && statusCbk({
      message: 'Connecting to FTP server',
      status: JobStatus.IN_PROGRESS,
    })
    const ftp = await this.getClient(this.sessionData(session))
    const filesStatuses = initStatus(files)
    const storageRootPath = this.storageRootPath(session)
    return Promise.all(
      filesStatuses.map((fileStatus) => {
        const { file } = fileStatus
        return new Promise<string>((resolve, reject) => {
          fileStatus.message = 'Upload started'
          updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
          const content = typeof file.content === 'string' ? Buffer.from(file.content) : file.content
          const dstPath = join(this.options.rootPath, storageRootPath, id, file.path)
          ftp.put(content, dstPath, (err) => {
            if (err) {
              const errMsg = `Error writing file ${dstPath}: ${err.message}`
              console.error(errMsg)
              //fileStatus.message = `Error ${err.message}`
              //updateStatus(filesStatuses, JobStatus.ERROR, statusCbk)

              statusCbk && statusCbk({
                message: errMsg,
                status: JobStatus.ERROR,
              })
              return reject(new Error(errMsg))
            }
            fileStatus.message = 'Upload complete'
            updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
            resolve(dstPath)
          })
        })
      })
    )
      .catch((err) => {
      // Not sure why it never gets here
        console.error(err)
        statusCbk && statusCbk({
          message: err.message,
          status: JobStatus.ERROR,
        })
        return []
      })
  }

  async deleteFiles(session: FtpSession, id, paths) {
    const storageRootPath = this.storageRootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    await Promise.all(
      paths.map((path) =>
        new Promise<void>((resolve, reject) => {
          const dstPath = join(this.options.rootPath, storageRootPath, id, path)
          ftp.raw('dele', dstPath, (err) => {
            if (err) {
              console.error(`Error deleting file ${dstPath}: ${err.message}`)
              return reject(err)
            }
            resolve()
          })
        })
      )
    )
  }

  async listWebsites(session: FtpSession): Promise<WebsiteMeta[]> {
    const storageRootPath = this.storageRootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    return new Promise((resolve, reject) => {
      ftp.ls(join(this.options.rootPath, storageRootPath), (err, res) => {
        if (err) {
          console.error(`Error listing websites: ${err.message}`)
          return reject(err)
        }
        resolve(res.map((file) => ({
          websiteId: file.name,
          createdAt: new Date(file.time),
          updatedAt: new Date(file.time),
          metadata: {
            ...file,
          },
        })))
      })
    })
  }

  async listWebsiteDir(
    session: FtpSession,
    id: WebsiteId,
    path: string,
  ): Promise<FileMeta[]> {
    const ftp = await this.getClient(this.sessionData(session))
    const storageRootPath = this.storageRootPath(session)

    return new Promise((resolve, reject) => {
      const dstPath = join(this.options.rootPath, storageRootPath, id, path)
      ftp.ls(dstPath, (err, res) => {
        if (err) {
          console.error(`Error listing folder ${dstPath}: ${err.message}`)
          return reject(err)
        }
        resolve(res.map((file) => ({
          name: file.name,
          isDir: file.type === 1,
          size: file.size,
          createdAt: new Date(file.time),
          updatedAt: new Date(file.time),
          metaData: {
            size: file.size,
          },
        } as FileMeta)))
      })
    })
  }

  async createWebsiteDir(session: FtpSession, id: WebsiteId, path: string) {
    const storageRootPath = this.storageRootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    return new Promise<void>((resolve, reject) => {
      const dirPath = join(this.options.rootPath, storageRootPath, id, path)
      ftp.raw('mkd', dirPath, (err) => {
        if (err) {
          console.error(`Error creating folder ${dirPath}: ${err.message}`)
          return reject(err)
        }
        resolve()
      })
    })
  }

  async deleteWebsiteDir(session: FtpSession, id: WebsiteId, path: string) {
    const storageRootPath = this.storageRootPath(session)
    const ftp = await this.getClient(this.sessionData(session))
    return new Promise<void>((resolve, reject) => {
      const dirPath = join(this.options.rootPath, storageRootPath, id, path)
      ftp.raw('rmd', dirPath, (err) => {
        if (err) {
          console.error(`Error deleting folder ${dirPath}: ${err.message}`)
          return reject(err)
        }
        resolve()
      })
    })
  }

  // **
  // Hosting interface
  async getWebsiteUrl(session: FtpSession, id: WebsiteId): Promise<string> {
    // FIXME: do not store websiteUrl in the session, but in the website data
    console.warn('FIXME: do not store websiteUrl in the session, but in the website data')
    return this.sessionData(session).websiteUrl ?? ''
  }

  async publishWebsite(session: FtpSession, id: string, files: ConnectorFile[]): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    this.writeWebsiteFiles(session, '', files, async ({status, message}) => {
      // Update the job status
      job.status = status
      job.message = message
      job.logs[0].push(message)
      // Add the website url
      job.url = await this.getWebsiteUrl(session, id)
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
