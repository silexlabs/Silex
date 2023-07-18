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
import { ConnectorFile, StorageConnector, StatusCallback, ConnectorSession, toConnectorData, ConnectorFileContent} from './connectors'
import { dirname, join } from 'path'
import { ConnectorUser, WebsiteMeta, JobStatus, WebsiteId, ConnectorType, WebsiteMetaFileContent, WebsiteData, defaultWebsiteData, ConnectorOptions } from '../../types'
import { userInfo } from 'os'
import { requiredParam } from '../utils/validation'
import { ServerConfig } from '../config'
import { DEFAULT_WEBSITE_ID, WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE } from '../../constants'
import { Readable } from 'stream'
import { v4 as uuid } from 'uuid'
import { fileURLToPath } from 'url'

// Variables needed for jest tests
if(!globalThis.__dirname) {
  // @ts-ignore
  globalThis.__dirname = dirname(process.cwd() + '/src/ts/server/connectors/FsStorage.ts')
  console.log('Redefining __dirname', globalThis.__dirname)
}

type FsSession = ConnectorSession

const USER_ICON = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'1em\' viewBox=\'0 0 448 512\'%3E%3Cpath d=\'M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z\'/%3E%3C/svg%3E'
const FILE_ICON = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%202L6%2022%2018%2022%2018%207%2012%202%206%202Z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M18%202L12%202%2012%208%2018%208%2018%202Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E'

interface FsOptions {
  path: string
  assetsFolder: string
}

export class FsStorage implements StorageConnector<FsSession> {
  connectorId = 'fs-storage'
  displayName = 'File system storage'
  icon = FILE_ICON
  disableLogout = true
  options: FsOptions
  connectorType = ConnectorType.STORAGE
  color = '#ffffff'
  background = '#006400'

  constructor(config: ServerConfig | null, opts: Partial<FsOptions>) {
    this.options = {
      path: join(__dirname, '..', '..', '..', '..', 'data'),
      assetsFolder: '/assets',
      ...opts,
    }
    this.initFs()
  }

  private async initFs() {
    const stat = await fs.stat(this.options.path).catch(() => null)
    if (!stat) {
      // create data folder with a default website
      const id = DEFAULT_WEBSITE_ID
      await fs.mkdir(join(this.options.path, id, this.options.assetsFolder), { recursive: true })
      await this.setWebsiteMeta({}, id, { name: 'Default website', connectorUserSettings: {} })
      await this.updateWebsite({}, id, defaultWebsiteData)
    }
  }

  // ********************
  // Job utils methods
  // ********************
  private updateStatus(filesStatuses, status, statusCbk) {
    statusCbk && statusCbk({
      message: `<p>Writing files:<ul><li>${filesStatuses.map(({file, message}) => `${file.path}: ${message}`).join('</li><li>')}</li></ul></p>`,
      status,
    })
  }

  private initStatus(files) {
    return files.map(file => ({
      file,
      message: 'Waiting',
      status: JobStatus.IN_PROGRESS,
    }))
  }

  // ********************
  // Connector interface
  // ********************
  getOptions(formData: object): ConnectorOptions {
    return {}
  }

  async getOAuthUrl(session: FsSession): Promise<null> { return null }

  async getLoginForm(session: FsSession, redirectTo: string): Promise<string | null> {
    return null
  }
  async getSettingsForm(session: FsSession, redirectTo: string): Promise<string | null> {
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
      picture: USER_ICON,
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
    await fs.mkdir(join(this.options.path, id, this.options.assetsFolder), { recursive: true })
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
    const fullPath = join(this.options.path, id, this.options.assetsFolder, path)
    const content = await fs.readFile(fullPath)
    return { path, content }
  }

  async writeAssets(session: FsSession, id: WebsiteId, files: ConnectorFile[], statusCbk?: StatusCallback): Promise<void> {
    const filesStatuses = this.initStatus(files)
    let error: Error | null = null
    for (const fileStatus of filesStatuses) {
      const {file} = fileStatus
      const path = join(this.options.path, id, this.options.assetsFolder, file.path)
      if (typeof file.content === 'string' || Buffer.isBuffer(file.content)) {
        fileStatus.message = 'Writing'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        try {
          await fs.writeFile(path, file.content, 'binary')
        } catch(err) {
          fileStatus.message = `Error (${err})`
          this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
          error = err
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
            error = err
            resolve(file)
          })
        })
      } else {
        console.error('Invalid file content', typeof file.content)
        throw new Error('Invalid file content: ' + typeof file.content)
      }
    }
    this.updateStatus(filesStatuses, error ? JobStatus.ERROR : JobStatus.SUCCESS, statusCbk)
    if(error) throw error
  }

  async deleteAssets(session: FsSession, id: WebsiteId, paths: string[]): Promise<void> {
    for (const path of paths) {
      await fs.unlink(join(this.options.path, id, path))
    }
  }

  async readAsset(session: object, websiteId: string, fileName: string): Promise<ConnectorFileContent> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id, this.options.assetsFolder, fileName)
    return await fs.readFile(path)
  }
}
