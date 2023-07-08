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

import fs, { stat } from 'fs/promises'
import { createWriteStream, mkdir } from 'fs'
import fsExtra from 'fs-extra'
import { ConnectorFile, StorageConnector, HostingConnector, StatusCallback, ConnectorSession, contentToString} from './connectors'
import { join, resolve } from 'path'
import { ConnectorData, ConnectorUser, WebsiteMeta, FileMeta, JobData, JobId, JobStatus, WebsiteId, ConnectorType, PublicationJobData, WebsiteMetaFileContent } from '../../types'
import { jobError, jobSuccess, startJob } from '../jobs'
import { userInfo } from 'os'
import { requiredParam } from '../utils/validation'
import { ServerConfig } from '../config'
import { WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE } from '../../constants'
import { Readable } from 'stream'

type FsSession = ConnectorSession

interface FsOptions {
  rootPath?: string
  type: ConnectorType
}

export class FsConnector implements StorageConnector<FsSession>, HostingConnector<FsSession> {
  connectorId = 'fs'
  displayName = 'File system'
  icon = 'file'
  rootPath: string
  disableLogout = true
  options: { rootPath: string, type: ConnectorType }
  type: ConnectorType

  constructor(config: ServerConfig | null, opts: FsOptions) {
    this.options = {
      rootPath: __dirname + '/../../../.silex',
      ...opts,
    }
    this.type = this.options.type
  }

  // ********************
  // Utils methods
  // ********************
  updateStatus(filesStatuses, status, statusCbk) {
    statusCbk && statusCbk({
      message: `<p>Writing files:<ul><li>${filesStatuses.map(({file, message}) => `${file.path}: ${message}`).join('</li><li>')}</li></ul></p>`,
      status,
    })
  }
  initStatus(files) {
    return files.map(file => ({
      file,
      message: 'Waiting',
      status: JobStatus.IN_PROGRESS,
    }))
  }

  // ********************
  // Connector interface
  // ********************
  async getAdminUrl(session: FsSession, id: WebsiteId): Promise<string> {
    return ''
  }

  async getAuthorizeURL(session: FsSession): Promise<string> {
    return ''
  }

  async isLoggedIn(session: FsSession): Promise<boolean> {
    return true
  }

  async login(session: FsSession): Promise<void> {}

  async logout(session: FsSession): Promise<void> {}

  async getUserData(session: FsSession): Promise<ConnectorUser> {
    const { username,  } = userInfo()
    return {
      name: username,
      picture: this.icon,
      connectorId: this.connectorId,
    }
  }

  async setWebsiteMeta(session: any, id: string, data: WebsiteMetaFileContent): Promise<void> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    const content = JSON.stringify(data)
    await this.writeWebsiteFiles(session, websiteId, [{
      path: WEBSITE_META_DATA_FILE,
      content
    }])
  }

  async getWebsiteMeta(session: FsSession, id: WebsiteId): Promise<WebsiteMeta> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    // Get file stat
    const fileStat = await stat(join(this.options.rootPath, websiteId))
    // Read meta file
    const metaFile = await this.readWebsiteFile(session, websiteId, WEBSITE_META_DATA_FILE)
    const meta = JSON.parse(await contentToString(metaFile.content)) as WebsiteMetaFileContent
    // Return all meta
    return {
      websiteId,
      name: meta.name,
      imageUrl: meta.imageUrl,
      createdAt: fileStat.birthtime,
      updatedAt: fileStat.mtime,
    }
  }

  // ********************
  // Storage interface
  // ********************
  async createWebsite(session: FsSession, id: WebsiteId, meta: WebsiteMetaFileContent): Promise<void> {
    console.log('createWebsite', id, meta)
    await this.createWebsiteDir(session, id, '/')
    await this.setWebsiteMeta(session, id, meta)
    await this.writeWebsiteFiles(session, id, [{
      path: WEBSITE_DATA_FILE,
      content: '{}',
    }])
  }

  async listWebsites(session: any): Promise<WebsiteMeta[]> {
    const list = await fs.readdir(this.options.rootPath)
    return Promise.all(list.map(async fileName => {
      const websiteId = fileName as WebsiteId
      const filePath = join(this.options.rootPath, fileName)
      const fileStat = await stat(filePath)
      const metaFile = await this.readWebsiteFile(session, websiteId, WEBSITE_META_DATA_FILE)
      const meta = JSON.parse(await contentToString(metaFile.content)) as WebsiteMetaFileContent
      return {
        websiteId,
        createdAt: fileStat.birthtime,
        updatedAt: fileStat.mtime,
        ...meta,
      } as WebsiteMeta
    }))
  }

  async readWebsiteFile(session: FsSession, id: WebsiteId, path: string): Promise<ConnectorFile> {
    const fullPath = join(this.options.rootPath, id, path)
    const content = await fs.readFile(fullPath)
    return { path, content }
  }

  async writeWebsiteFiles(session: FsSession, id: WebsiteId, files: ConnectorFile[], statusCbk?: StatusCallback): Promise<string[]> {
    const filesStatuses = this.initStatus(files)
    let error = false
    const filePaths = [] as string[]
    for (const fileStatus of filesStatuses) {
      const {file} = fileStatus
      const path = join(this.options.rootPath, id, file.path)
      filePaths.push(path)
      if (typeof file.content === 'string' || Buffer.isBuffer(file.content)) {
        fileStatus.message = 'Writing'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        try {
          await fs.writeFile(path, file.content, 'binary')
        } catch(err) {
          fileStatus.message = `Error (${err})`
          this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
          error = true
          continue
        }
        fileStatus.message = 'Success'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
      } else if (file.content instanceof Readable) {
        fileStatus.message = 'Writing'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        const writeStream = createWriteStream(path)
        file.content.pipe(writeStream)
        await new Promise((resolve) => {
          writeStream.on('finish', () => {
            fileStatus.message = 'Success'
            this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
            resolve(file)
          })
          writeStream.on('error', err => {
            console.error('writeStream error', err)
            fileStatus.message = `Error (${err})`
            this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
            error = true
            resolve(file)
          })
        })
      } else {
        console.error('Invalid file content', typeof file.content)
        throw new Error('Invalid file content: ' + typeof file.content)
      }
    }
    this.updateStatus(filesStatuses, error ? JobStatus.ERROR : JobStatus.SUCCESS, statusCbk)
    return filePaths
  }

  async deleteFiles(session: FsSession, id: WebsiteId, paths: string[]): Promise<void> {
    for (const path of paths) {
      await fs.unlink(join(this.options.rootPath, id, path))
    }
  }

  async listWebsiteDir(session: FsSession, id: WebsiteId, path: string): Promise<FileMeta[]> {
    const list = await fs.readdir(join(this.options.rootPath, id, path))
    return Promise.all(list.map(async fileName => {
      const filePath = join(this.options.rootPath, id, path, fileName)
      const fileStat = await stat(filePath)
      return {
        name: fileName,
        size: fileStat.size,
        isDir: fileStat.isDirectory(),
        createdAt: fileStat.birthtime,
        updatedAt: fileStat.mtime,
      }
    }))
  }

  // async listDir(session: FsSession, id: string, path: string): Promise<FileMeta[]> {
  //   const fileNames = await fs.readdir(this.options.rootPath)
  //   // Filter directories only
  //   // That's a way to do an async filter
  //   const withType = await Promise.all(fileNames.map(async fileName => ({
  //     fileName,
  //     isDir: (await stat(join(this.options.rootPath, fileName))).isDirectory(),
  //   })))
  //   return withType
  //     .filter(({fileName, isDir}) => isDir)
  //     .map(({fileName}) => fileName as WebsiteId)
  // }

  async createWebsiteDir(session: FsSession, id: WebsiteId, path: string): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id, path), { recursive: true })
  }

  async deleteWebsiteDir(session: FsSession, id: WebsiteId, path: string): Promise<void> {
    await fsExtra.remove(join(this.options.rootPath, id, path))
  }

  async getFileUrl(session: FsSession, id: WebsiteId, path: string): Promise<string> {
    const filePath = join(this.options.rootPath, id, path)
    const fileUrl = new URL(filePath, 'file://')
    return fileUrl.toString()
  }

  // ********************
  // Hosting connector interface
  // ********************
  async publishWebsite(session: FsSession, id: WebsiteId, files: ConnectorFile[]): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    this.writeWebsiteFiles(session, '', files, async ({status, message}) => {
      // Update the job status
      job.status = status
      job.message = message
      job.logs[0].push(message)
      // Add the website url
      job.url = await this.getFileUrl(session, id, 'index.html')
      if(status === JobStatus.SUCCESS) {
        jobSuccess(job.jobId, message)
      } else if(status === JobStatus.ERROR) {
        job.errors[0].push(message)
        jobError(job.jobId, message)
      }
    })
    return job
  }

  async getWebsiteUrl(session: FsSession, id: WebsiteId): Promise<string> {
    return this.getFileUrl(session, id, '/index.html')
  }
}
