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

import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import { ConnectorFile, StorageConnector, StatusCallback, ConnectorSession, toConnectorData, ConnectorFileContent} from './connectors'
import { dirname, join } from 'path'
import { ConnectorUser, WebsiteMeta, JobStatus, WebsiteId, ConnectorType, WebsiteMetaFileContent, WebsiteData, EMPTY_WEBSITE, ConnectorOptions } from '../../types'
import { userInfo } from 'os'
import { requiredParam } from '../utils/validation'
import { ServerConfig } from '../config'
import { DEFAULT_WEBSITE_ID, WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE, LEGACY_WEBSITE_PAGES_FOLDER } from '../../constants'
import { Readable } from 'stream'
import { v4 as uuid } from 'uuid'
import { fileURLToPath } from 'url'
import { stringify, split, merge, getPagesFolder } from '../utils/websiteDataSerialization'

// Variables needed for jest tests
if(!globalThis.__dirname) {
  // @ts-ignore
  globalThis.__dirname = dirname(process.cwd() + '/src/ts/server/connectors/FsStorage.ts')
  console.info('Redefining __dirname', globalThis.__dirname)
}

// Copy a folder recursively
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    entry.isDirectory() ?
      await copyDir(srcPath, destPath) :
      await fs.copyFile(srcPath, destPath)
  }
}


type FsSession = ConnectorSession

const USER_ICON = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'1em\' viewBox=\'0 0 448 512\'%3E%3Cpath d=\'M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z\'/%3E%3C/svg%3E'
const FILE_ICON = '/assets/laptop.png'

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

  protected async initFs() {
    const stat = await fs.stat(this.options.path).catch(() => null)
    if (!stat) {
      // create data folder with a default website
      const id = DEFAULT_WEBSITE_ID
      await fs.mkdir(join(this.options.path, id, this.options.assetsFolder), { recursive: true })
      await this.setWebsiteMeta({}, id, { name: 'Default website', connectorUserSettings: {} })
      await this.updateWebsite({}, id, EMPTY_WEBSITE)
      console.info(`> [FsStorage] Created ${id} in ${this.options.path}`)
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
    const content = stringify(data)
    const path = join(this.options.path, id, WEBSITE_META_DATA_FILE)
    await fs.writeFile(path, content)
  }

  async getWebsiteMeta(session: FsSession, id: WebsiteId): Promise<WebsiteMeta> {
    const websiteId = requiredParam<WebsiteId>(id, 'website id')
    // Get stats for website folder
    const fileStat = await fs.stat(join(this.options.path, websiteId))
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
    await this.updateWebsite(session, id, EMPTY_WEBSITE)
    return id
  }

  async readWebsite(session: FsSession, websiteId: WebsiteId): Promise<WebsiteData> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id, WEBSITE_DATA_FILE)

    const content = await fs.readFile(path)
    const websiteDataContent = content.toString()

    // Check if this is the new split format
    const parsedData = JSON.parse(websiteDataContent)
    // Use the merge function to reconstruct website data
    const pageLoader = async (pagePath: string): Promise<string> => {
      const fullPath = join(this.options.path, id, pagePath)
      const pageContent = await fs.readFile(fullPath)
      return pageContent.toString()
    }

    return await merge(websiteDataContent, pageLoader)
  }

  async updateWebsite(session: FsSession, websiteId: WebsiteId, data: WebsiteData): Promise<void> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const websitePath = join(this.options.path, id)

    // Use the split function to create separate files for pages
    const filesToWrite = split(data)

    // Get the pages folder path from website data
    const pagesFolder = getPagesFolder(data)

    // Ensure the website directory exists
    await fs.mkdir(websitePath, { recursive: true })

    // Ensure the pages directory exists if we have page files
    const hasPageFiles = filesToWrite.some(f => f.path.startsWith(pagesFolder))
    if (hasPageFiles) {
      await fs.mkdir(join(websitePath, pagesFolder), { recursive: true })
    }

    // **
    // Delete pages that are not in the new website data
    const pagesPath = join(websitePath, pagesFolder)
    try {
      const existingPageFiles = await fs.readdir(pagesPath)
      const newPageFiles = new Set(
        filesToWrite
          .filter(f => f.path.startsWith(pagesFolder))
          .map(f => f.path.replace(`${pagesFolder}/`, ''))
      )

      for (const existingFile of existingPageFiles) {
        if (existingFile.endsWith('.json') && !newPageFiles.has(existingFile)) {
          await fs.unlink(join(pagesPath, existingFile))
        }
      }
    } catch (error) {
      // Ignore error if pages directory doesn't exist yet
    }

    // Write all files
    for (const file of filesToWrite) {
      const filePath = join(websitePath, file.path)
      await fs.writeFile(filePath, file.content)
    }
  }

  async deleteWebsite(session: FsSession, websiteId: WebsiteId): Promise<void> {
    const id = requiredParam<WebsiteId>(websiteId, 'website id')
    const path = join(this.options.path, id)
    return fs.rmdir(path, { recursive: true })
  }

  async duplicateWebsite(session: FsSession, websiteId: WebsiteId): Promise<void> {
    const newWebsiteId = uuid()
    const from = join(this.options.path, websiteId)
    const to = join(this.options.path, newWebsiteId)
    await copyDir(from, to)
    const meta = await this.getWebsiteMeta(session, websiteId)
    await this.setWebsiteMeta(session, newWebsiteId, {
      ...meta,
      name: `${meta.name} copy`,
    })
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
    return this.write(session, id, files, this.options.assetsFolder, statusCbk)
  }

  async write(session: FsSession, id: WebsiteId, files: ConnectorFile[], assetsFolder: string, statusCbk?: StatusCallback): Promise<void> {
    const filesStatuses = this.initStatus(files)
    let error: Error | null = null
    for (const fileStatus of filesStatuses) {
      const {file} = fileStatus
      const path = join(this.options.path, id, assetsFolder, file.path)
      if (typeof file.content === 'string' || Buffer.isBuffer(file.content)) {
        fileStatus.message = 'Writing'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        try {
          await fs.writeFile(path, file.content)
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
