import { jest,  expect, describe, it, beforeEach } from '@jest/globals'
import { removeTempDataFromStyles, isExternalUrl } from './assetUrl'

describe('assetUrl', () => {
  beforeEach(() => {
    jest.resetModules()
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:6800/',
        pathname: '',
        origin: 'http://localhost:6800',
      },
    })
    Object.assign(window.location, {
      href: 'http://localhost:6800/',
      pathname: '',
      origin: 'http://localhost:6800',
    })
  })

  it('store url to display url', async () => {
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as stored
    expect(storedToDisplayed('/assets/test.webp', 'test-id', 'test-connector'))
      .toBe('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
    // Convert a URL which is already as displayed
    expect(storedToDisplayed('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
      .toBe('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  })

  it('display url to store url', async () => {
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as displayed
    expect(displayedToStored('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector'))
      .toBe('/assets/test.webp')
    // Convert a URL which is already as stored
    expect(displayedToStored('/assets/test.webp'))
      .toBe('/assets/test.webp')
  })

  it('store url to display url with a root path', async () => {
    Object.assign(window.location, {
      href: 'http://localhost:6800/silex',
      pathname: '/silex',
      origin: 'http://localhost:6800',
    })
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as stored
    expect(storedToDisplayed('/assets/test.webp', 'test-id', 'test-connector'))
      .toBe('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
    // Convert a URL which is already as displayed
    expect(storedToDisplayed('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
      .toBe('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  })

  it('display url to store url with a root path', async () => {
    Object.assign(window.location, {
      href: 'http://localhost:6800/silex',
      pathname: '/silex',
      origin: 'http://localhost:6800',
    })
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as displayed
    expect(displayedToStored('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector'))
      .toBe('/assets/test.webp')
    // Convert a URL which is already as stored
    expect(displayedToStored('/assets/test.webp'))
      .toBe('/assets/test.webp')
  })

  it('store url to display url with escapable chars', async () => {
    Object.assign(window.location, {
      href: 'http://localhost:6800/silex%20with%20spaces',
      pathname: '/silex%20with%20spaces',
      origin: 'http://localhost:6800',
    })
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as displayed
    expect(displayedToStored('/silex%20with%20spaces/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector'))
      .toBe('/assets/test.webp')
    // Convert a URL which is already as stored
    expect(displayedToStored('/assets/test.webp'))
      .toBe('/assets/test.webp')
  })

  it('display url to store url with escapable chars', async () => {
    Object.assign(window.location, {
      href: 'http://localhost:6800/silex%20with%20spaces',
      pathname: '/silex%20with%20spaces',
      origin: 'http://localhost:6800',
    })
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as stored
    expect(storedToDisplayed('/assets/test.webp', 'test-id', 'test-connector'))
      .toBe('/silex with spaces/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
    // Convert a URL which is already as displayed
    expect(storedToDisplayed('/silex%20with%20spaces/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
      .toBe('/silex%20with%20spaces/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
    expect(storedToDisplayed('/silex with spaces/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
      .toBe('/silex with spaces/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  })

  it('store url to display url with escapable website id and connector id', async () => {
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as displayed
    expect(displayedToStored('/api/website/assets/test.webp?websiteId=test%20id&connectorId=test%20connector'))
      .toBe('/assets/test.webp')
    // Convert a URL which is already as stored
    expect(displayedToStored('/assets/test.webp'))
      .toBe('/assets/test.webp')
  })

  it('display url to store url with escapable  website id and connector id', async () => {
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    const websiteId = 'test id'
    const websiteIdEncoded = 'test+id'
    const connectorId = 'test connector'
    const connectorIdEncoded = 'test+connector'
    // Convert a valid URL as stored
    expect(storedToDisplayed('/assets/test.webp', websiteId, connectorId))
      .toBe(`/api/website/assets/test.webp?websiteId=${websiteIdEncoded}&connectorId=${connectorIdEncoded}`)
    // Convert a URL which is already as displayed
    expect(storedToDisplayed(`/api/website/assets/test.webp?websiteId=${websiteIdEncoded}&connectorId=${connectorIdEncoded}`, websiteId, connectorId))
      .toBe(`/api/website/assets/test.webp?websiteId=${websiteIdEncoded}&connectorId=${connectorIdEncoded}`)
  })

  it('isExternalUrl detects external URLs', () => {
    expect(isExternalUrl('https://example.com/image.jpg')).toBe(true)
    expect(isExternalUrl('http://example.com/image.jpg')).toBe(true)
    expect(isExternalUrl('//cdn.example.com/image.jpg')).toBe(true)
    expect(isExternalUrl('/assets/image.jpg')).toBe(false)
    expect(isExternalUrl('/api/website/assets/image.jpg')).toBe(false)
    expect(isExternalUrl('data:image/png;base64,abc')).toBe(false)
    expect(isExternalUrl('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(false)
  })

  it('storedToDisplayed returns external URLs unchanged', async () => {
    const { storedToDisplayed } = await import('./assetUrl')
    const extUrl = 'https://cdna.artstation.com/p/assets/images/images/000/000/001/large/test-image.jpg'
    expect(storedToDisplayed(extUrl, 'test-id', 'test-connector')).toBe(extUrl)
    expect(storedToDisplayed('http://example.com/photo.png', 'test-id', 'test-connector')).toBe('http://example.com/photo.png')
    expect(storedToDisplayed('//cdn.example.com/img.webp', 'test-id', 'test-connector')).toBe('//cdn.example.com/img.webp')
  })

  it('displayedToStored returns external URLs unchanged', async () => {
    const { displayedToStored } = await import('./assetUrl')
    const extUrl = 'https://cdna.artstation.com/p/assets/images/images/000/000/001/large/test-image.jpg'
    expect(displayedToStored(extUrl)).toBe(extUrl)
    expect(displayedToStored('http://example.com/photo.png')).toBe('http://example.com/photo.png')
    expect(displayedToStored('//cdn.example.com/img.webp')).toBe('//cdn.example.com/img.webp')
  })

  it('background-image with external URLs left unchanged', async () => {
    const { addTempDataToStyles } = await import('./assetUrl')
    const extBg = 'url(\'https://cdn.example.com/photo.jpg\')'
    const selectors = ['body']
    const style = { style: { 'background-image': extBg }, selectors }
    // External URL in background-image should pass through unchanged
    expect(addTempDataToStyles([style], 'test-id', 'test-connector')).toEqual([style])
    expect(removeTempDataFromStyles([style])).toEqual([style])
  })

  it('multiple backgrounds', async () => {
    // // FIXME: this should mock the functions but it doesnt
    // const mocked = {
    //   displayedToStored: jest.fn((url: string) => url),
    //   storedToDisplayed: jest.fn((url: string) => url),
    // }
    // jest.mock('./assetUrl', () => (mocked))
    //addTempDataToStyles([toStyle(bgImageDisplayed)], websiteId, connectorId)
    //expect(mocked.displayedToStored).toBeCalledTimes(1)
    const { addTempDataToStyles } = await import('./assetUrl')

    const websiteId = 'test-id'
    const connectorId = 'test-connector'
    const bgImageDisplayed = `linear-gradient(to right, #1fb101 0%, #df1313 67%, rgba(234, 97, 97, 255) 78%, white 100%), url('/api/website/assets/qIg7JPRc.webp?websiteId=${websiteId}&connectorId=${connectorId}'), linear-gradient(#0ca311 0%, #0ca311 100%)`
    const bgImageStored = 'linear-gradient(to right, #1fb101 0%, #df1313 67%, rgba(234, 97, 97, 255) 78%, white 100%), url(\'/assets/qIg7JPRc.webp\'), linear-gradient(#0ca311 0%, #0ca311 100%)'
    const selectors = ['body']
    function toStyle(bgImage: string) {
      return {
        style: {
          'background-image': bgImage,
        },
        selectors,
      }
    }
    // From stored to displayed
    expect(addTempDataToStyles([toStyle(bgImageStored)], websiteId, connectorId))
      .toEqual([toStyle(bgImageDisplayed)])
    // From displayed to displayed (error case)
    expect(addTempDataToStyles([toStyle(bgImageDisplayed)], websiteId, connectorId))
      .toEqual([toStyle(bgImageDisplayed)])
    // From displayed to stored
    expect(removeTempDataFromStyles([toStyle(bgImageDisplayed)]))
      .toEqual([toStyle(bgImageStored)])
    //// From stored to stored (error case)
    expect(removeTempDataFromStyles([toStyle(bgImageStored)]))
      .toEqual([toStyle(bgImageStored)])
  })
})
