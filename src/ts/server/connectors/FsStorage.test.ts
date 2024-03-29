import { expect, beforeEach, afterAll, it, describe } from '@jest/globals'
import { ServerConfig } from '../config'
import { FsStorage } from './FsStorage'
import { readFileSync, rmdirSync, statSync } from 'fs'
import { join } from 'path'

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
    expect(() => statSync(join(storageRootPath, id, 'website.json'))).not.toThrow()
    expect(readFileSync(join(storageRootPath, id, 'website.json'), 'utf8')).toBe(JSON.stringify({}))
  })
})
