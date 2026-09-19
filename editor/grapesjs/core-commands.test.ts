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

import { expect, describe, it, beforeEach, afterEach } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import coreCommands from './core-commands'

describe('core MCP commands', () => {
  let editor: Editor

  beforeEach(() => {
    /* @ts-ignore */
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
      plugins: [coreCommands],
    })
  })

  afterEach(() => {
    editor.destroy()
  })

  describe('classes:remove', () => {
    it('rejects a class that is not on the selected element and lists current classes', () => {
      const selected = editor.getWrapper()!.append('<div class="card hero"></div>')[0]
      editor.select(selected)

      expect(() => editor.runCommand('classes:remove', { name: 'x' }))
        .toThrow('Class "x" is not on the selected element. Its classes are: card, hero.')
      expect(selected.getClasses()).toEqual(['card', 'hero'])
    })

    it('rejects when the element has no classes', () => {
      const selected = editor.getWrapper()!.append('<div></div>')[0]
      editor.select(selected)

      expect(() => editor.runCommand('classes:remove', { name: 'card' }))
        .toThrow('Class "card" is not on the selected element. Its classes are: (none).')
    })

    it('removes a class that is on the selected element', () => {
      const selected = editor.getWrapper()!.append('<div class="card hero"></div>')[0]
      editor.select(selected)

      editor.runCommand('classes:remove', { name: 'card' })
      expect(selected.getClasses()).toEqual(['hero'])
    })
  })

  describe('history:undo / history:redo', () => {
    it('rejects undo and redo when the history is empty', () => {
      expect(() => editor.runCommand('history:undo')).toThrow('Nothing to undo.')
      expect(() => editor.runCommand('history:redo')).toThrow('Nothing to redo.')
    })

    it('undos a change and then rejects a further undo', () => {
      const selected = editor.getWrapper()!.append('<div></div>')[0]
      editor.select(selected)
      selected.addClass('card')
      expect(selected.getClasses()).toContain('card')

      editor.runCommand('history:undo')
      expect(selected.getClasses()).not.toContain('card')
      expect(() => editor.runCommand('history:undo')).toThrow('Nothing to undo.')
    })

    it('redos an undone change and then rejects a further redo', () => {
      const selected = editor.getWrapper()!.append('<div></div>')[0]
      editor.select(selected)
      selected.addClass('card')
      editor.UndoManager.undo()
      expect(selected.getClasses()).not.toContain('card')

      editor.runCommand('history:redo')
      expect(selected.getClasses()).toContain('card')
      expect(() => editor.runCommand('history:redo')).toThrow('Nothing to redo.')
    })
  })
})
