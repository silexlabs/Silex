import { jest } from '@jest/globals';
import Backbone from 'backbone'

import { getTestSymbols } from './test-utils';
import { addSymbol, removeSymbol, unlinkSymbolInstance, createSymbolInstance } from './SymbolsCommands.js'

let commands, editor

test('Command symbols:add', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection()
  const sender = {}, id = 'id', label = 'label', icon = 'icon', content = '<p>content</p>'
  expect(() => addSymbol(editor, sender, {id, label, icon})).toThrow('missing param content')
  expect(editor.Symbols).toHaveLength(0)
  expect(() => addSymbol(editor, sender, {content, label, icon})).not.toThrow()
  expect(editor.Symbols).toHaveLength(1)
})

test('Command symbols:remove', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection()
  const sender = {}, id = 'id'
  const getComponents = jest.fn(() => new Backbone.Collection([{ id }]))
  expect(() => removeSymbol(editor, sender, {}, getComponents)).toThrow('missing param id')
  expect(() => removeSymbol(editor, sender, {id}, getComponents)).toThrow('symbol not found')
  editor.Symbols.add({id})
  expect(() => removeSymbol(editor, sender, {id}, getComponents)).not.toThrow()
  expect(editor.Symbols).toHaveLength(0)
})

test('Command symbols:unlink', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection([s1, s2])
  const sender = {}, id = 'id'
  expect(() => unlinkSymbolInstance(editor, sender, {})).toThrow('missing param component')
  const component = new Backbone.Model({symbolId: 's1'})
  expect(() => unlinkSymbolInstance(editor, sender, {component})).not.toThrow()
  expect(component.get('symbolId')).toBeUndefined()
})

test('Command symbols:create', () => {
  const { s1, comp1, editor } = getTestSymbols()
  const sender = {},
    content = {components: ['<p>content</p>']},
    pos = {},
    target = { getAttribute: jest.fn((name) => comp1.getId()) }
  expect(() => createSymbolInstance(editor, sender, {})).toThrow('missing param symbol')
  expect(() => createSymbolInstance(editor, sender, {symbol: s1, pos, target})).not.toThrow()
  expect(createSymbolInstance(editor, sender, {symbol: s1, pos, target}).get('symbolId')).toBe('S1')
})

