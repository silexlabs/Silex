import { createWriteStream, unlink, readdir, stat } from 'fs'
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
// (see startPublishingInBackground). Only files matching this exact shape are
// ever swept, so unrelated files in the OS temp dir are never touched.
const GENERATED_ZIP_PATTERN = /-\d{13}-[a-z0-9]+\.zip$/
// Zips not downloaded within this window are considered stale and removed.
const STALE_ZIP_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h
// How often the leftover sweep runs after the initial startup pass.
const SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000 // daily

// Sweep never-downloaded zips from the OS temp dir: files matching the generated
// name pattern whose mtime is older than STALE_ZIP_MAX_AGE_MS. Resolves to the
// number of files deleted. Non-matching files are never stat'd or unlinked.
export function sweepStaleDownloadZips(dir: string = tmpdir(), now: number = Date.now()): Promise<number> {
  return new Promise<number>((resolve) => {
    readdir(dir, (readErr, entries) => {
      if (readErr) {
        console.error('[DownloadConnector] Error while listing temp dir for sweep', readErr)
        resolve(0)
        return
      }
      const candidates = entries.filter(name => GENERATED_ZIP_PATTERN.test(name))
      if (candidates.length === 0) {
        resolve(0)
        return
      }
      let pending = candidates.length
      let deleted = 0
      for (const name of candidates) {
        const path = join(dir, name)
        stat(path, (statErr, stats) => {
          if (!statErr && now - stats.mtimeMs > STALE_ZIP_MAX_AGE_MS) {
            unlink(path, (unlinkErr) => {
              if (unlinkErr) console.error('[DownloadConnector] Error while sweeping stale zip', unlinkErr)
              else deleted++
              if (--pending === 0) resolve(deleted)
            })
          } else {
            if (statErr) console.error('[DownloadConnector] Error while stating temp file for sweep', statErr)
            if (--pending === 0) resolve(deleted)
          }
        })
      }
    })
  })
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
      // Sweep leftover zips that were generated but never downloaded. The
      // per-download route deletes a zip after it is served, but zips that are
      // never fetched would otherwise accumulate in the OS temp dir forever
      // (this filled /tmp with ~18 GB on v3.silex.me). Run once at startup, then
      // daily; .unref() so the timer never keeps the process alive.
      sweepStaleDownloadZips()
        .then(deleted => { if (deleted > 0) console.log(`[DownloadConnector] Swept ${deleted} stale download zip(s) from temp dir`) })
      const sweepTimer = setInterval(() => {
        sweepStaleDownloadZips()
          .then(deleted => { if (deleted > 0) console.log(`[DownloadConnector] Swept ${deleted} stale download zip(s) from temp dir`) })
      }, SWEEP_INTERVAL_MS)
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
            if (!res.headersSent) res.status(500).send(`
              <h1>Error</h1>
              <p>There was an error while getting the zip file of your website</p>
              <p>${err.message}</p>
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
