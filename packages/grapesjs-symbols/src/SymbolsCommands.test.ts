import Backbone from 'backbone'

import { jest } from '@jest/globals'

// Mock module lit-html
// This is needed because lit-html fails to load in jest (Must use import to load ES Module: node_modules/lit-html/lit-html.js)
jest.mock('lit-html', () => {
  const render = jest.fn()
  const html = jest.fn()
  return { render, html }
})

import { addSymbol } from './SymbolsCommands'
import {
  createSymbolInstance,
  removeSymbol,
  unlinkSymbolInstance
} from './SymbolsCommands'
import { getTestSymbols } from './test-utils'
import { Symbols } from './model/Symbols'

test('Command symbols:add', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection() as Symbols
  const sender = {}, label = 'label', icon = 'icon'
  expect(() => addSymbol(editor, sender, {label, icon, component: undefined})).toThrow('missing param component')
  expect(editor.Symbols).toHaveLength(0)
  const [component] = editor.addComponents([{
    tagName: 'div',
    components: [
      {
        tagName: 'h1',
        content: 'Content text',
        style: { color: 'red'},
        attributes: { title: 'here' }
      },{
        tagName: 'p',
        content: 'Content text',
        style: { color: 'red'},
        attributes: { title: 'here' }
      },
    ],
    style: { "background-color": 'blue', "padding": "20px"},
  }])
  expect(() => addSymbol(editor, sender, {label, icon, component})).not.toThrow()
  expect(editor.Symbols).toHaveLength(1)
  const model = editor.Symbols.models[0].get('model')
  expect(model.attributes.symbolId).not.toBeUndefined()
  expect(model.components().models[0].attributes.symbolChildId).not.toBeUndefined()
  expect(component.attributes.symbolId).not.toBeUndefined()
  expect(component.components().models[0].attributes.symbolChildId).not.toBeUndefined()
})

test('Command symbols:remove', () => {
  const { editor, s1, s2 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection() as Symbols
  const sender = {}, symbolId = 'symbolId'
  expect(() => removeSymbol(editor, sender, {} as any)).toThrow('missing param symbolId')
  expect(() => removeSymbol(editor, sender, {symbolId})).toThrow('symbol not found')
  editor.Symbols = new Backbone.Collection([s1, s2]) as Symbols
  expect(editor.Symbols).toHaveLength(2)
  expect(() => removeSymbol(editor, sender, {symbolId: s1.id as string})).not.toThrow()
  expect(editor.Symbols).toHaveLength(1)
})

test('Command symbols:unlink', () => {
  const { editor, s1, s2, comp1 } = getTestSymbols()
  editor.Symbols = new Backbone.Collection([s1, s2]) as Symbols
  const sender = {}, symbolId = 'symbolId'
  expect(() => unlinkSymbolInstance(editor, sender, {} as any)).toThrow('missing param component')
  const component = comp1.clone()
  expect(() => unlinkSymbolInstance(editor, sender, {component})).not.toThrow()
  expect(component.get('symbolId')).toBeUndefined()
})

test('Command symbols:create', () => {
  const { s1, comp1, s2, editor } = getTestSymbols()
  const sender = {},
    component = comp1,
    pos = {},
    target = { getAttribute: jest.fn((name) => comp1.getId()) } as any as HTMLElement
  expect(() => createSymbolInstance(editor, sender, {} as any)).toThrow('missing param symbol')
  expect(() => createSymbolInstance(editor, sender, {symbol: s1, pos, target})).not.toThrow()
  // Add a symbol to the target
  expect(createSymbolInstance(editor, sender, {symbol: s2, pos, target})?.get('symbolId')).toBe(s2.id)
  // Try to add a symbol to a target that already has the symbol (S1)
  expect(createSymbolInstance(editor, sender, {symbol: s1, pos, target})?.get('symbolId')).toBeUndefined()
  expect(component.attributes.symbolId).not.toBeUndefined()
})
