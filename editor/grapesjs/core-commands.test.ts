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

import { beforeEach, describe, expect, it } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import coreCommands from './core-commands'

const BOX_BLOCK = 'test-box'

function initEditor(): Editor {
  /* @ts-ignore */
  const editor = grapesjs.init({
    headless: true,
    storageManager: { autoload: false },
    plugins: [coreCommands],
  })
  editor.BlockManager.add(BOX_BLOCK, {
    label: 'Box',
    content: { tagName: 'div', attributes: { class: 'test-box' } },
  })
  return editor
}

describe('blocks:add', () => {
  let editor: Editor

  beforeEach(() => {
    editor = initEditor()
  })

  it('selects the new element and inserts into the body when nothing is selected', () => {
    expect(editor.getSelected()).toBeFalsy()
    editor.runCommand('blocks:add', { blockId: BOX_BLOCK })
    const selected = editor.getSelected()
    expect(selected).toBeTruthy()
    expect(selected!.parent()).toBe(editor.getWrapper())
    expect(selected!.getClasses()).toContain('test-box')
  })

  it('rejects a parent that cannot have children (canMove reason)', () => {
    const [host] = editor.getWrapper()!.append({
      tagName: 'div',
      droppable: false,
    }) as any[]
    editor.select(host)
    expect(() => editor.runCommand('blocks:add', { blockId: BOX_BLOCK }))
      .toThrow(/canMove reason/)
    expect(editor.getSelected()).toBe(host)
  })
})

describe('components:move', () => {
  let editor: Editor

  beforeEach(() => {
    editor = initEditor()
  })

  it('keeps the component id and selects the moved element', () => {
    const wrapper = editor.getWrapper()!
    const [section] = wrapper.append({ tagName: 'section' }) as any[]
    const [child] = section.append({ tagName: 'div', attributes: { id: 'keep-me' } }) as any[]
    const id = child.getId()
    expect(id).toBe('keep-me')

    editor.runCommand('components:move', { id, targetId: wrapper.getId() })

    expect(child.getId()).toBe(id)
    expect(child.parent()).toBe(wrapper)
    expect(editor.getSelected()).toBe(child)
  })

  it('rejects moving an element into one of its descendants', () => {
    const [parent] = editor.getWrapper()!.append({ tagName: 'section' }) as any[]
    const [child] = parent.append({ tagName: 'div' }) as any[]
    expect(() => editor.runCommand('components:move', {
      id: parent.getId(),
      targetId: child.getId(),
    })).toThrow(/canMove reason/)
    expect(child.parent()).toBe(parent)
  })

  it('rejects a position that is not a number', () => {
    const wrapper = editor.getWrapper()!
    const [child] = wrapper.append({ tagName: 'div' }) as any[]
    expect(() => editor.runCommand('components:move', {
      id: child.getId(),
      targetId: wrapper.getId(),
      position: '1',
    })).toThrow(/position must be a number/)
  })
})

describe('core command capabilities', () => {
  it('says the new or moved element becomes the selection', () => {
    const editor = initEditor()
    const caps: Record<string, unknown>[] = []
    editor.trigger('ai-capabilities:ready', (def: Record<string, unknown>) => {
      caps.push(def)
    })
    const add = caps.find(c => c.id === 'blocks:add') as { description: string }
    const move = caps.find(c => c.id === 'components:move') as { description: string }
    expect(add.description).toMatch(/selection/)
    expect(move.description).toMatch(/keeping its id/)
  })
})
