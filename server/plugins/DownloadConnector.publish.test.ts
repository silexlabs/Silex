import { expect, it, describe } from '@jest/globals'
import { existsSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import DownloadConnector from './DownloadConnector.js'
import { JobStatus } from '~/common/types.js'

// Regression test for forum #250 / archiver v8 ESM bump.
// archiver v8 is ESM-only and dropped the default factory (`archiver('zip', ...)`),
// so `(await import('archiver')).default` became undefined and publishing threw
// "archiver is not a function". This exercises the real zip pipeline end to end.
describe('DownloadConnector publish (zip pipeline)', () => {
  it('zips the website files and reports SUCCESS', async () => {
    const connector = new DownloadConnector({ on: () => {} } as never)
    const files = [
      { path: 'index.html', content: '<h1>hi</h1>' },
      { path: 'assets/img.txt', content: Buffer.from('pretend-image-bytes') },
    ]
    const job = { message: '', status: JobStatus.IN_PROGRESS } as never as { message: string; status: JobStatus }

    await connector.startPublishingInBackground({} as never, 'website-regression' as never, files as never, job as never)

    expect(job.status).toBe(JobStatus.SUCCESS)
    // The success message exposes the download link with the generated file name.
    const match = job.message.match(/\/download\/(website-regression-[^"]+\.zip)/)
    expect(match).not.toBeNull()

    const zipPath = join(tmpdir(), match![1])
    expect(existsSync(zipPath)).toBe(true)
    expect(statSync(zipPath).size).toBeGreaterThan(0)
  })
})
