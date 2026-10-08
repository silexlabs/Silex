/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import grapesjs from 'grapesjs'
import { cmdGetSettings, cmdSetSettings, settingsDialog } from './settings'

jest.mock('lit-html', () => ({ html: () => '', render: () => {} }))
jest.mock('./settings-sections', () => ({
  defaultSections: [],
  idCodeWrapper: 'head-code',
  isSite: () => true,
  updateInfo: () => {},
}))

describe('settings:get / settings:set MCP og_* mapping', () => {
  let editor

  beforeEach(() => {
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
    })
    editor.CodeManager.createViewer = () => ({
      getElement: () => document.createElement('div'),
      setContent: () => {},
      refresh: () => {},
    })
    settingsDialog(editor, {})
  })

  it('stores og_* as og:* and returns og_* from settings:get', () => {
    editor.runCommand(cmdSetSettings, {
      og_title: 'OG Hello',
      og_description: 'OG desc',
      og_image: 'https://example.com/og.png',
    })

    const stored = editor.getModel().get('settings')
    expect(stored['og:title']).toBe('OG Hello')
    expect(stored['og:description']).toBe('OG desc')
    expect(stored['og:image']).toBe('https://example.com/og.png')
    expect(stored).not.toHaveProperty('og_title')

    const mcp = editor.runCommand(cmdGetSettings)
    expect(mcp.og_title).toBe('OG Hello')
    expect(mcp.og_description).toBe('OG desc')
    expect(mcp.og_image).toBe('https://example.com/og.png')
    expect(mcp).not.toHaveProperty('og:title')
  })

  it('registers settings:set schema with underscore Open Graph keys', () => {
    const added = []
    editor.trigger('ai-capabilities:ready', (def) => {
      added.push(def)
    })
    const setCap = added.find(def => def.id === cmdSetSettings)
    expect(setCap).toBeTruthy()
    const properties = setCap.inputSchema.properties
    expect(properties).toHaveProperty('og_title')
    expect(properties).toHaveProperty('og_description')
    expect(properties).toHaveProperty('og_image')
    expect(properties).not.toHaveProperty('og:title')
    expect(properties).not.toHaveProperty('og:description')
    expect(properties).not.toHaveProperty('og:image')
  })
})
