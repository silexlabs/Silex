/*
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals'
import { mergeSilexSettings, toMcpSettings, toSilexSettings } from './settings-mcp-keys'

describe('settings MCP key mapping', () => {
  it('maps og_* into stored og:* keys on set', () => {
    expect(toSilexSettings({
      title: 'Hello',
      og_title: 'OG Hello',
      og_description: 'OG desc',
      og_image: 'https://example.com/og.png',
    })).toEqual({
      title: 'Hello',
      'og:title': 'OG Hello',
      'og:description': 'OG desc',
      'og:image': 'https://example.com/og.png',
    })
  })

  it('keeps already-canonical og:* keys on set', () => {
    expect(toSilexSettings({
      'og:title': 'Already stored',
    })).toEqual({
      'og:title': 'Already stored',
    })
  })

  it('prefers the MCP underscore name when both forms are sent', () => {
    expect(toSilexSettings({
      og_title: 'From MCP',
      'og:title': 'From storage form',
    })).toEqual({
      'og:title': 'From MCP',
    })
  })

  it('maps stored og:* keys to og_* on get', () => {
    expect(toMcpSettings({
      title: 'Hello',
      'og:title': 'OG Hello',
      'og:description': 'OG desc',
      'og:image': 'https://example.com/og.png',
    })).toEqual({
      title: 'Hello',
      og_title: 'OG Hello',
      og_description: 'OG desc',
      og_image: 'https://example.com/og.png',
    })
  })

  it('round-trips og_* through storage keys', () => {
    const incoming = { og_title: 'A', og_description: 'B', og_image: 'C' }
    expect(toMcpSettings(toSilexSettings(incoming))).toEqual(incoming)
  })

  it('drops leftover og_* keys when merging into stored settings', () => {
    expect(mergeSilexSettings(
      { title: 'Keep', og_title: 'leftover from the MCP rewrite bug' },
      { og_title: 'New title' }
    )).toEqual({
      title: 'Keep',
      'og:title': 'New title',
    })
  })

  it('does not mutate the original object', () => {
    const stored = { title: 'T', 'og:title': 'OG' }
    const mcp = toMcpSettings(stored)
    expect(stored['og:title']).toBe('OG')
    expect(mcp.og_title).toBe('OG')
    expect(mcp).not.toHaveProperty('og:title')
  })
})
