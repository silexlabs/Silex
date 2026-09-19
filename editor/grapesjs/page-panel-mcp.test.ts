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

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { cmdAddPage, pagePanelPlugin } from './page-panel'

describe('pages:add MCP path', () => {
  let editor: Editor
  let dialog: ReturnType<typeof jest.fn>

  beforeEach(() => {
    document.body.innerHTML = '<div id="pages-root"></div>'
    dialog = jest.fn()
    /* @ts-ignore */
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
      plugins: [
        (ed: Editor) => {
          ed.Commands.add('new-page-dialog', dialog as any)
          pagePanelPlugin(ed, {
            appendTo: '#pages-root',
            newPageName: 'New page',
            cmdOpenNewPageDialog: 'new-page-dialog',
          })
        },
      ],
    })
    editor.trigger('load')
  })

  it('creates a page by name without opening the dialog and selects it', () => {
    const result = editor.runCommand(cmdAddPage, { name: 'About' }) as { id: string, name: string }
    expect(dialog).not.toHaveBeenCalled()
    expect(result.name).toBe('About')
    expect(editor.Pages.getSelected()?.getName()).toBe('About')
    expect(editor.Pages.getSelected()?.id).toBe(result.id)
  })

  it('keeps the new-page dialog for the editor button (no name)', () => {
    editor.runCommand(cmdAddPage)
    expect(dialog).toHaveBeenCalled()
    expect(editor.Pages.getSelected()?.getName()).toMatch(/New page/)
  })

  it('rejects an empty name from MCP', () => {
    expect(() => editor.runCommand(cmdAddPage, { name: '   ' })).toThrow(/Required: name/)
    expect(dialog).not.toHaveBeenCalled()
  })

  it('registers an inputSchema that requires name and says the page is selected', () => {
    const caps: Record<string, unknown>[] = []
    editor.trigger('ai-capabilities:ready', (def: Record<string, unknown>) => {
      caps.push(def)
    })
    const add = caps.find(c => c.id === cmdAddPage) as {
      description: string
      inputSchema: { required?: string[], properties?: Record<string, unknown> }
    }
    expect(add).toBeTruthy()
    expect(add.description).toMatch(/selected/)
    expect(add.inputSchema.required).toContain('name')
    expect(add.inputSchema.properties).toHaveProperty('name')
  })
})
