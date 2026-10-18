import { expect, beforeEach, afterAll, it, describe } from '@jest/globals'
import { ServerConfig } from '../config'
import { FsStorage } from './FsStorage'
import { readFileSync, rmdirSync, statSync } from 'fs'
import { join } from 'path'
import { WEBSITE_DATA_FILE } from '~/common/constants'
import { EMPTY_WEBSITE } from '~/common/types'

const storageRootPath = '/tmp/silex-tests'
const assetsFolder = 'assets'
const dummySession = {}
const dummyId = 'dummy id'
const dummyWebsite = {
  pages: [],
  assets: [],
  styles: [],
  settings: {},
  fonts: [],
  symbols: [],
  publication: {},
}

beforeEach(() => {
})

afterAll(() => {
  rmdirSync(storageRootPath, { recursive: true })
})

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
describe('FsStorage website', () => {
  it('should create the root folder', async () => {
    expect(() => statSync(storageRootPath)).toThrow()
    const connector = new FsStorage({} as ServerConfig, {
      path: storageRootPath,
      assetsFolder,
    })
    await sleep(100)
    expect(() => statSync(storageRootPath)).not.toThrow()
  })
  it('should create a new website', async () => {
    const connector = new FsStorage({} as ServerConfig, {
      path: storageRootPath,
      assetsFolder,
    })
    const id = await connector.createWebsite(dummySession, { name: 'dummy name', connectorUserSettings: {} })
    expect(id).toBeDefined()
    expect(() => statSync(join(storageRootPath, id, WEBSITE_DATA_FILE))).not.toThrow()
    const content = readFileSync(join(storageRootPath, id, WEBSITE_DATA_FILE), 'utf8')
    const parsed = JSON.parse(content)
    expect(parsed).toEqual(EMPTY_WEBSITE)
  })
})

describe('FsStorage path confinement', () => {
  function connector() {
    return new FsStorage({} as ServerConfig, {
      path: storageRootPath,
      assetsFolder,
    })
  }

  it('should read an asset of the website', async () => {
    const storage = connector()
    const id = await storage.createWebsite(dummySession, { name: 'dummy name', connectorUserSettings: {} })
    await storage.writeAssets(dummySession, id, [{ path: '/asset.txt', content: 'hello' }])
    const content = await storage.readAsset(dummySession, id, 'asset.txt')
    expect(content.toString()).toBe('hello')
  })

  it('should refuse an asset name which leads out of the website', async () => {
    const storage = connector()
    const id = await storage.createWebsite(dummySession, { name: 'dummy name', connectorUserSettings: {} })
    await expect(storage.readAsset(dummySession, id, '../../../../etc/hostname')).rejects.toThrow()
    await expect(storage.writeAssets(dummySession, id, [{ path: '/../../../pwned.txt', content: 'pwned' }])).rejects.toThrow()
  })

  it('should refuse a website id which leads out of the storage folder', async () => {
    await expect(connector().updateWebsite(dummySession, '../../evil', dummyWebsite as any)).rejects.toThrow()
  })
})
