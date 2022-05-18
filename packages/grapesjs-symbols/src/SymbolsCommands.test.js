import { jest } from '@jest/globals';
import Backbone from 'backbone'

import { addSymbol, removeSymbol, unlinkSymbolInstance, createSymbolInstance } from './SymbolsCommands.js'

let commands, editor

beforeEach(() => {
  editor = {
    Symbols: new Backbone.Collection(),
    runCommand: jest.fn(),
    addComponents: jest.fn(([attr]) => [new Backbone.Model(attr)]),
  }
})

test('Command symbols:add', () => {
  const sender = {}, id = 'id', label = 'label', icon = 'icon', content = '<p>content</p>'
  expect(() => addSymbol(editor, sender, {id, label, icon})).toThrow('missing param content')
  expect(editor.Symbols).toHaveLength(0)
  expect(() => addSymbol(editor, sender, {content, label, icon})).not.toThrow()
  expect(editor.Symbols).toHaveLength(1)
})

test('Command symbols:remove', () => {
  const sender = {}, id = 'id'
  const getComponents = jest.fn(() => new Backbone.Collection([{ id }]))
  expect(() => removeSymbol(editor, sender, {}, getComponents)).toThrow('missing param id')
  expect(() => removeSymbol(editor, sender, {id}, getComponents)).toThrow('symbol not found')
  editor.Symbols.add({id})
  expect(() => removeSymbol(editor, sender, {id}, getComponents)).not.toThrow()
  expect(editor.Symbols).toHaveLength(0)
})

test('Command symbols:unlink', () => {
  const sender = {}, id = 'id'
  expect(() => unlinkSymbolInstance(editor, sender, {})).toThrow('missing param component')
  const component = new Backbone.Model({symbolId: 's1'})
  expect(() => unlinkSymbolInstance(editor, sender, {component})).not.toThrow()
  expect(component.get('symbolId')).toBeUndefined()
})

test('Command symbols:create', () => {
  const sender = {}, id = 's1', content = {components: ['<p>content</p>']}
  expect(() => createSymbolInstance(editor, sender, {})).toThrow('missing param symbol')
  const symbol = new Backbone.Model({id, content})
  expect(() => createSymbolInstance(editor, sender, {symbol})).not.toThrow()
  expect(editor.addComponents).toHaveBeenCalledTimes(1)
  expect(createSymbolInstance(editor, sender, {symbol}).get('symbolId')).toBe(id)
})

