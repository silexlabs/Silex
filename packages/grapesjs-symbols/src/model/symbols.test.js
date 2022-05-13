import Backbone from 'backbone'
import Symbols from './Symbols';

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
const comp3 = {
  tagName: 'div',
  content: 'comp3 S2',
  symbolId: 'S2',
}

const comp4 = {
  tagName: 'div',
  content: 'comp4 S2',
  symbolId: 'S2',
}

const comp5 = {
  tagName: 'div',
  content: 'comp5',
}

const s1 = {
  id: 'S1',
  icon: 'fa-cog',
  label: 'S1',
  components: [comp1, comp2],
}

const s2 = {
  id: 'S2',
  icon: 'fa-list',
  label: 'S2',
  components: [comp3, comp4],
}

describe('Test Symbols methods', () => {
  test('Initialize symbols with test data', () => {
    const symbols = new Symbols([s1], { options: {}, editor: { on: () => {}}})
    expect(symbols).toHaveLength(1)
    expect(symbols.get(s1.id).get('label')).toBe(s1.label)

    symbols.add(s2)
    expect(symbols).toHaveLength(2)
    expect(symbols.get(s2.id).get('label')).toBe(s2.label)
  })
  test('Add an instance of a symbol', () => {
    const symbols = new Symbols([s1, s2], { options: {}, editor: { on: () => {}}})
    const symbol = symbols.get(s1.id)
    symbol.get('components').add(comp5)
    expect(symbol.get('components')).toHaveLength(3)
  })
  test('Get data to save', () => {
    const symbols = new Symbols([s1, s2], { options: {}, editor: { on: () => {}}})
    expect(symbols.toJSON()).toEqual([s1, s2].map(s => {
      delete s.components
      return s
    }))
  })
})

