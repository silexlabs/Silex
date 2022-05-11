import { initSymbolManager } from './symbol.js';

let editor
function reset() {
  editor = {
    Pages: {
      getAll: () => [{
        getMainComponent: () => ({
          onAll: cbk => [{
            symbolId: 'S1',
            symbolIcon: 'fa-cog',
            symbolLabel: 'S1',
          }, {
            symbolId: 'S1',
          }, {
            symbolId: 'S2',
            symbolIcon: 'fa-cog',
            symbolLabel: 'S2',
          }, {
            symbolId: 'S2',
          }, {}, {}].forEach(c => cbk(c))
        })
      }]
    },
    on: (names, cbk) => {}
  }
}

describe('Initialization', () => {
  beforeEach(() => reset())
  test('Create symbol manager', () => {
    expect(() => initSymbolManager(editor, {})).not.toThrow()
    expect(editor.Symbols).not.toBeUndefined()
    expect(() => initSymbolManager(editor, {})).toThrow()
  })
})

describe('Test editor.Symbols methods', () => {
  beforeEach(() => {
    reset()
    initSymbolManager(editor, {})
  })
  test('Get symbols', () => {
    expect(editor.Symbols.getAll()).toHaveLength(4)
  })
})
