import { expect, jest, beforeEach, it, describe } from '@jest/globals'
import { ServerEvent } from '~/server/events'

const unlink = jest.fn((_path, cb: (err?: Error) => void) => cb())
const readdir = jest.fn()
const stat = jest.fn()

jest.unstable_mockModule('fs', () => ({
  createWriteStream: jest.fn(),
  unlink,
  readdir,
  stat,
}))

jest.unstable_mockModule('os', () => ({
  tmpdir: () => '/tmp',
}))

const DownloadConnector = (await import('./DownloadConnector')).default
const { sweepStaleDownloadZips } = await import('./DownloadConnector')

function createRouteHandler() {
  const app = {
    get: jest.fn(),
  }
  const config = {
    on: jest.fn((_event, callback: (payload: {app: typeof app}) => void) => callback({app})),
  }

  new DownloadConnector(config as never)

  expect(config.on).toHaveBeenCalledWith(ServerEvent.STARTUP_END, expect.any(Function))
  expect(app.get).toHaveBeenCalledWith('/download/:tmpZipFile', expect.any(Function))

  return app.get.mock.calls[0][1] as (req, res) => Promise<void>
}

beforeEach(() => {
  unlink.mockClear()
  readdir.mockClear()
  stat.mockClear()
})

describe('DownloadConnector download route', () => {
  it('deletes the temporary zip after a successful download', async () => {
    const handler = createRouteHandler()
    const sendFile = jest.fn((_path, _options, callback: (err?: Error) => void) => callback())
    const res = {
      sendFile,
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }

    await handler({params: {tmpZipFile: 'website-123.zip'}}, res)

    expect(sendFile).toHaveBeenCalledWith('/tmp/website-123.zip', {}, expect.any(Function))
    expect(unlink).toHaveBeenCalledWith('/tmp/website-123.zip', expect.any(Function))
    expect(res.status).not.toHaveBeenCalled()
  })

  it('rejects unsafe temporary zip names', async () => {
    const handler = createRouteHandler()
    const res = {
      sendFile: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }

    await handler({params: {tmpZipFile: '../secret.zip'}}, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith('Invalid download file')
    expect(res.sendFile).not.toHaveBeenCalled()
    expect(unlink).not.toHaveBeenCalled()
  })
})


describe('DownloadConnector stale-zip sweep', () => {
  const NOW = 1_700_000_000_000
  const DAY = 24 * 60 * 60 * 1000
  // Matches `${websiteId}-${Date.now()}-${random}.zip`
  const OLD_ZIP = 'mysite-1699000000000-ab12cd.zip'   // generated name, old mtime
  const RECENT_ZIP = 'mysite-1699950000000-ef34gh.zip' // generated name, recent mtime
  const OTHER_FILE = 'important-notes.txt'             // non-matching, must be left alone
  const OTHER_ZIP = 'backup.zip'                       // a .zip but not the generated shape

  function mockDir(entries: string[], mtimeByName: Record<string, number>) {
    readdir.mockImplementation((_dir, cb: (err: Error | null, files: string[]) => void) => cb(null, entries))
    stat.mockImplementation((path: string, cb: (err: Error | null, stats: { mtimeMs: number }) => void) => {
      const name = path.split('/').pop() as string
      cb(null, { mtimeMs: mtimeByName[name] })
    })
  }

  it('deletes matching zips older than 24h, keeps recent ones, and never touches non-matching files', async () => {
    mockDir([OLD_ZIP, RECENT_ZIP, OTHER_FILE, OTHER_ZIP], {
      [OLD_ZIP]: NOW - 2 * DAY,     // stale -> delete
      [RECENT_ZIP]: NOW - 1000,     // fresh -> keep
    })

    const deleted = await sweepStaleDownloadZips('/tmp', NOW)

    expect(deleted).toBe(1)
    // only the old generated zip is unlinked
    expect(unlink).toHaveBeenCalledTimes(1)
    expect(unlink).toHaveBeenCalledWith('/tmp/' + OLD_ZIP, expect.any(Function))
    // non-matching files are never even stat'd
    const statedPaths = stat.mock.calls.map((c: unknown[]) => c[0])
    expect(statedPaths).not.toContain('/tmp/' + OTHER_FILE)
    expect(statedPaths).not.toContain('/tmp/' + OTHER_ZIP)
  })

  it('resolves to 0 and unlinks nothing when the temp dir has no generated zips', async () => {
    mockDir([OTHER_FILE, OTHER_ZIP], {})

    const deleted = await sweepStaleDownloadZips('/tmp', NOW)

    expect(deleted).toBe(0)
    expect(stat).not.toHaveBeenCalled()
    expect(unlink).not.toHaveBeenCalled()
  })

  it('resolves to 0 without throwing when the temp dir cannot be read', async () => {
    readdir.mockImplementation((_dir, cb: (err: Error | null, files: string[]) => void) => cb(new Error('EACCES'), []))

    const deleted = await sweepStaleDownloadZips('/tmp', NOW)

    expect(deleted).toBe(0)
    expect(unlink).not.toHaveBeenCalled()
  })
})
