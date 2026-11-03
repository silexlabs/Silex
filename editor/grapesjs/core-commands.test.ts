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
import agentIds from '@silexlabs/grapesjs-ai-capabilities'

const open = (components: string) => grapesjs.init({
  headless: true,
  storageManager: { autoload: false },
  plugins: [coreCommands, agentIds],
  components,
})

describe('element tool', () => {
  it('refuses to guess the element when several are selected', () => {
    const editor = open('<p class="a">a</p><p class="b">b</p>')
    editor.select(editor.getWrapper()!.components().models)
    expect(() => editor.runCommand('element:remove', {})).toThrow(/Several elements/)
    expect(editor.getWrapper()!.components().length).toBe(2)
  })
})

