import Backbone from 'backbone'

import { jest } from '@jest/globals'

import { addSymbol } from './SymbolsCommands.js'
import {
  createSymbolInstance,
  removeSymbol,
  unlinkSymbolInstance
} from './SymbolsCommands'
import { getTestSymbols } from './test-utils'

let commands, editor

test('Command symbols:add', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection()
  const sender = {}, label = 'label', icon = 'icon'
  expect(() => addSymbol(editor, sender, {label, icon})).toThrow('missing param component')
  expect(editor.Symbols).toHaveLength(0)
  const [component] = editor.addComponents([{}])
  expect(() => addSymbol(editor, sender, {label, icon, component})).not.toThrow()
  expect(editor.Symbols).toHaveLength(1)
})

test('Command symbols:remove', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection()
  const sender = {}, symbolId = 'symbolId'
  expect(() => removeSymbol(editor, sender, {})).toThrow('missing param symbolId')
  expect(() => removeSymbol(editor, sender, {symbolId})).toThrow('symbol not found')
  editor.Symbols = new Backbone.Collection([s1, s2])
  expect(editor.Symbols).toHaveLength(2)
  expect(() => removeSymbol(editor, sender, {symbolId: s1.get('symbolId')})).not.toThrow()
  expect(editor.Symbols).toHaveLength(1)
})

test('Command symbols:unlink', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection([s1, s2])
  const sender = {}, symbolId = 'symbolId'
  expect(() => unlinkSymbolInstance(editor, sender, {})).toThrow('missing param component')
  const component = new Backbone.Model({symbolId: 's1'})
  expect(() => unlinkSymbolInstance(editor, sender, {component})).not.toThrow()
  expect(component.get('symbolId')).toBeUndefined()
})

test('Command symbols:create', () => {
  const { s1, comp1, editor } = getTestSymbols()
  const sender = {},
    component = comp1,
    pos = {},
    target = { getAttribute: jest.fn((name) => comp1.getId()) }
  expect(() => createSymbolInstance(editor, sender, {})).toThrow('missing param symbol')
  expect(() => createSymbolInstance(editor, sender, {symbol: s1, pos, target})).not.toThrow()
  expect(createSymbolInstance(editor, sender, {symbol: s1, pos, target}).get('symbolId')).toBe('S1')
})
