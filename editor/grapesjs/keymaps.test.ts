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

import { expect, test, beforeEach, afterEach } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { keymapsPlugin } from './keymaps'

let editor: Editor
let panel: HTMLElement

function pressCtrlZ(target: HTMLElement, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'z', keyCode: 90, ctrlKey: true, shiftKey, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  target.dispatchEvent(new KeyboardEvent('keyup', { key: 'z', keyCode: 90, bubbles: true }))
  return event
}

function focusInPanel(html: string): HTMLElement {
  panel.innerHTML = html
  const el = panel.firstElementChild as HTMLElement
  el.focus()
  expect(document.activeElement).toBe(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = '<div id="gjs"></div><div id="side-panel"></div>'
  panel = document.getElementById('side-panel')!
  editor = grapesjs.init({
    container: '#gjs',
    storageManager: false,
    autorender: false,
    plugins: [keymapsPlugin],
  })
  editor.UndoManager.clear()
  editor.addComponents('<div id="added">added</div>')
  expect(editor.getComponents()).toHaveLength(1)
})

afterEach(() => {
  editor.destroy()
})

test('Ctrl+Z undoes when an element of a side panel has the focus', () => {
  const el = focusInPanel('<div tabindex="0">layers</div>')
  const event = pressCtrlZ(el)
  expect(editor.getComponents()).toHaveLength(0)
  expect(event.defaultPrevented).toBe(true)
  // Ctrl+Shift+Z redoes
  pressCtrlZ(el, true)
  expect(editor.getComponents()).toHaveLength(1)
})

test('Ctrl+Z undoes when a select or a checkbox has the focus', () => {
  pressCtrlZ(focusInPanel('<select><option>block</option></select>'))
  expect(editor.getComponents()).toHaveLength(0)
  editor.addComponents('<div>added again</div>')
  expect(editor.getComponents()).toHaveLength(1)
  pressCtrlZ(focusInPanel('<input type="checkbox">'))
  expect(editor.getComponents()).toHaveLength(0)
})

test('Ctrl+Z is left to the browser in text fields', () => {
  for (const html of ['<input type="text">', '<input>', '<input type="number">', '<textarea></textarea>']) {
    const event = pressCtrlZ(focusInPanel(html))
    expect(editor.getComponents()).toHaveLength(1)
    expect(event.defaultPrevented).toBe(false)
  }
})
