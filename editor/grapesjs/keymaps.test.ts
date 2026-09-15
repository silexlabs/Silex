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

import { keymapsPlugin } from './keymaps'
import { expect, test, beforeEach, describe } from '@jest/globals'
import grapesjs from 'grapesjs'

describe('keymapsPlugin', () => {
  let editor

  beforeEach(() => {
    document.body.innerHTML = '<div id="gjs"></div>'
    editor = grapesjs.init({
      container: '#gjs',
      headless: true,
      plugins: [keymapsPlugin],
    })
    // Mock preview command for headless testing
    let previewActive = false
    editor.Commands.add('preview', {
      run() {
        previewActive = true
      },
      stop() {
        previewActive = false
      },
    })
    // Override isActive for preview command in mock
    const origIsActive = editor.Commands.isActive.bind(editor.Commands)
    editor.Commands.isActive = (id: string) => {
      if (id === 'preview') return previewActive
      return origIsActive(id)
    }
  })

  test('registers default keymaps in Keymaps manager', () => {
    expect(editor.Keymaps.get('general:preview-mode')).toBeDefined()
    expect(editor.Keymaps.get('panels:close-panel')).toBeDefined()
    expect(editor.Keymaps.get('general:open-settings')).toBeDefined()
  })

  test('stops preview mode when Escape is triggered during active preview', () => {
    editor.runCommand('preview')
    expect(editor.Commands.isActive('preview')).toBe(true)

    // Trigger panels:close-panel keymap handler (Escape)
    const closePanelKm = editor.Keymaps.get('panels:close-panel')
    closePanelKm.handler(editor)

    expect(editor.Commands.isActive('preview')).toBe(false)
  })

  test('Escape key closes modal when open and not in preview mode', () => {
    editor.Modal.open({
      title: 'Test Modal',
      content: '<div>Modal Content</div>',
    })
    expect(editor.Modal.isOpen()).toBe(true)

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    expect(editor.Modal.isOpen()).toBe(false)
  })
})
