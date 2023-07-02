import fs, { stat } from 'fs/promises'
import { createWriteStream, mkdir } from 'fs'
import fsExtra from 'fs-extra'
import { File, StorageProvider, HostingProvider, StatusCallback} from '.'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { BackendData, JobData, JobId, JobStatus, WebsiteId } from '../../types'
import { getJob, jobError, jobSuccess, startJob } from '../jobs'

export class FsBackend implements StorageProvider, HostingProvider {
  id = 'fs'
  displayName = 'File system'
  icon = 'file'
  rootPath: string
  disableLogout = true
  options: { rootPath: string }

  constructor(opts) {
    this.options = {
      rootPath: __dirname + '/../../../.silex',
      ...opts,
    }
  }
  
  async getAuthorizeURL(session: any): Promise<string> {
    return ''
  }

  async isLoggedIn(session: any): Promise<boolean> {
    return true
  }

  async login(session: any): Promise<void> {}

  async logout(session: any): Promise<void> {}

  async getAdminUrl(session: any, id: WebsiteId): Promise<string> {
    return ''
  }

  async addAuthRoutes(router: any): Promise<void> {}

  async init(session: any, id: WebsiteId): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id), { recursive: true })
  }

  async readFile(session: any, id: WebsiteId, path: string): Promise<File> {
    const content = await fs.readFile(join(this.options.rootPath, id, path))
    return { path, content }
  }

  updateStatus(filesStatuses, status, statusCbk) {
    console.log('updateStatus', status)
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
  async listWebsites(session: any): Promise<WebsiteId[]> {
    const fileNames = await fs.readdir(this.options.rootPath)
    // Filter directories only
    // That's a way to do an async filter
    const withType = await Promise.all(fileNames.map(async fileName => ({
      fileName,
      isDir: (await stat(join(this.options.rootPath, fileName))).isDirectory(),
    })))
    return withType
      .filter(({fileName, isDir}) => isDir)
      .map(({fileName}) => fileName as WebsiteId)
  }
  async writeFiles(session: any, id: WebsiteId, files: File[], statusCbk?: StatusCallback): Promise<void> {
    console.log('writeFiles', id, files )
    const filesStatuses = this.initStatus(files)
    let error = false
    for (const fileStatus of filesStatuses) {
      const {file} = fileStatus
      if (typeof file.content === 'string') {
        fileStatus.message = 'Download started'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        try {
          await fs.writeFile(join(this.options.rootPath, id, file.path), file.content)
        } catch(err) {
          fileStatus.message = `Error (${err})`
          this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
          error = true
          continue
        }
        fileStatus.message = 'Downloaded'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
      } else {
        fileStatus.message = 'Download started'
        this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
        const writeStream = createWriteStream(join(this.options.rootPath, id, file.path))
        file.content.pipe(writeStream)
        await new Promise((resolve) => {
          writeStream.on('finish', () => {
            fileStatus.message = 'Downloaded'
            this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
            resolve(file)
          })
          writeStream.on('error', err => {
            console.log('writeStream error', err)
            fileStatus.message = `Error (${err})`
            this.updateStatus(filesStatuses, JobStatus.IN_PROGRESS, statusCbk)
            error = true
            resolve(file)
          })
        })
      }
    }
    this.updateStatus(filesStatuses, error ? JobStatus.ERROR : JobStatus.SUCCESS, statusCbk)
  }

  async publish(session: any, id: WebsiteId, backendData: BackendData, files: File[]): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`)
    this.writeFiles(session, id, files, async ({status, message}) => {
      console.log('Publication status', {status, message})
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

  async deleteFiles(session: any, id: WebsiteId, paths: string[]): Promise<void> {
    for (const path of paths) {
      await fs.unlink(join(this.options.rootPath, id, path))
    }
  }

  async listDir(session: any, id: WebsiteId, path: string): Promise<string[]> {
    return fs.readdir(join(this.options.rootPath, id, path))
  }

  async createDir(session: any, id: WebsiteId, path: string): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id, path), { recursive: true })
  }

  async deleteDir(session: any, id: WebsiteId, path: string): Promise<void> {
    await fsExtra.remove(join(this.options.rootPath, id, path))
  }

  async getFileUrl(session: any, id: WebsiteId, path: string): Promise<string> {
    console.log('getFileUrl', id, path)
    const filePath = join(this.options.rootPath, id, path)
    const fileUrl = new URL(filePath, 'file://')
    return fileUrl.toString()
  }

  async getWebsiteUrl(session: any, id: WebsiteId): Promise<string> {
    return this.getFileUrl(session, id, '/index.html')
  }
}
