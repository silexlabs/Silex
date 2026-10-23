import { expect, it, describe } from '@jest/globals'
import { assetNameOf } from './publicationApi'

describe('publicationApi assetNameOf', () => {
  it('extracts filename from display URL with query parameters', () => {
    expect(assetNameOf('/api/website/assets/image.webp?websiteId=default&connectorId=fs-storage'))
      .toBe('image.webp')
  })

  it('extracts filename from full URL', () => {
    expect(assetNameOf('http://localhost:6805/api/website/assets/sub/photo.png?websiteId=123'))
      .toBe('sub/photo.png')
  })

  it('normalizes Windows backslashes', () => {
    expect(assetNameOf('\\api\\website\\assets\\image.webp?websiteId=default'))
      .toBe('image.webp')
  })

  it('strips leading /assets/ prefix', () => {
    expect(assetNameOf('/assets/photo.jpg')).toBe('photo.jpg')
    expect(assetNameOf('assets/photo.jpg')).toBe('photo.jpg')
  })

  it('strips leading slashes', () => {
    expect(assetNameOf('/photo.jpg')).toBe('photo.jpg')
    expect(assetNameOf('photo.jpg')).toBe('photo.jpg')
  })

  it('decodes encoded characters in filename', () => {
    expect(assetNameOf('/assets/my%20test%20image.png')).toBe('my test image.png')
    expect(assetNameOf('/api/website/assets/my%20test%20image.png?websiteId=default')).toBe('my test image.png')
  })
})
