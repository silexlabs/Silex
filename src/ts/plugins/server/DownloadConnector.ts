import { createWriteStream } from 'fs'
import archiver from 'archiver'
import { ConnectorOptions, ConnectorType, ConnectorUser, JobData, JobStatus, PublicationJobData, WebsiteId } from '../../types'
import { ConnectorFile, ConnectorSession, HostingConnector } from '../../server/connectors/connectors'
import { tmpdir } from 'os'
import { JobManager } from '../../server/jobs'
import { Readable } from 'stream'
import { ServerConfig } from '../../server/config'
import { ServerEvent } from '../../server/events'
import { getHostingConnector } from '../../server/api/publicationApi'

import { Request, Response } from 'express'

type DownloadConnectorSession = ConnectorSession;

type DownloadConnectorOptions = object

const svg = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M64 464c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16h48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16h48v80c0 17.7 14.3 32 32 32h80V448c0 8.8-7.2 16-16 16H64zM64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V154.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0H64zm48 112c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H128c-8.8 0-16 7.2-16 16zm0 64c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H128c-8.8 0-16 7.2-16 16zm-6.3 71.8L82.1 335.9c-1.4 5.4-2.1 10.9-2.1 16.4c0 35.2 28.8 63.7 64 63.7s64-28.5 64-63.7c0-5.5-.7-11.1-2.1-16.4l-23.5-88.2c-3.7-14-16.4-23.8-30.9-23.8H136.6c-14.5 0-27.2 9.7-30.9 23.8zM128 336h32c8.8 0 16 7.2 16 16s-7.2 16-16 16H128c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>'
const encodedSvg = encodeURIComponent(svg)
const ZIP_ICON = `data:image/svg+xml,${encodedSvg}`

export default class implements HostingConnector<DownloadConnectorSession> {
  connectorId = 'download-connector'
  displayName = 'Download zip file'
  icon = ZIP_ICON
  disableLogout = false
  options: DownloadConnectorOptions
  connectorType = ConnectorType.HOSTING
  color = '#ffffff'
  background = '#006400'

  constructor(config: ServerConfig) {
    // Add a route to serve the zip file
    config.on(ServerEvent.STARTUP_END, ({app}) => {
      app.get('/download/:tmpZipFile', async (req: Request, res: Response) => {
        const path = `${tmpdir()}/${req.params.tmpZipFile}`
        res.sendFile(path, {}, (err) => {
          if (err) {
            console.error('[DownloadConnector] Error while sending file', err)
            res.status(500).send(`
              <h1>Error</h1>
              <p>There was an error while getting the zip file of your website</p>
              <p>${err.message}</p>
            `)
          }
        })
      })
    })
  }

  getOptions(formData: object): ConnectorOptions {
    return {}
  }

  async getOAuthUrl(session: DownloadConnectorSession): Promise<null> { return null }

  async getLoginForm(session: DownloadConnectorSession, redirectTo: string): Promise<string | null> {
    return null
  }
  async getSettingsForm(session: DownloadConnectorSession, redirectTo: string): Promise<string | null> {
    return null
  }

  async isLoggedIn(session: DownloadConnectorSession): Promise<boolean> {
    return true
  }

  async setToken(session: DownloadConnectorSession, query: object): Promise<void> {}

  async logout(session: DownloadConnectorSession): Promise<void> {}

  async getUser(session: DownloadConnectorSession): Promise<ConnectorUser | null> {
    return null
  }

  async publish(session: DownloadConnectorSession, websiteId: WebsiteId, files: ConnectorFile[], jobManager: JobManager): Promise<JobData> {
    const job = jobManager.startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    this.startPublishingInBackground(session, websiteId, files, job)
    return job
  }

  async startPublishingInBackground(session: DownloadConnectorSession, websiteId: WebsiteId, files: ConnectorFile[], job: PublicationJobData): Promise<void> {
    const fileName = `${websiteId}-${Date.now()}-${Math.random().toString(36).substring(7)}.zip`
    return new Promise<string>((resolve, reject) => {
      let resolved = false
      try {
        // Generate a temporary path for the zip file, in the OS tmp folder, with the website id, the date and random string
        const path = `${tmpdir()}/${fileName}`
        // create a file to stream archive data to.
        const output = createWriteStream(path)
        const archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        })

        // Listen to archive events
        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on('close', function () {
          !resolved && resolve(path)
          resolved = true
        })

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function (err) {
          if (err.code === 'ENOENT') {
            // log warning
          } else {
            !resolved && reject(err)
            resolved = true
          }
        })

        // good practice to catch this error explicitly
        archive.on('error', function (err) {
          !resolved && reject(err)
          resolved = true
        })

        // pipe archive data to the filey
        archive.pipe(output)

        // append files
        for (const file of files) {
          job.message = `Adding ${file.path} to the zip file`
          // Handle content as string, buffer or readable
          archive.append(file.content, { name: file.path })
        }

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        job.message = 'Finalizing the zip file'
        return archive.finalize()
          .then(() => path)
      } catch (err) {
        console.error('Error while creating the zip file', err)
        job.message = `Error while creating the zip file: ${err.message}`
        job.status = JobStatus.ERROR
        !resolved && reject(err)
        resolved = true
      }
    })
      .then(path => {
        job.message = `Zip file created, <a href="/download/${fileName}" target="_blank">download it now</a>`
        job.status = JobStatus.SUCCESS
      })
  }

  async getUrl(session: DownloadConnectorSession, websiteId: WebsiteId): Promise<string> {
    return ''
  }
}
