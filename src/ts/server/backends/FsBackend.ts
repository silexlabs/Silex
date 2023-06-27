import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import fsExtra from 'fs-extra'
import { File, Storage, HostingProvider } from './Backend'
import { join } from 'path'

export class FsBackend implements Storage, HostingProvider {
  name = 'FsBackend'
  rootPath: string
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

  async setAuthToken(session: any): Promise<void> {}

  isLoggedIn(session: any): boolean {
    return true
  }

  async login(session: any): Promise<void> {}

  async logout(session: any): Promise<void> {}

  async getAdminUrl(session: any, id: string): Promise<string> {
    return ''
  }

  async init(session: any, id: string): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id), { recursive: true })
  }

  async readFile(session: any, id: string, path: string): Promise<File> {
    const content = await fs.readFile(join(this.options.rootPath, id, path), 'utf8')
    return { path, content }
  }

  async writeFiles(session: any, id: string, files: File[]): Promise<void> {
    for (const file of files) {
      if (typeof file.content === 'string') {
        await fs.writeFile(join(this.options.rootPath, id, file.path), file.content)
      } else {
        const writeStream = createWriteStream(join(this.options.rootPath, id, file.path))
        file.content.pipe(writeStream)
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })
      }
    }
  }

  async deleteFiles(session: any, id: string, paths: string[]): Promise<void> {
    for (const path of paths) {
      await fs.unlink(join(this.options.rootPath, id, path))
    }
  }

  async listDir(session: any, id: string, path: string): Promise<string[]> {
    return fs.readdir(join(this.options.rootPath, id, path))
  }

  async createDir(session: any, id: string, path: string): Promise<void> {
    await fs.mkdir(join(this.options.rootPath, id, path), { recursive: true })
  }

  async deleteDir(session: any, id: string, path: string): Promise<void> {
    await fsExtra.remove(join(this.options.rootPath, id, path))
  }

  async publish(session: any, id: string): Promise<void> {}
}
