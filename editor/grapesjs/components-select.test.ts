/*
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, it } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import coreCommands from './core-commands'

describe('components_select id round-trip', () => {
  let editor: Editor

  beforeEach(() => {
    /* @ts-ignore */
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
      plugins: [coreCommands],
    })
  })

  it('selects a component by getId() even when ccid has drifted', () => {
    const [added] = editor.getWrapper()!.append({
      tagName: 'section',
    }) as any[]
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

    const listed = editor.runCommand('components:list') as { id: string }[]
    expect(listed.some(item => item.id === 'hero')).toBe(true)
    expect(listed.some(item => item.id === 'stale-ccid')).toBe(false)
  })

  it('still selects a component that has no HTML id via getId()/ccid', () => {
    const [added] = editor.getWrapper()!.append({
      tagName: 'div',
    }) as any[]
    const id = added.getId()
    expect(id).toBeTruthy()
    editor.runCommand('components:select', { id })
    expect(editor.getSelected()).toBe(added)
  })
})
