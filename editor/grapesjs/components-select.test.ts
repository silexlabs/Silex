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

import { beforeEach, describe, expect, it } from '@jest/globals'
import grapesjs from 'grapesjs'
import coreCommands from './core-commands'

describe('components_select id round-trip', () => {
  let editor

  beforeEach(() => {
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
      plugins: [coreCommands],
    })
  })

  it('selects a component by getId() even when ccid has drifted', () => {
    const [added] = editor.getWrapper().append({
      tagName: 'section',
    })
    added.addAttributes({ id: 'hero' })
    // GrapesJS usually keeps ccid in sync; the desktop selection bug is when
    // they differ — getId() returns the HTML id, list/select use that.
    added.ccid = 'stale-ccid'
    expect(added.getId()).toBe('hero')
    expect(added.ccid).toBe('stale-ccid')

    expect(() => editor.runCommand('components:select', { id: added.ccid }))
      .toThrow(/stale-ccid/)

    editor.runCommand('components:select', { id: added.getId() })
    expect(editor.getSelected()).toBe(added)

    const listed = editor.runCommand('components:list')
    expect(listed.some(item => item.id === 'hero')).toBe(true)
    expect(listed.some(item => item.id === 'stale-ccid')).toBe(false)
  })

  it('still selects a component that has no HTML id via getId()/ccid', () => {
    const [added] = editor.getWrapper().append({
      tagName: 'div',
    })
    const id = added.getId()
    expect(id).toBeTruthy()
    editor.runCommand('components:select', { id })
    expect(editor.getSelected()).toBe(added)
  })
})
