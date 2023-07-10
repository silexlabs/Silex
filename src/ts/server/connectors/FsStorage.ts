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
import { createWriteStream } from 'fs'
import fsExtra from 'fs-extra'
import { ConnectorFile, StorageConnector, HostingConnector, StatusCallback, ConnectorSession, contentToString, toConnectorData, ConnectorFileContent} from './connectors'
import { join, resolve } from 'path'
import { ConnectorData, ConnectorUser, WebsiteMeta, FileMeta, JobData, JobId, JobStatus, WebsiteId, ConnectorType, PublicationJobData, WebsiteMetaFileContent, WebsiteData, defaultWebsiteData } from '../../types'
import { jobError, jobSuccess, startJob } from '../jobs'
import { userInfo } from 'os'
import { requiredParam } from '../utils/validation'
import { ServerConfig } from '../config'
import { WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE } from '../../constants'
import { Readable } from 'stream'
import { v4 as uuid } from 'uuid'

type FsSession = ConnectorSession

interface FsOptions {
  path?: string
}

export class FsStorage implements StorageConnector<FsSession> {
  connectorId = 'fs-storage'
  displayName = 'File system storage'
  icon = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%202L6%2022%2018%2022%2018%207%2012%202%206%202Z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M18%202L12%202%2012%208%2018%208%2018%202Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E'
  disableLogout = true
  options: { path: string }
  connectorType = ConnectorType.STORAGE

  constructor(config: ServerConfig | null, opts: FsOptions) {
    this.options = {
      path: __dirname + '/../../../.silex',
      ...opts,
    }
  }

  // ********************
  // Job utils methods
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
  async getOAuthUrl(session: object): Promise<string | null> {
    return null
  }
  async getLoginForm(session: object, redirectTo: string): Promise<string | null> {
    return null
  }
  async getSettingsForm(session: object, redirectTo: string): Promise<string | null> {
    return null
  }

  async isLoggedIn(session: FsSession): Promise<boolean> {
    return true
  }

  async setToken(session: FsSession, query: object): Promise<void> {}

  async logout(session: FsSession): Promise<void> {}

  async getUser(session: FsSession): Promise<ConnectorUser> {
    const { username,  } = userInfo()
    return {
      name: username,
      picture: 'data://image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%202L6%2022%2018%2022%2018%207%2012%202%206%202Z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M18%202L12%202%2012%208%2018%208%2018%202Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E',
      storage: await toConnectorData(session, this),
    }
  }

  async setWebsiteMeta(session: any, id: string, data: WebsiteMetaFileContent): Promise<void> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    const content = JSON.stringify(data)
    const path = join(this.options.path, id, WEBSITE_META_DATA_FILE)
    await fs.writeFile(path, content)
  }

  async getWebsiteMeta(session: FsSession, id: WebsiteId): Promise<WebsiteMeta> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    // Get stats for website folder
    const fileStat = await stat(join(this.options.path, websiteId))
    const path = join(this.options.path, websiteId, WEBSITE_META_DATA_FILE)
    // Get meta file
    const content = await fs.readFile(path)
    const meta = await JSON.parse(content.toString())
    // Return all meta
    return {
      websiteId,
      name: meta.name,
      imageUrl: meta.imageUrl,
      connectorUserSettings: meta.connectorUserSettings,
      createdAt: fileStat.birthtime,
      updatedAt: fileStat.mtime,
    }
  }

  // ********************
  // Storage interface
  // ********************
  async createWebsite(session: FsSession, meta: WebsiteMetaFileContent): Promise<WebsiteId> {
    const id = uuid()
    await fs.mkdir(join(this.options.path, id), { recursive: true })
    await this.setWebsiteMeta(session, id, meta)
    await this.updateWebsite(session, id, defaultWebsiteData)
    return id
  }

  async readWebsite(session: FsSession, websiteId: WebsiteId): Promise<WebsiteData> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id, WEBSITE_DATA_FILE)
    const content = await fs.readFile(path)
    return JSON.parse(content.toString())
  }

  async updateWebsite(session: FsSession, websiteId: WebsiteId, data: WebsiteData): Promise<void> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id, WEBSITE_DATA_FILE)
    await fs.writeFile(path, JSON.stringify(data))
  }

  async deleteWebsite(session: FsSession, websiteId: WebsiteId): Promise<void> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id)
    return fs.rmdir(path, { recursive: true })
  }

  async listWebsites(session: any): Promise<WebsiteMeta[]> {
    const list = await fs.readdir(this.options.path)
    return Promise.all(list.map(async fileName => {
      const websiteId = fileName as WebsiteId
      return this.getWebsiteMeta(session, websiteId)
    }))
  }

  async getAsset(session: FsSession, id: WebsiteId, path: string): Promise<ConnectorFile> {
    const fullPath = join(this.options.path, id, path)
    const content = await fs.readFile(fullPath)
    return { path, content }
  }

  async writeAssets(session: FsSession, id: WebsiteId, files: ConnectorFile[], statusCbk?: StatusCallback): Promise<string[]> {
    const filesStatuses = this.initStatus(files)
    let error = false
    const filePaths = [] as string[]
    for (const fileStatus of filesStatuses) {
      const {file} = fileStatus
      const path = join(this.options.path, id, file.path)
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

  async deleteAssets(session: FsSession, id: WebsiteId, paths: string[]): Promise<void> {
    for (const path of paths) {
      await fs.unlink(join(this.options.path, id, path))
    }
  }

  async readAsset(session: object, websiteId: string, fileName: string): Promise<ConnectorFileContent> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id, fileName)
    return await fs.readFile(path)
  }

  // async listWebsiteDir(session: FsSession, id: WebsiteId, path: string): Promise<FileMeta[]> {
  //   const list = await fs.readdir(join(this.options.path, id, path))
  //   return Promise.all(list.map(async fileName => {
  //     const filePath = join(this.options.path, id, path, fileName)
  //     const fileStat = await stat(filePath)
  //     return {
  //       name: fileName,
  //       size: fileStat.size,
  //       isDir: fileStat.isDirectory(),
  //       createdAt: fileStat.birthtime,
  //       updatedAt: fileStat.mtime,
  //     }
  //   }))
  // }

  // async listDir(session: FsSession, id: string, path: string): Promise<FileMeta[]> {
  //   const fileNames = await fs.readdir(this.options.path)
  //   // Filter directories only
  //   // That's a way to do an async filter
  //   const withType = await Promise.all(fileNames.map(async fileName => ({
  //     fileName,
  //     isDir: (await stat(join(this.options.path, fileName))).isDirectory(),
  //   })))
  //   return withType
  //     .filter(({fileName, isDir}) => isDir)
  //     .map(({fileName}) => fileName as WebsiteId)
  // }

  // async createWebsiteDir(session: FsSession, id: WebsiteId, path: string): Promise<void> {
  //   await fs.mkdir(join(this.options.path, id, path), { recursive: true })
  // }

  // async deleteWebsiteDir(session: FsSession, id: WebsiteId, path: string): Promise<void> {
  //   await fsExtra.remove(join(this.options.path, id, path))
  // }
}
