import { jest,  expect, describe, it, beforeEach } from '@jest/globals'

describe('assetUrl', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  //it('store url to display url', async () => {
  //  const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
  //  // Convert a valid URL as stored
  //  expect(storedToDisplayed('/assets/test.webp', 'test-id', 'test-connector'))
  //    .toBe('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  //  // Convert a URL which is already as displayed
  //  expect(storedToDisplayed('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
  //    .toBe('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  //})

  //it('display url to store url', async () => {
  //  const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
  //  // Convert a valid URL as displayed
  //  expect(displayedToStored('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector'))
  //    .toBe('/assets/test.webp')
  //  // Convert a URL which is already as stored
  //  expect(displayedToStored('/assets/test.webp'))
  //    .toBe('/assets/test.webp')
  //})

  //it('store url to display url with a root path', async () => {
  //  Object.defineProperty(window, 'location', {
  //    value: {
  //      href: 'http://localhost:6800/silex',
  //      pathname: '/silex',
  //      origin: 'http://localhost:6800',
  //    },
  //  });
  //  const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
  //  // Convert a valid URL as stored
  //  expect(storedToDisplayed('/assets/test.webp', 'test-id', 'test-connector'))
  //    .toBe('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  //  // Convert a URL which is already as displayed
  //  expect(storedToDisplayed('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
  //    .toBe('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  //})

  it('display url to store url with a root path', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:6800/silex',
        pathname: '/silex',
        origin: 'http://localhost:6800',
      },
    });
    const { displayedToStored, storedToDisplayed } = await import('./assetUrl')
    // Convert a valid URL as displayed
    expect(displayedToStored('/silex/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector'))
      .toBe('/assets/test.webp')
    // Convert a URL which is already as stored
    expect(displayedToStored('/assets/test.webp'))
      .toBe('/assets/test.webp')
  })
})
