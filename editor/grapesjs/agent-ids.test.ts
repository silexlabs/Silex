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

import { describe, expect, it } from '@jest/globals'
import grapesjs from 'grapesjs'
import coreCommands from './core-commands'
import agentIds from './agent-ids'

const open = () => grapesjs.init({
  headless: true,
  storageManager: { autoload: false },
  plugins: [coreCommands, agentIds],
  components: '<section id="hero" class="hero"><h1>Title</h1></section>',
})

describe('agent ids', () => {
  it('keeps an id through a move, gives a new one to a copy, and refuses an id from before a reopening', () => {
    const editor = open()
    const [section] = editor.getWrapper()!.components().models
    const idOf = component => editor.runCommand('agent-ids:get', { component })
    const { id } = editor.runCommand('components:list').find(item => item.tagName === 'section')
    expect(id).not.toBe('hero')

    const [footer] = editor.getWrapper()!.append('<footer class="footer"></footer>')
    editor.runCommand('components:move', { id, targetId: idOf(footer), position: 'after' })
    expect(section.index()).toBe(1)
    editor.runCommand('components:select', { id })
    expect(editor.getSelected()).toBe(section)

    editor.runCommand('core:copy')
    editor.runCommand('core:paste')
    const pasted = section.parent()!.getChildAt(section.index() + 1)
    expect(pasted.getName()).toBe(section.getName())
    expect(idOf(pasted)).not.toBe(id)

    const main = editor.Components.addSymbol(section)!
    const [instance] = editor.getWrapper()!.append(editor.Components.addSymbol(main)!)
    expect(idOf(instance)).not.toBe(id)
    editor.runCommand('components:select', { id })
    expect(editor.getSelected()).toBe(section)

    const reopened = open()
    expect(() => reopened.runCommand('components:select', { id }))
      .toThrow(/change each time the website is opened/)
  })
})
