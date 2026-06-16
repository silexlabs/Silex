import { expect, jest, beforeEach, it, describe } from '@jest/globals'
import { ServerEvent } from '~/server/events'

const unlink = jest.fn((_path, cb: (err?: Error) => void) => cb())

jest.unstable_mockModule('fs', () => ({
  createWriteStream: jest.fn(),
  unlink,
}))

jest.unstable_mockModule('os', () => ({
  tmpdir: () => '/tmp',
}))

const DownloadConnector = (await import('./DownloadConnector')).default

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
