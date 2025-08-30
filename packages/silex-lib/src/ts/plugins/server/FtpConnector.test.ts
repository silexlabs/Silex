import { ServerConfig } from '../../server/config'
import { expect, jest, beforeEach, afterEach, it, describe } from '@jest/globals'
import { ConnectorType, WebsiteData, WebsiteId } from '../../types'
import { Readable } from 'stream'
import { WEBSITE_DATA_FILE } from '../../constants'

const mocks = {
  access: jest.fn(),
  close: jest.fn(),
  trackProgress: jest.fn(),
  uploadFrom: jest.fn(),
}
function mockClient() {
  jest.mock('basic-ftp', () => ({
    Client: jest.fn().mockImplementation(() => mocks),
  }))
}
mockClient()

const FtpConnector = (await import('./FtpConnector')).default

let connector
const storageRootPath = 'dummy storageRootPath'
const assetsFolder = 'dummy assetsFolder'
const dummySession = {
  [`ftp-${ConnectorType.STORAGE}`]: {
    host: 'dummy host',
    user: 'dummy user',
    pass: 'dummy pass',
    port: 1234,
    secure: false,
    storageRootPath,
  },
}
const dummyId: WebsiteId = 'dummy id'
const dummyWebsite: WebsiteData = {
  pages: [],
  assets: [],
  styles: [],
  settings: {},
  fonts: [],
  symbols: [],
  publication: {},
}

beforeEach(() => {
  mockClient()
  connector = new FtpConnector({} as ServerConfig, {
    type: ConnectorType.STORAGE,
    assetsFolder,
  })
})

afterEach(async () => {
  // FIXME: This removes the mock of Client
  //await jest.resetAllMocks()
  // Reset each mock
  Object.keys(mocks).forEach(key => {
    mocks[key].mockClear()
  })
})

describe('FtpConnector website', () => {
  it('should write to FTP', async () => {
    await connector.updateWebsite(dummySession, dummyId, dummyWebsite)
    expect(mocks.uploadFrom).toHaveBeenCalledTimes(1)
    expect(mocks.uploadFrom.mock.calls[0][0]).toBeInstanceOf(Readable)
    expect(mocks.uploadFrom.mock.calls[0][1]).toBe(`${storageRootPath}/${dummyId}/${WEBSITE_DATA_FILE}`)
  })
})

describe('FtpConnector assets', () => {
  it('should write an asset to FTP', async () => {
    const assets = [{
      path: 'dummy path',
      content: 'dummy content',
    }]
    await connector.writeAssets(dummySession, dummyId, assets)
    expect(mocks.uploadFrom).toHaveBeenCalledTimes(1)
    expect(mocks.uploadFrom.mock.calls[0][0]).toBeInstanceOf(Readable)
    expect(mocks.uploadFrom.mock.calls[0][1]).toBe(`${storageRootPath}/${dummyId}/${assetsFolder}/${assets[0].path}`)
  })
})
