import { jest,  expect, describe, it, beforeEach } from '@jest/globals'
import { displayedToStored, storedToDisplayed } from './assetUrl'

describe('assetUrl', () => {
  it('store url to display url', () => {
    // Convert a valid URL as stored
    expect(storedToDisplayed('/assets/test.webp', 'test-id', 'test-connector'))
      .toBe('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
    // Convert a URL which is already as displayed
    expect(storedToDisplayed('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector', 'test-id', 'test-connector'))
      .toBe('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector')
  })
  it('display url to store url', () => {
    // Convert a valid URL as displayed
    expect(displayedToStored('/api/website/assets/test.webp?websiteId=test-id&connectorId=test-connector'))
      .toBe('/assets/test.webp')
    // Convert a URL which is already as stored
    expect(displayedToStored('/assets/test.webp'))
      .toBe('/assets/test.webp')
  })
})
