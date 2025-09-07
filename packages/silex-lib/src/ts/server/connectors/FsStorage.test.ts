import { expect, beforeEach, afterAll, it, describe } from '@jest/globals'
import { ServerConfig } from '../config'
import { FsStorage } from './FsStorage'
import { readFileSync, rmdirSync, statSync } from 'fs'
import { join } from 'path'
import { WEBSITE_DATA_FILE } from '../../constants'
import { EMPTY_WEBSITE } from '../../types'

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
    console.log({parsed, content, EMPTY_WEBSITE})
    expect(parsed).toEqual(EMPTY_WEBSITE)
  })
})
