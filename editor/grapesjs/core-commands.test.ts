/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

/*
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals'
import grapesjs from 'grapesjs'
import coreCommands from './core-commands'
import agentIds from './agent-ids'
import aiCapabilities, { clearCapabilities, getTools } from '@silexlabs/grapesjs-ai-capabilities'

const open = (components: string) => grapesjs.init({
  headless: true,
  storageManager: { autoload: false },
  plugins: [coreCommands, agentIds],
  components,
})
const idOf = (editor, component) => editor.runCommand('agent-ids:get', { component })

describe('element tool', () => {
  it('lists the structure an agent searches: tags, classes and attributes, long values cut, unused ids hidden', () => {
    const editor = open(`<form class="contact"><input type="checkbox" id="news" class="contact__check"><label for="news">News</label>
        <img id="i3k9" src="data:image/png;base64,${'A'.repeat(500)}"></form>`)
    const lines = (editor.runCommand('element:list') as string).split('\n').map(line => line.replace(/^(\s*)\S+ /, '$1'))
    expect(lines).toEqual([
      '<body>',
      '  <form class="contact">',
      '    <input class="contact__check" type="checkbox" id="news">',
      '    <label for="news">',
      '    <img src="data:image/png;base64,…">',
    ])
  })

  it('changes an image, its attributes and classes, or nothing when a class is missing', () => {
    const editor = open('<img class="photo" alt="old" title="t">')
    const [img] = editor.getWrapper()!.components().models
    const element_id = idOf(editor, img)
    editor.runCommand('element:update', { element_id, attributes: { src: '/assets/car.png', alt: 'A red car', title: null } })
    expect(img.toHTML()).toContain('src="/assets/car.png"')
    expect(img.getAttributes()).toMatchObject({ alt: 'A red car' })
    expect(img.getAttributes().title).toBeUndefined()
    expect(() => editor.runCommand('element:update', { element_id, remove_class: 'photo missing', add_class: 'big' })).toThrow(/missing/)
    expect(img.getClasses()).toEqual(['photo'])
  })

  it('selects one created element, and refuses HTML where it can not go', () => {
    const editor = open('<section class="s"></section><img class="photo">')
    const [section, img] = editor.getWrapper()!.components().models
    const answer = editor.runCommand('element:insert', { html: '<h2>Title</h2>', target_id: idOf(editor, section) })
    expect(editor.getSelected()?.get('tagName')).toBe('h2')
    expect(answer.parent_id).toBe(idOf(editor, section))
    expect(() => editor.runCommand('element:insert', { html: '<p>x</p>', target_id: idOf(editor, img) })).toThrow(/can not contain/)
  })

  it('refuses to guess the element when several are selected', () => {
    const editor = open('<p class="a">a</p><p class="b">b</p>')
    editor.select(editor.getWrapper()!.components().models)
    expect(() => editor.runCommand('element:remove', {})).toThrow(/Several elements/)
    expect(editor.getWrapper()!.components().length).toBe(2)
  })
})

describe('breakpoint tool', () => {
  const breakpoint = (config: Record<string, unknown>) => {
    clearCapabilities()
    const editor = grapesjs.init({ headless: true, storageManager: { autoload: false }, plugins: [aiCapabilities, coreCommands, agentIds], ...config })
    editor.trigger('load')
    return getTools().find(tool => tool.name === 'breakpoint')!
  }

  it('describes the devices of the site', () => {
    const desktopFirst = breakpoint({ deviceManager: { devices: [{ id: 'big', name: 'Big' }, { id: 'small', name: 'Small', width: '320px', widthMedia: '600px' }] } })
    expect(desktopFirst.description).toBe('Breakpoints for responsive design, desktop-first: Big (all sizes), Small (up to 600px). Styles written for Big apply everywhere; another breakpoint only overrides them below its width. Select it only for responsive changes, then select Big again.')
    expect(desktopFirst.inputSchema.properties.name.enum).toEqual(['Big', 'Small'])
  })
})

