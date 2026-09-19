/*
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { cmdGetSettings, cmdSetSettings, settingsDialog } from './settings'

jest.mock('lit-html', () => ({ html: () => '', render: () => {} }))
jest.mock('./settings-sections', () => ({
  defaultSections: [],
  idCodeWrapper: 'head-code',
  isSite: () => true,
  updateInfo: () => {},
}))

describe('settings:get / settings:set MCP og_* mapping', () => {
  let editor: Editor

  beforeEach(() => {
    /* @ts-ignore */
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
    })
    editor.CodeManager.createViewer = () => ({
      getElement: () => document.createElement('div'),
      setContent: () => {},
      refresh: () => {},
    }) as any
    settingsDialog(editor, {})
  })

  it('stores og_* as og:* and returns og_* from settings:get', () => {
    editor.runCommand(cmdSetSettings, {
      og_title: 'OG Hello',
      og_description: 'OG desc',
      og_image: 'https://example.com/og.png',
    })

    const stored = editor.getModel().get('settings') as Record<string, unknown>
    expect(stored['og:title']).toBe('OG Hello')
    expect(stored['og:description']).toBe('OG desc')
    expect(stored['og:image']).toBe('https://example.com/og.png')
    expect(stored).not.toHaveProperty('og_title')

    const mcp = editor.runCommand(cmdGetSettings) as Record<string, unknown>
    expect(mcp.og_title).toBe('OG Hello')
    expect(mcp.og_description).toBe('OG desc')
    expect(mcp.og_image).toBe('https://example.com/og.png')
    expect(mcp).not.toHaveProperty('og:title')
  })

  it('registers settings:set schema with underscore Open Graph keys', () => {
    const added: Record<string, unknown>[] = []
    editor.trigger('ai-capabilities:ready', (def: Record<string, unknown>) => {
      added.push(def)
    })
    const setCap = added.find(def => def.id === cmdSetSettings)
    expect(setCap).toBeTruthy()
    const properties = (setCap!.inputSchema as { properties: Record<string, unknown> }).properties
    expect(properties).toHaveProperty('og_title')
    expect(properties).toHaveProperty('og_description')
    expect(properties).toHaveProperty('og_image')
    expect(properties).not.toHaveProperty('og:title')
    expect(properties).not.toHaveProperty('og:description')
    expect(properties).not.toHaveProperty('og:image')
  })
})
