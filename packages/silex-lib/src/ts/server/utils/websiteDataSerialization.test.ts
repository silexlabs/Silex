import { stringify, split, merge } from './websiteDataSerialization'
import { expect, it, describe } from '@jest/globals'
import { WebsiteData, defaultWebsiteData } from '../../types'
import { WEBSITE_DATA_FILE } from '../../constants'

describe('websiteDataSerialization', () => {
  describe('stringify', () => {
    it('should format JSON with sorted keys', () => {
      const data = { z: 1, a: 2, m: { z: 3, a: 4 } }
      const result = stringify(data)
      expect(result).toBe(`{
  "a": 2,
  "m": {
    "a": 4,
    "z": 3
  },
  "z": 1
}`)
    })
  })

  describe('split', () => {
    it('should split website data into separate files', () => {
      const websiteData: WebsiteData = {
        ...defaultWebsiteData,
        pages: [
          { id: 'page1', getName: () => 'Home' } as any,
          { id: 'page2', getName: () => 'About' } as any
        ]
      }
      
      const files = split(websiteData)
      
      expect(files).toHaveLength(3)
      expect(files[0].path).toBe('src/home-page1.json')
      expect(files[1].path).toBe('src/about-page2.json')
      expect(files[2].path).toBe(WEBSITE_DATA_FILE)
      
      const mainFile = JSON.parse(files[2].content)
      expect(mainFile.fileFormatVersion).toBe('1.0.0')
      expect(mainFile.pages[0].isFile).toBe(true)
    })
  })

  describe('merge', () => {
    it('should handle legacy format', async () => {
      const legacyContent = `{
        "settings": {},
        "pages": [{ "id": "page1" }]
      }`
      
      const pageLoader = async () => { throw new Error('Should not be called') }
      const result = await merge(legacyContent, pageLoader)
      
      expect(result.pages).toHaveLength(1)
      expect(result.pages[0].id).toBe('page1')
    })
  })
})