import Backbone from 'backbone'
import Symbol from './Symbol.js'

const comp1 = {
  tagName: 'div',
  content: 'comp1 S1',
  symbolId: 'S1',
}

const comp2 = {
  tagName: 'div',
  content: 'comp2 S1',
  symbolId: 'S1',
}

const s1 = {
  id: 'S1',
  icon: 'fa-cog',
  label: 'S1',
  components: [comp1, comp2],
}

const s2 = {}

test('Initialize symbol with values', () => {
  const symbol = new Symbol(s1, { options: {}})
  expect(symbol.get('id')).not.toBeUndefined()
  expect(symbol.get('id')).toBe(s1.id)
  expect(symbol.get('components')).not.toBeUndefined()
  expect(symbol.get('components') instanceof Backbone.Collection).toBe(true)
  expect(symbol.get('components')).toHaveLength(2)
  expect(symbol.get('label')).not.toBeUndefined()
  expect(symbol.get('icon')).not.toBeUndefined()
})

test('Initialize symbol with default values', () => {
  const symbol = new Symbol(s2, { options: {}})
  expect(symbol.get('id')).not.toBeUndefined()
  expect(symbol.get('id')).toBe(symbol.cid)
  expect(symbol.get('components')).not.toBeUndefined()
  expect(symbol.get('components') instanceof Backbone.Collection).toBe(true)
  expect(symbol.get('components')).toHaveLength(0)
  expect(symbol.get('label')).not.toBeUndefined()
  expect(symbol.get('icon')).not.toBeUndefined()
})

test('Test data to save has only needed data', () => {
  const s = { ...s1 }
  delete s.components
  const symbol = new Symbol(s1, { options: {}})
  expect(symbol.toJSON()).toEqual(s)
})

test('Test getComponents method', () => {
  const symbol = new Symbol(s1, { options: {}})
  expect(() => symbol.getComponents()).not.toThrow()
  expect(symbol.getComponents() instanceof Backbone.Collection).toBe(true)
  expect(symbol.getComponents()).toHaveLength(2)
})

test('Test update method', () => {
  const symbol = new Symbol(s1, { options: {}})
  const component = symbol.getComponents().models[0]
  expect(component).not.toBeUndefined()
  expect(() => symbol.update(component)).not.toThrow()
})

