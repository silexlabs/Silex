import { createWriteStream, unlink } from 'fs'
import { readdir, stat, unlink as unlinkAsync } from 'fs/promises'
import { ConnectorOptions, ConnectorType, ConnectorUser, JobData, JobStatus, PublicationJobData, WebsiteId } from '~/common/types.js'
import { ConnectorFile, ConnectorSession, HostingConnector } from '~/server/connectors/connectors.js'
import { tmpdir } from 'os'
import { basename, join } from 'path'
import { JobManager } from '~/server/jobs.js'
import { ServerConfig } from '~/server/config.js'
import { ServerEvent } from '~/server/events.js'

import { Request, Response } from 'express'

type DownloadConnectorSession = ConnectorSession;

type DownloadConnectorOptions = object

const ZIP_ICON = '/assets/download.png'

// Generated download zips are named `${websiteId}-${Date.now()}-${random}.zip`
// (see startPublishingInBackground).
const GENERATED_ZIP_PATTERN = /-\d{13}-[a-z0-9]+\.zip$/
const STALE_ZIP_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h
const SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000 // daily

// Sweep never-downloaded zips from the OS temp dir: generated-pattern files whose
// mtime is older than STALE_ZIP_MAX_AGE_MS. Resolves to the number of files deleted.
export async function sweepStaleDownloadZips(dir: string = tmpdir(), now: number = Date.now()): Promise<number> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (err) {
    console.error('[DownloadConnector] Error while listing temp dir for sweep', err)
    return 0
  }
  const candidates = entries.filter(name => GENERATED_ZIP_PATTERN.test(name))
  const results = await Promise.allSettled(candidates.map(async name => {
    const path = join(dir, name)
    const stats = await stat(path)
    if (now - stats.mtimeMs > STALE_ZIP_MAX_AGE_MS) {
      await unlinkAsync(path)
      return true
    }
    return false
  }))
  let deleted = 0
  for (const result of results) {
    if (result.status === 'rejected') console.error('[DownloadConnector] Error while sweeping stale zip', result.reason)
    else if (result.value) deleted++
  }
  if (deleted > 0) console.log(`[DownloadConnector] Swept ${deleted} stale download zip(s) from temp dir`)
  return deleted
}

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
      // Zips that are generated but never downloaded would otherwise accumulate
      // in the OS temp dir forever. Sweep once at startup, then daily; .unref()
      // so the timer never keeps the process alive.
      sweepStaleDownloadZips()
      const sweepTimer = setInterval(() => sweepStaleDownloadZips(), SWEEP_INTERVAL_MS)
      sweepTimer.unref()

      app.get('/download/:tmpZipFile', async (req: Request, res: Response) => {
        const tmpZipFile = req.params.tmpZipFile as string
        if (basename(tmpZipFile) !== tmpZipFile) {
          res.status(400).send('Invalid download file')
          return
        }
        const path = join(tmpdir(), tmpZipFile)
        res.sendFile(path, {}, (err) => {
          if (err) {
            console.error('[DownloadConnector] Error while sending file', err)
            if (!res.headersSent) res.status((err as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500).send(`
              <h1>Error</h1>
              <p>There was an error while getting the zip file of your website</p>
            `)
            return
          }
          unlink(path, (unlinkErr) => {
            if (unlinkErr) console.error('[DownloadConnector] Error while deleting temporary zip file', unlinkErr)
          })
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
    // archiver v8 is ESM and dropped the default factory (archiver('zip', ...)) in
    // favour of named format classes. Use ZipArchive directly. See forum #250.
    const { ZipArchive } = await import('archiver')
    return new Promise<string>((resolve, reject) => {
      let resolved = false
      try {
        // Generate a temporary path for the zip file, in the OS tmp folder, with the website id, the date and random string
        const path = `${tmpdir()}/${fileName}`
        // create a file to stream archive data to.
        const output = createWriteStream(path)
        const archive = new ZipArchive({
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
