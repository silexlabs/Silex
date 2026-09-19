import { expect, jest, beforeEach, it, describe } from '@jest/globals'
import { ServerEvent } from '~/server/events'

const unlink = jest.fn((_path, cb: (err?: Error) => void) => cb())
const readdirSync = jest.fn(() => [] as string[])
const statSync = jest.fn(() => ({ isFile: () => true, mtimeMs: Date.now() }))

jest.unstable_mockModule('fs', () => ({
  createWriteStream: jest.fn(),
  unlink,
  readdirSync,
  statSync,
}))

jest.unstable_mockModule('os', () => ({
  tmpdir: () => '/tmp',
}))

const intervalUnref = jest.fn()
const setIntervalSpy = jest.spyOn(globalThis, 'setInterval').mockImplementation(() => ({
  unref: intervalUnref,
}) as unknown as NodeJS.Timeout)

const { default: DownloadConnector, sweepStaleDownloadZips, STALE_DOWNLOAD_ZIP_MAX_AGE_MS } = await import('./DownloadConnector')

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
  readdirSync.mockReset()
  readdirSync.mockReturnValue([])
  statSync.mockReset()
  statSync.mockReturnValue({ isFile: () => true, mtimeMs: Date.now() })
  intervalUnref.mockClear()
  setIntervalSpy.mockClear()
  setIntervalSpy.mockImplementation(() => ({
    unref: intervalUnref,
  }) as unknown as NodeJS.Timeout)
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

describe('DownloadConnector stale zip sweep', () => {
  const now = 1_700_000_000_000
  const oldZip = 'website-1690000000000-abc12.zip'
  const recentZip = 'website-1699000000000-def34.zip'
  const otherZip = 'backup.zip'
  const notes = 'notes.txt'

  function statFor(path: string) {
    const mtimeMs = path.endsWith(oldZip)
      ? now - STALE_DOWNLOAD_ZIP_MAX_AGE_MS - 1
      : now - 60_000
    return { isFile: () => true, mtimeMs }
  }

  it('deletes matching zips older than 24h and leaves recent and non-matching files', () => {
    readdirSync.mockReturnValue([oldZip, recentZip, otherZip, notes])
    statSync.mockImplementation((path: string) => statFor(path))

    sweepStaleDownloadZips(now)

    expect(readdirSync).toHaveBeenCalledWith('/tmp')
    expect(unlink).toHaveBeenCalledTimes(1)
    expect(unlink).toHaveBeenCalledWith(`/tmp/${oldZip}`, expect.any(Function))
    expect(statSync).toHaveBeenCalledWith(`/tmp/${oldZip}`)
    expect(statSync).toHaveBeenCalledWith(`/tmp/${recentZip}`)
    expect(statSync).not.toHaveBeenCalledWith(`/tmp/${otherZip}`)
    expect(statSync).not.toHaveBeenCalledWith(`/tmp/${notes}`)
  })

  it('sweeps once at startup and schedules a daily unref timer', () => {
    readdirSync.mockReturnValue([oldZip, recentZip, otherZip])
    statSync.mockImplementation((path: string) => statFor(path))
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(now)

    createRouteHandler()

    expect(unlink).toHaveBeenCalledTimes(1)
    expect(unlink).toHaveBeenCalledWith(`/tmp/${oldZip}`, expect.any(Function))
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), STALE_DOWNLOAD_ZIP_MAX_AGE_MS)
    expect(intervalUnref).toHaveBeenCalled()

    dateNow.mockRestore()
  })

  it('sweeps again when the daily timer fires', () => {
    let tick: (() => void) | undefined
    setIntervalSpy.mockImplementation((fn) => {
      tick = fn as () => void
      return { unref: intervalUnref } as unknown as NodeJS.Timeout
    })
    readdirSync.mockReturnValue([oldZip])
    statSync.mockImplementation((path: string) => statFor(path))
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(now)

    createRouteHandler()
    unlink.mockClear()
    expect(tick).toBeDefined()
    tick!()

    expect(unlink).toHaveBeenCalledWith(`/tmp/${oldZip}`, expect.any(Function))
    dateNow.mockRestore()
  })
})
