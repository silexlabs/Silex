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

import { semanticPlugin } from './semantic'
import { expect, test, beforeEach, describe } from '@jest/globals'
import grapesjs from 'grapesjs'

describe('semanticPlugin', () => {
  let editor

  beforeEach(() => {
    document.body.innerHTML = '<div id="gjs"></div>'
    editor = grapesjs.init({
      container: '#gjs',
      headless: true,
      plugins: [semanticPlugin],
    })
  })

  test('registers tag-name, for-trait and datetime-trait in TraitManager', () => {
    expect(editor.TraitManager.getType('tag-name')).toBeDefined()
    expect(editor.TraitManager.getType('for-trait')).toBeDefined()
    expect(editor.TraitManager.getType('datetime-trait')).toBeDefined()
  })

  test('allows setting TIME tag and datetime attribute', () => {
    const comp = editor.addComponents({
      tagName: 'time',
      content: 'August 27, 2026',
      attributes: { datetime: '2026-08-27' },
    })[0]

    expect(comp.get('tagName').toUpperCase()).toBe('TIME')
    expect(comp.getAttributes().datetime).toBe('2026-08-27')

    const html = editor.getHtml()
    expect(html).toContain('<time')
    expect(html).toContain('datetime="2026-08-27"')
  })

  test('adds datetime trait to component traits list', () => {
    const comp = editor.addComponents('<div>Text</div>')[0]
    const traits = comp.getTraits()
    const datetimeTrait = traits.find((t: any) => t.get('name') === 'datetime')
    expect(datetimeTrait).toBeDefined()
    expect(datetimeTrait.get('type')).toBe('datetime-trait')
  })
})
