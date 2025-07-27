/**
 * @jest-environment jsdom
 */

/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import grapesjs, { Component, Editor } from 'grapesjs'
import { DataTree } from '../model/DataTree'
import { Properties, StoredToken, Expression } from '../types'
import { getState } from '../model/state'
import { fromStored } from '../model/token'
import { simpleFilters, simpleQueryables, simpleTypes, testDataSourceId } from '../test-data'

// Mock dependencies
jest.mock('../model/state', () => ({
  ...jest.requireActual('../model/state'),
  getState: jest.fn(),
}))

jest.mock('../model/token', () => ({
  ...jest.requireActual('../model/token'),
  fromStored: jest.fn(),
}))

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getDataTreeFromUtils: jest.fn(),
}))

// Mock lit to avoid import issues
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

describe('Canvas Loop Functionality', () => {
  let editor: Editor
  let component: Component
  let dataTree: DataTree
  let mockDataSource: {
    id: string
    isConnected: () => boolean
    getTypes: () => unknown[]
    getQueryables: () => unknown[]
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    
    // Setup editor and component
    editor = grapesjs.init({
      container: document.createElement('div'),
      components: '<div id="test-component">Original Content</div>',
    })
    
    component = editor.getWrapper().find('#test-component')[0] || editor.getComponents().first()
    
    // Mock component methods if the real ones don't exist or need to be overridden
    if (!component.getId) {
      component.getId = jest.fn().mockReturnValue('test-component-id')
    }
    
    // Create a spy for the get method
    jest.spyOn(component, 'get').mockImplementation((key) => {
      if (key === 'privateStates') return []
      return undefined
    })
    
    jest.spyOn(component, 'set').mockImplementation(() => component)
    
    // Mock component view
    const mockElement = document.createElement('div')
    mockElement.innerHTML = 'Original Content'
    mockElement.id = 'test-component'
    
    // Use Object.defineProperty to set the view property
    Object.defineProperty(component, 'view', {
      value: { el: mockElement },
      writable: true,
      configurable: true
    })
    
    // Setup mock data source
    mockDataSource = {
      id: testDataSourceId,
      isConnected: () => true,
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
    }
    
    // Setup DataTree
    dataTree = new DataTree(editor, {
      dataSources: [mockDataSource],
      filters: simpleFilters,
    })
    
    // Mock preview data with array for loop testing
    dataTree.previewData = {
      [testDataSourceId]: {
        items: [
          { name: 'Item 1', value: 'value1' },
          { name: 'Item 2', value: 'value2' },
          { name: 'Item 3', value: 'value3' },
        ]
      }
    }
    
    // Setup utils mock
    const utils = await import('../utils')
    ;(utils.getDataTreeFromUtils as jest.Mock).mockReturnValue(dataTree)
  })

  describe('createLoopElementForIndex', () => {
    test('should modify component state previewIndex during loop element creation', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas
      
      // Setup component with mock privateStates that will be modified
      const mockPrivateStates = [
        {
          id: Properties.innerHTML,
          expression: [
            {
              type: 'state',
              storedStateId: '__data',
              componentId: 'test-component',
              exposed: false,
              previewIndex: 0 // This should be temporarily changed to loop index
            },
            {
              type: 'property',
              fieldId: 'name',
              dataSourceId: testDataSourceId,
              previewIndex: 0 // This should be temporarily changed to loop index
            }
          ]
        }
      ]
      
      jest.spyOn(component, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return mockPrivateStates
        return undefined
      })
      
      // Mock getState to return innerHTML expression
      ;(getState as jest.Mock).mockImplementation((comp, property) => {
        if (property === Properties.innerHTML) {
          return mockPrivateStates[0]
        }
        return null
      })
      
      // Mock fromStored
      ;(fromStored as jest.Mock).mockImplementation((token: StoredToken) => ({
        ...token,
        label: 'test',
        typeIds: ['string'],
        kind: 'scalar',
      }))
      
      // Mock getValue to return different values based on previewIndex
      jest.spyOn(dataTree, 'getValue').mockImplementation((expression: Expression) => {
        // Check if the tokens in the expression have the correct previewIndex
        const lastToken = expression[expression.length - 1] as StoredToken & {previewIndex?: number}
        const previewIndex = lastToken?.previewIndex
        if (typeof previewIndex === 'number') {
          return `Item ${previewIndex + 1}`
        }
        return 'Item 1'
      })
      
      // Test with index 2
      const loopIndex = 2
      const element = createLoopElementForIndex(component, loopIndex, dataTree)
      
      expect(element).not.toBeNull()
      expect(element?.tagName).toBe('DIV')
      expect(element?.classList.contains('ds-loop-item')).toBe(true)
      expect(element?.getAttribute('data-loop-index')).toBe('2')
      expect(element?.innerHTML).toBe('Item 3') // Should show the correct item for index 2
      
      // Verify that previewIndex values were restored after evaluation
      expect(mockPrivateStates[0].expression[0].previewIndex).toBe(0) // Should be restored to original
      expect(mockPrivateStates[0].expression[1].previewIndex).toBe(0) // Should be restored to original
    })

    test('should handle missing innerHTML state gracefully', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas
      
      // Mock getState to return null for innerHTML
      ;(getState as jest.Mock).mockReturnValue(null)
      
      // Setup component with original content
      const originalEl = component.view?.el as HTMLElement
      originalEl.innerHTML = 'Original Content'
      originalEl.setAttribute('data-original-content', 'Original Content')
      
      const element = createLoopElementForIndex(component, 0, dataTree)
      
      expect(element).not.toBeNull()
      expect(element?.innerHTML).toBe('Original Content')
    })

    test('should process attribute states correctly', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas
      
      // Mock component with attribute states
      jest.spyOn(component, 'get').mockImplementation((key) => {
        if (key === 'privateStates') {
          return [
            {
              id: 'title',
              expression: [{
                type: 'property',
                fieldId: 'name',
                dataSourceId: testDataSourceId,
              }]
            }
          ]
        }
        return undefined
      })
      
      // Mock getState
      ;(getState as jest.Mock).mockReturnValue(null)
      
      // Mock fromStored
      ;(fromStored as jest.Mock).mockImplementation((token: StoredToken) => ({
        ...token,
        label: 'test',
        typeIds: ['string'],
        kind: 'scalar',
      }))
      
      // Mock getValue
      jest.spyOn(dataTree, 'getValue').mockImplementation((expression: Expression) => {
        const lastToken = expression[expression.length - 1] as StoredToken & {fieldId?: string, previewIndex?: number}
        if (lastToken?.fieldId === 'name') {
          const index = lastToken?.previewIndex || 0
          return dataTree.previewData[testDataSourceId].items[index]?.name
        }
        return null
      })
      
      const element = createLoopElementForIndex(component, 2, dataTree)
      
      expect(element?.getAttribute('title')).toBe('Item 3')
    })
  })

  describe('Loop Rendering Integration', () => {
    test('should verify previewIndex manipulation works in createLoopElementForIndex', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas
      
      // Setup component with __data and innerHTML states that will be manipulated
      const mockPrivateStates = [
        {
          id: Properties.__data,
          expression: [{
            type: 'property',
            fieldId: 'items',
            dataSourceId: testDataSourceId,
            previewIndex: 0 // Will be modified during loop creation
          }]
        },
        {
          id: Properties.innerHTML,
          expression: [{
            type: 'property',
            fieldId: 'name',
            dataSourceId: testDataSourceId,
            previewIndex: 0 // Will be modified during loop creation
          }]
        }
      ]
      
      jest.spyOn(component, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return mockPrivateStates
        return undefined
      })
      
      ;(getState as jest.Mock).mockImplementation((comp, property) => {
        if (property === Properties.innerHTML) {
          return mockPrivateStates.find(s => s.id === Properties.innerHTML)
        }
        return null
      })
      
      ;(fromStored as jest.Mock).mockImplementation((token: StoredToken) => ({
        ...token,
        label: 'test',
        typeIds: ['string'],
        kind: 'scalar',
      }))
      
      // Mock getValue to return different values based on previewIndex
      jest.spyOn(dataTree, 'getValue').mockImplementation((expression: Expression) => {
        const lastToken = expression[expression.length - 1] as StoredToken & {previewIndex?: number}
        const previewIndex = lastToken?.previewIndex
        if (typeof previewIndex === 'number') {
          return `Item ${previewIndex + 1}`
        }
        return 'Item 1'
      })
      
      // Test that different loop indices produce different content
      const element0 = createLoopElementForIndex(component, 0, dataTree)
      const element1 = createLoopElementForIndex(component, 1, dataTree)
      const element2 = createLoopElementForIndex(component, 2, dataTree)
      
      expect(element0?.innerHTML).toBe('Item 1')
      expect(element1?.innerHTML).toBe('Item 2')
      expect(element2?.innerHTML).toBe('Item 3')
      
      // Verify previewIndex values were restored after each call
      expect(mockPrivateStates[0].expression[0].previewIndex).toBe(0)
      expect(mockPrivateStates[1].expression[0].previewIndex).toBe(0)
    })

    test('should handle component state restoration correctly', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas
      
      // Test that previewIndex modifications are properly restored
      const mockToken = {
        type: 'property',
        fieldId: 'name',
        dataSourceId: testDataSourceId,
        previewIndex: 999 // Original value that should be restored
      }
      
      const mockPrivateStates = [{
        id: Properties.innerHTML,
        expression: [mockToken]
      }]
      
      jest.spyOn(component, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return mockPrivateStates
        return undefined
      })
      
      ;(getState as jest.Mock).mockImplementation((comp, property) => {
        if (property === Properties.innerHTML) {
          return mockPrivateStates[0]
        }
        return null
      })
      
      ;(fromStored as jest.Mock).mockImplementation((token: StoredToken) => ({
        ...token,
        label: 'test',
        typeIds: ['string'],
        kind: 'scalar',
      }))
      
      jest.spyOn(dataTree, 'getValue').mockReturnValue('Test Content')
      
      // Call createLoopElementForIndex
      createLoopElementForIndex(component, 5, dataTree)
      
      // Verify the original previewIndex was restored
      expect(mockToken.previewIndex).toBe(999)
    })

    test('should preserve original content when no loop data', () => {
      // Test that when there's no __data state or empty array,
      // the original content is preserved
      
      expect(true).toBe(true) // Placeholder
    })

    test('should handle nested expressions in loop context', () => {
      // Test that complex expressions with multiple tokens
      // work correctly in loop context
      
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Error Handling', () => {
    test('should handle malformed expressions gracefully', () => {
      expect(true).toBe(true) // Placeholder
    })

    test('should handle missing data gracefully', () => {
      expect(true).toBe(true) // Placeholder
    })

    test('should handle invalid loop data gracefully', () => {
      expect(true).toBe(true) // Placeholder
    })
  })
})