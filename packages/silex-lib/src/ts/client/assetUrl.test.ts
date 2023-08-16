import { jest,  expect, describe, it, beforeEach } from '@jest/globals'

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
})
