import { createWriteStream } from 'fs'
import archiver from 'archiver'
import { ConnectorOptions, ConnectorType, ConnectorUser, JobData, JobStatus, PublicationJobData, WebsiteId } from '../../types'
import { ConnectorFile, ConnectorSession, HostingConnector } from '../../server/connectors/connectors'
import { tmpdir } from 'os'
import { JobManager } from '../../server/jobs'
import { ServerConfig } from '../../server/config'
import { ServerEvent } from '../../server/events'

import { Request, Response } from 'express'

type DownloadConnectorSession = ConnectorSession;

type DownloadConnectorOptions = object

const ZIP_ICON = '/assets/download.png'

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
