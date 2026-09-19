import { jest } from '@jest/globals'
import {
  _addSymbol,
  _removeSymbol,
  _unlinkSymbolInstance,
  _createSymbolInstance,
  _createSymbolInstanceFromId,
  listSymbols,
  displayError
} from './SymbolsCommands'

jest.mock('./utils', () => ({
  allowDrop: jest.fn(() => true),
  createSymbol: jest.fn((_, comp) => ({ instances: [comp, { id: 'inst2' }] })),
  deleteSymbol: jest.fn(),
  unbindSymbolInstance: jest.fn()
}))
jest.mock('lit-html', () => ({
  html: (...args: any[]) => args,
  render: jest.fn(),
}))
jest.mock('lit-html/directives/unsafe-html.js', () => ({
  unsafeHTML: (x: any) => x,
}))

describe('SymbolsCommands', () => {
  let editor: any
  let component: any
  let symbol: any

  beforeEach(() => {
    component = {
      setName: jest.fn(),
      set: jest.fn(),
      getName: jest.fn(() => 'compName'),
      getId: jest.fn(() => 'compId'),
      append: jest.fn((inst, _) => [inst]),
    }
    symbol = {
      getId: jest.fn(() => 'symbolId'),
      append: jest.fn((inst, _) => [inst]),
    }
    editor = {
      getSelected: jest.fn(() => component),
      getWrapper: jest.fn(() => component),
      Components: {
        getSymbols: jest.fn(() => [symbol]),
        getSymbolInfo: jest.fn(() => ({
          main: { getName: () => 'Header' },
          instances: [{}, {}],
        })),
        allById: jest.fn(() => ({ parentId: symbol })),
        canMove: jest.fn(() => ({ result: true, reason: 0 })),
      },
      Modal: {
        open: jest.fn(),
        close: jest.fn(),
      },
      select: jest.fn(),
    }
  })

  describe('_addSymbol', () => {
    it('creates a symbol with label and icon', () => {
      const result = _addSymbol(editor, null, { component, label: 'lbl', icon: 'ico' })
      expect(component.setName).toHaveBeenCalledWith('lbl')
      expect(component.set).toHaveBeenCalledWith('icon', 'ico')
      expect(result).toEqual({ instances: [component, { id: 'inst2' }] })
    })

    it('uses selected component if no component provided', () => {
      editor.getSelected.mockReturnValue(component)
      const result = _addSymbol(editor, null, { label: 'lbl', icon: 'ico' })
      expect(component.setName).toHaveBeenCalledWith('lbl')
      expect(component.set).toHaveBeenCalledWith('icon', 'ico')
      expect(result).toEqual({ instances: [component, { id: 'inst2' }] })
    })

    it('usees selected component and its name if no label provided', () => {
      editor.getSelected.mockReturnValue(component)
      const result = _addSymbol(editor, null, {})
      expect(component.setName).toHaveBeenCalledWith('compName')
      expect(result).toEqual({ instances: [component, { id: 'inst2' }] })
    })

    it('throws if missing component', () => {
      editor.getSelected.mockReturnValue(null)
      expect(() => _addSymbol(editor, null, { component: undefined })).toThrow()
    })
  })

  describe('_removeSymbol', () => {
    it('removes symbol by id', async () => {
      symbol.getId.mockReturnValue('symbolId')
      expect(() => _removeSymbol(editor, null, { symbolId: 'symbolId' })).not.toThrow()
      // deleteSymbol is called by the command
      const { deleteSymbol } = await import('./utils')
      expect(deleteSymbol).toHaveBeenCalledWith(editor, symbol)
    })

    it('throws if missing symbolId', () => {
      expect(() => _removeSymbol(editor, null, { symbolId: '' })).toThrow()
    })

    it('throws if symbol not found', () => {
      editor.Components.getSymbols.mockReturnValue([])
      expect(() => _removeSymbol(editor, null, { symbolId: 'notfound' })).toThrow()
    })
  })

  describe('_unlinkSymbolInstance', () => {
    it('calls unbindSymbolInstance', async () => {
      const { unbindSymbolInstance } = await import('./utils')
      expect(() => _unlinkSymbolInstance(editor, null, { component })).not.toThrow()
      expect(unbindSymbolInstance).toHaveBeenCalledWith(editor, component)
    })

    it('uses the selected component when no component is provided', async () => {
      const { unbindSymbolInstance } = await import('./utils')
      expect(() => _unlinkSymbolInstance(editor, null, {})).not.toThrow()
      expect(editor.getSelected).toHaveBeenCalled()
      expect(unbindSymbolInstance).toHaveBeenCalledWith(editor, component)
    })

    it('throws if no component is selected', () => {
      editor.getSelected.mockReturnValue(null)
      expect(() => _unlinkSymbolInstance(editor, null, {})).toThrow('missing param component')
    })
  })

  describe('_createSymbolInstance', () => {
    beforeEach(() => {
      // allowDrop returns true by default
      editor.Components.allById.mockReturnValue({ parentId: symbol })
    })

    it('creates a symbol instance and appends it', () => {
      const pos = { placement: 'after', index: 0 }
      const result = _createSymbolInstance(editor, null, { symbol, pos, target: symbol })
      expect(result).toEqual({ id: 'inst2' })
    })

    it('throws if missing params', () => {
      expect(() => _createSymbolInstance(editor, null, { symbol: null as any, pos: {}, target: symbol })).toThrow()
      expect(() => _createSymbolInstance(editor, null, { symbol, pos: null, target: symbol })).toThrow()
      expect(() => _createSymbolInstance(editor, null, { symbol, pos: {}, target: null as any })).toThrow()
    })

    it('throws if parent not found', () => {
      editor.Components.allById.mockReturnValue({})
      expect(() => _createSymbolInstance(editor, null, { symbol, pos: {}, target: { getAttribute: () => 'parentId' } as any as HTMLElement })).toThrow()
    })
  })

  describe('listSymbols', () => {
    it('returns id, name, and instance count instead of full components', () => {
      expect(listSymbols(editor)).toEqual([
        { id: 'symbolId', name: 'Header', instances: 2 },
      ])
    })
  })

  describe('_createSymbolInstanceFromId', () => {
    it('adds the instance under the selection and selects it', async () => {
      const instance = { getId: jest.fn(() => 'new-inst') }
      const { createSymbol } = await import('./utils')
      ;(createSymbol as jest.Mock).mockReturnValue({ instances: [symbol, instance] })
      component.append.mockReturnValue([instance])

      const result = _createSymbolInstanceFromId(editor, null, { symbolId: 'symbolId' })
      expect(result).toEqual({ id: 'new-inst' })
      expect(editor.select).toHaveBeenCalledWith(instance)
      expect(component.append).toHaveBeenCalled()
    })

    it('throws if missing symbolId', () => {
      expect(() => _createSymbolInstanceFromId(editor, null, {})).toThrow(/symbolId/)
    })

    it('throws if symbol is not found', () => {
      editor.Components.getSymbols.mockReturnValue([])
      expect(() => _createSymbolInstanceFromId(editor, null, { symbolId: 'missing' })).toThrow(/not found/)
    })

    it('throws canMove reason when the parent cannot receive the instance', () => {
      editor.Components.canMove.mockReturnValue({ result: false, reason: 2 })
      expect(() => _createSymbolInstanceFromId(editor, null, { symbolId: 'symbolId' }))
        .toThrow(/canMove reason 2/)
    })
  })

  describe('displayError', () => {
    it('opens modal with error', () => {
      const content = document.createElement('div')
      document.body.appendChild(content)
      displayError(editor, 'Title', 'Message')
      expect(editor.Modal.open).toHaveBeenCalled()
    })
  })
})
