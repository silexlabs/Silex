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
import { File, StorageProvider, HostingProvider, StatusCallback, BackendSession} from '.'
import { join } from 'path'
import { BackendData, BackendUser, WebsiteMeta, FileMeta, JobData, JobId, JobStatus, WebsiteId, BackendType } from '../../types'
import { jobError, jobSuccess, startJob } from '../jobs'
import { userInfo } from 'os'
import { WEBSITE_DATA_FILE_NAME } from '../../constants'
import { requiredParam } from '../utils/validation'
import { ServerConfig } from '../config'

type FsSession = BackendSession

interface FsOptions {
  rootPath?: string
  type: BackendType
}

export class FsBackend implements StorageProvider<FsSession>, HostingProvider<FsSession> {
  id = 'fs'
  displayName = 'File system'
  icon = 'file'
  rootPath: string
  disableLogout = true
  options: { rootPath: string, type: BackendType }
  type: BackendType

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
      message: `Writing files:<ul><li>${filesStatuses.map(({file, status}) => `${file.path}: ${status}`).join('</li><li>')}</li></ul>`,
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
  // Backend interface
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

  async getUserData(session: FsSession): Promise<BackendUser> {
    const { username,  } = userInfo()
    return {
      name: username,
      picture: this.icon,
    }
  }

  async getSiteMeta(session: FsSession, id: string): Promise<WebsiteMeta> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    const files = await this.listDir(session, websiteId, '/')
    const file = files.find(f => f.name === WEBSITE_DATA_FILE_NAME)
    if(!file) throw new Error('Website not found')
    return {
      websiteId,
      // url: await this.getFileUrl(session, websiteId, WEBSITE_DATA_FILE_NAME),
      //metadata: {
      //  path: session.ftp.path,
      //},
      ...file,
    }
  }

  async init(session: FsSession, id: WebsiteId): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id), { recursive: true })
  }

  // ********************
  // Storage interface
  // ********************
  async listWebsites(session: any): Promise<WebsiteMeta[]> {
    const list = await fs.readdir(this.options.rootPath)
    return Promise.all(list.map(async fileName => {
      const filePath = join(this.options.rootPath, fileName)
      const fileStat = await stat(filePath)
      return {
        websiteId: fileName,
        createdAt: fileStat.birthtime,
        updatedAt: fileStat.mtime,
        metadata: {
          ...fileStat,
        },
      } as WebsiteMeta
    }))
  }

  async readFile(session: FsSession, id: WebsiteId, path: string): Promise<File> {
    const fullPath = join(this.options.rootPath, id, path)
    const content = await fs.readFile(fullPath)
    console.log('read file', path, fullPath, content.length)
    return { path, content }
  }

  async writeFiles(session: FsSession, id: WebsiteId, files: File[], statusCbk?: StatusCallback): Promise<string[]> {
    const filesStatuses = this.initStatus(files)
    let error = false
    const filePaths = [] as string[]
    for (const fileStatus of filesStatuses) {
      const {file} = fileStatus
      const path = join(this.options.rootPath, id, file.path)
      filePaths.push(path)
      if (typeof file.content === 'string') {
        fileStatus.message = 'Writing'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        try {
          console.log('write file', path, file.content.length)
          await fs.writeFile(path, file.content)
        } catch(err) {
          fileStatus.message = `Error (${err})`
          console.log('write file stream', path, file.content.length)
          this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
          error = true
          continue
        }
        fileStatus.message = 'Success'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
      } else {
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

  async listDir(session: FsSession, id: WebsiteId, path: string): Promise<FileMeta[]> {
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

  async createDir(session: FsSession, id: WebsiteId, path: string): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id, path), { recursive: true })
  }

  async deleteDir(session: FsSession, id: WebsiteId, path: string): Promise<void> {
    await fsExtra.remove(join(this.options.rootPath, id, path))
  }

  async getFileUrl(session: FsSession, id: WebsiteId, path: string): Promise<string> {
    const filePath = join(this.options.rootPath, id, path)
    const fileUrl = new URL(filePath, 'file://')
    return fileUrl.toString()
  }

  // ********************
  // Hosting provider interface
  // ********************
  async publish(session: FsSession, id: WebsiteId, backendData: BackendData, files: File[]): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`)
    this.writeFiles(session, id, files, async ({status, message}) => {
      // Update the job status
      job.status = status
      job.message = message
      // Add the website url
      job.url = await this.getFileUrl(session, id, 'index.html')
      if(status === JobStatus.SUCCESS) {
        jobSuccess(job.jobId, message)
      } else if(status === JobStatus.ERROR) {
        jobError(job.jobId, message)
      }
    })
    return job
  }

  async getWebsiteUrl(session: FsSession, id: WebsiteId): Promise<string> {
    return this.getFileUrl(session, id, '/index.html')
  }
}
