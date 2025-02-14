import { expect, test } from '@jest/globals'
import Backbone from 'backbone'
import { getTestSymbols } from '../test-utils'
import { Symbols } from './Symbols'
import { jest } from '@jest/globals'

const UndoManager = {
  add: jest.fn(),
}
describe('Make sure everything has the correct data type and default values', () => {
  // mock editor
  let editor: any, options: any
  beforeEach(() => {
    editor = {
      UndoManager,
    }
    options =  {
      headless: true,
    }
  })

  test('Initialize symbols with test data', () => {
    const { s1, s1Data, comp1 } = getTestSymbols()
    const symbols = new Symbols([s1], { options, editor })
    expect(symbols).toHaveLength(1)
    expect(comp1.get('symbolId')).toBe(s1.id)
    expect(symbols.get(s1.cid)).not.toBeUndefined()
    expect(symbols.get(s1.cid).get('label')).toBe(s1Data.label)
    expect(symbols.get(s1.cid).get('instances')).not.toBeUndefined()
    expect(symbols.get(s1.cid).get('instances') instanceof Map).toBe(true)
  })

  test('Initialize symbols with default values', () => {
    const { s1, s2 } = getTestSymbols()
    const symbols = new Symbols([s1, s2], { options, editor})
    expect(symbols).toHaveLength(2)
    expect(symbols.get(s2.cid)).not.toBeUndefined()
    expect(symbols.get(s2.cid).get('label')).not.toBeUndefined()
    expect(symbols.get(s2.cid).get('instances')).not.toBeUndefined()
    expect(symbols.get(s2.cid).get('instances') instanceof Map).toBe(true)
  })
})

describe('Test event listeners which maintain the components list up to date', () => {
  let s1: any, s2
  let editor: any, options
  beforeEach(() => {
    // mock editor
    editor = {
      UndoManager,
    }
    options =  {
      headless: true,
    }
    const symbols = getTestSymbols()
    s1 = symbols.s1
    s2 = symbols.s2
    editor.Symbols = new Symbols([s1, s2], { options, editor})
  })

  test('onAdd method', () => {
    const comp = new Backbone.Model({
      tagName: 'div',
      content: 'comp S1',
      symbolId: s1.cid,
    })

    const components = s1.attributes.instances
    expect(components.size).toBe(2)
    editor.Symbols.onAdd(comp)
    const added = components.get(comp.cid)
    expect(added).toBe(comp)
    expect(components.size).toBe(3)
  })
})

