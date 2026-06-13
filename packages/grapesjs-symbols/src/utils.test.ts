import { allowDrop, getSymbols, getSymbol, createSymbol, unbindSymbolInstance, deleteSymbol } from './utils'

describe('utils', () => {
  let editor: any
  let component: any
  let symbolComponent: any
  let instanceComponent: any

  beforeEach(() => {
    component = { parent: jest.fn(), getId: jest.fn(() => 'comp1'), remove: jest.fn() }
    symbolComponent = { ...component, getId: jest.fn(() => 'symbol1'), remove: jest.fn() }
    instanceComponent = { ...component, getId: jest.fn(() => 'instance1'), remove: jest.fn() }

    editor = {
      Components: {
        getSymbolInfo: jest.fn(),
        getSymbols: jest.fn(),
        addSymbol: jest.fn(),
        detachSymbol: jest.fn(),
        getSymbol: jest.fn(),
      }
    }
  })

  describe('allowDrop', () => {
    it('throws if no component', () => {
      expect(() => allowDrop(editor, null as any)).toThrow('No component provided')
    })

    it('returns false if component or parent is a symbol', () => {
      editor.Components.getSymbolInfo.mockImplementation((comp: any) => comp === component ? { isSymbol: true } : null)
      component.parent.mockReturnValue(undefined)
      expect(allowDrop(editor, component)).toBe(false)
    })

    it('returns false if parent is a symbol', () => {
      const parent = { parent: jest.fn(() => undefined) }
      editor.Components.getSymbolInfo.mockImplementation((comp: any) => comp === parent ? { isSymbol: true } : null)
      component.parent.mockReturnValue(parent)
      expect(allowDrop(editor, component)).toBe(false)
    })

    it('returns true if neither component nor parents are symbols', () => {
      editor.Components.getSymbolInfo.mockReturnValue(null)
      component.parent.mockReturnValue(undefined)
      expect(allowDrop(editor, component)).toBe(true)
    })
  })

  describe('getSymbols', () => {
    it('returns symbol infos', () => {
      const symbols = [{ id: 1 }, { id: 2 }]
      editor.Components.getSymbols.mockReturnValue(symbols)
      editor.Components.getSymbolInfo.mockImplementation((s: any) => ({ id: s.id, isSymbol: true }))
      expect(getSymbols(editor)).toEqual([
        { id: 1, isSymbol: true },
        { id: 2, isSymbol: true }
      ])
    })
  })

  describe('getSymbol', () => {
    it('returns symbol info if component is a symbol', () => {
      editor.Components.getSymbolInfo.mockReturnValue({ isSymbol: true, id: 'symbol1' })
      expect(getSymbol(editor, symbolComponent)).toEqual({ isSymbol: true, id: 'symbol1' })
    })

    it('returns null if not a symbol', () => {
      editor.Components.getSymbolInfo.mockReturnValue({ isSymbol: false })
      expect(getSymbol(editor, component)).toBeNull()
    })
  })

  describe('createSymbol', () => {
    it('throws if no component', () => {
      expect(() => createSymbol(editor, null as any)).toThrow()
    })

    it('returns symbol info if addSymbol succeeds', () => {
      editor.Components.addSymbol.mockReturnValue(symbolComponent)
      editor.Components.getSymbolInfo.mockReturnValue({ isSymbol: true, id: 'symbol1' })
      expect(createSymbol(editor, component)).toEqual({ isSymbol: true, id: 'symbol1' })
    })

    it('throws if addSymbol fails', () => {
      editor.Components.addSymbol.mockReturnValue(null)
      expect(() => createSymbol(editor, component)).toThrow()
    })
  })

  describe('unbindSymbolInstance', () => {
    it('detaches if component is instance', () => {
      editor.Components.getSymbolInfo.mockReturnValue({ isInstance: true })
      editor.Components.detachSymbol.mockImplementation(() => {})
      unbindSymbolInstance(editor, instanceComponent)
      expect(editor.Components.detachSymbol).toHaveBeenCalledWith(instanceComponent)
    })

    it('throws if not an instance', () => {
      editor.Components.getSymbolInfo.mockReturnValue({ isInstance: false })
      expect(() => unbindSymbolInstance(editor, component)).toThrow()
    })
  })

  describe('deleteSymbol', () => {
    it('removes symbol if info exists', () => {
      editor.Components.getSymbolInfo.mockReturnValue({ isSymbol: true })
      deleteSymbol(editor, symbolComponent)
      expect(symbolComponent.remove).toHaveBeenCalled()
    })

    it('throws if symbol info not found', () => {
      editor.Components.getSymbolInfo.mockReturnValue(null)
      expect(() => deleteSymbol(editor, symbolComponent)).toThrow()
    })
  })
})

