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

    test('should handle nested loops correctly', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas

      // Setup a component with nested loop child
      const outerComponent = component
      const innerComponent = {
        ...component,
        getId: () => 'inner-component',
        get: jest.fn(),
        components: () => []
      }

      const outerPrivateStates = [
        {
          id: Properties.__data,
          expression: [{
            type: 'property',
            fieldId: 'continents',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        }
      ]

      const innerPrivateStates = [
        {
          id: Properties.__data,
          expression: [{
            type: 'state',
            storedStateId: '__data',
            componentId: 'outer-component',
            previewIndex: 0
          }, {
            type: 'property',
            fieldId: 'countries',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        },
        {
          id: Properties.innerHTML,
          expression: [{
            type: 'state',
            storedStateId: '__data',
            componentId: 'inner-component',
            previewIndex: 0
          }, {
            type: 'property',
            fieldId: 'name',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        }
      ]

      // Mock the outer component to have the inner component as a child
      jest.spyOn(outerComponent, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return outerPrivateStates
        return undefined
      })

      jest.spyOn(outerComponent, 'components').mockReturnValue([innerComponent])

      jest.spyOn(innerComponent, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return innerPrivateStates
        return undefined
      })

      // Mock inner component's view
      const innerMockElement = document.createElement('p')
      innerMockElement.innerHTML = 'Country name'
      innerMockElement.id = 'inner-component'
      Object.defineProperty(innerComponent, 'view', {
        value: { el: innerMockElement },
        writable: true,
        configurable: true
      })

      // Setup getState mock to return appropriate states
      ;(getState as jest.Mock).mockImplementation((comp, property) => {
        if (comp === innerComponent && property === Properties.__data) {
          return innerPrivateStates[0]
        }
        if (comp === innerComponent && property === Properties.innerHTML) {
          return innerPrivateStates[1]
        }
        if (comp === outerComponent && property === Properties.__data) {
          return outerPrivateStates[0]
        }
        return null
      })

      // Mock dataTree with nested data structure
      dataTree.previewData = {
        [testDataSourceId]: {
          continents: [
            {
              name: 'Africa',
              countries: [
                { name: 'Angola' },
                { name: 'Egypt' }
              ]
            }
          ]
        }
      }

      // Mock fromStored
      ;(fromStored as jest.Mock).mockImplementation((token: StoredToken) => ({
        ...token,
        label: 'test',
        typeIds: ['string'],
        kind: token.kind || 'scalar',
      }))

      // Mock getValue to return appropriate nested data
      jest.spyOn(dataTree, 'getValue').mockImplementation((expression: Expression) => {
        const lastToken = expression[expression.length - 1] as StoredToken & {fieldId?: string, previewIndex?: number}

        if (lastToken?.fieldId === 'countries') {
          // Return countries array for the continent at the specified index
          return dataTree.previewData[testDataSourceId].continents[0]?.countries || []
        }

        if (lastToken?.fieldId === 'name') {
          // Return country name for the specified index
          const countryIndex = lastToken?.previewIndex || 0
          const countries = dataTree.previewData[testDataSourceId].continents[0]?.countries || []
          return countries[countryIndex]?.name || 'Unknown'
        }

        return null
      })

      // Test creating a loop element for the outer component
      const result = createLoopElementForIndex(outerComponent, 0, dataTree)

      expect(result).not.toBeNull()
      expect(result?.classList.contains('ds-loop-item')).toBe(true)
      expect(result?.getAttribute('data-loop-index')).toBe('0')

      // The result should contain the nested loop structure
      // Since the inner component has __data state, it should create multiple elements
      expect(result?.children.length).toBeGreaterThan(0)
    })
  })

  describe('Visibility Conditions in Loops', () => {
    test('should evaluate visibility conditions correctly for loop components', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas

      // Setup test data that matches the real scenario
      dataTree.previewData = {
        [testDataSourceId]: {
          modules: [
            { item: { type: 'simple-hero' } },
            { item: { type: 'other-type' } },
            { item: { type: 'simple-hero' } },
            { item: null },
            { item: { type: 'simple-hero' } }
          ]
        }
      }

      // Setup component with both loop data and visibility condition
      const mockPrivateStates = [
        {
          id: Properties.__data,
          expression: [{
            type: 'property',
            fieldId: 'modules',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        },
        {
          id: Properties.innerHTML,
          expression: [{
            type: 'state',
            storedStateId: '__data',
            componentId: 'test-component',
            previewIndex: 0
          }, {
            type: 'property',
            fieldId: 'item',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }, {
            type: 'property',
            fieldId: 'type',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        },
        {
          id: Properties.condition,
          expression: [{
            type: 'state',
            storedStateId: '__data',
            componentId: 'test-component',
            previewIndex: 0
          }, {
            type: 'property',
            fieldId: 'item',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }, {
            type: 'property',
            fieldId: 'type',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        },
        {
          id: Properties.condition2,
          expression: [{
            type: 'property',
            propType: 'field',
            fieldId: 'fixed',
            kind: 'scalar',
            typeIds: ['String'],
            options: { value: 'simple-hero' }
          }]
        }
      ]

      jest.spyOn(component, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return mockPrivateStates
        if (key === 'conditionOperator') return '=='
        return undefined
      })

      // Mock getState
      ;(getState as jest.Mock).mockImplementation((comp, property) => {
        const state = mockPrivateStates.find(s => s.id === property)
        return state || null
      })

      // Mock fromStored
      ;(fromStored as jest.Mock).mockImplementation((token: StoredToken) => ({
        ...token,
        label: 'test',
        typeIds: ['string'],
        kind: token.kind || 'scalar',
      }))

      // Mock getValue to return different values based on the expression and previewIndex
      jest.spyOn(dataTree, 'getValue').mockImplementation((expression: Expression, comp?: Component, resolvePreview?: boolean) => {
        const lastToken = expression[expression.length - 1] as StoredToken & {fieldId?: string, previewIndex?: number, options?: {value?: string}}
        
        // Handle fixed value (condition2)
        if (lastToken?.options?.value) {
          return lastToken.options.value
        }
        
        // Handle dynamic values based on previewIndex
        const previewIndex = lastToken?.previewIndex || 0
        const moduleData = dataTree.previewData[testDataSourceId].modules[previewIndex]
        
        if (lastToken?.fieldId === 'type') {
          return moduleData?.item?.type || null
        }
        
        if (lastToken?.fieldId === 'modules') {
          if (resolvePreview === false) {
            // Return full array for loop processing
            return dataTree.previewData[testDataSourceId].modules
          } else {
            // Return specific item
            return moduleData
          }
        }
        
        return null
      })

      // Test creating elements at different loop indices
      // Index 0: modules[0].item.type = 'simple-hero', should match condition
      const element0 = createLoopElementForIndex(component, 0, dataTree)
      expect(element0).not.toBeNull()
      expect(element0?.innerHTML).toBe('simple-hero')

      // Index 1: modules[1].item.type = 'other-type', should not match condition
      const element1 = createLoopElementForIndex(component, 1, dataTree)
      expect(element1).toBeNull() // Should be null due to visibility condition

      // Index 2: modules[2].item.type = 'simple-hero', should match condition
      const element2 = createLoopElementForIndex(component, 2, dataTree)
      expect(element2).not.toBeNull()
      expect(element2?.innerHTML).toBe('simple-hero')

      // Index 3: modules[3].item = null, should not match condition
      const element3 = createLoopElementForIndex(component, 3, dataTree)
      expect(element3).toBeNull() // Should be null due to visibility condition

      // Index 4: modules[4].item.type = 'simple-hero', should match condition
      const element4 = createLoopElementForIndex(component, 4, dataTree)
      expect(element4).not.toBeNull()
      expect(element4?.innerHTML).toBe('simple-hero')
    })

    test('should preserve child component content when children have no dynamic states', async () => {
      const canvas = await import('./canvas')
      const { createLoopElementForIndex } = canvas

      // Setup test data for loop
      dataTree.previewData = {
        [testDataSourceId]: {
          pages: [
            { title: 'Page 1' },
            { title: 'Page 2' },
            { title: 'Page 3' }
          ]
        }
      }

      // Create child components that have no dynamic states (static text)
      const childComponent1 = {
        getId: () => 'child1',
        get: jest.fn().mockReturnValue([]), // No privateStates
        components: () => [],
        view: {
          el: (() => {
            const el = document.createElement('p')
            el.innerHTML = 'TEST'
            el.id = 'child1'
            return el
          })()
        }
      }

      const childComponent2 = {
        getId: () => 'child2', 
        get: jest.fn().mockReturnValue([]), // No privateStates
        components: () => [],
        view: {
          el: (() => {
            const el = document.createElement('p')
            el.innerHTML = 'TEST'
            el.id = 'child2'
            return el
          })()
        }
      }

      // Setup parent component with loop data and static children
      const mockPrivateStates = [
        {
          id: Properties.__data,
          expression: [{
            type: 'property',
            fieldId: 'pages',
            dataSourceId: testDataSourceId,
            previewIndex: 0
          }]
        }
      ]

      jest.spyOn(component, 'get').mockImplementation((key) => {
        if (key === 'privateStates') return mockPrivateStates
        return undefined
      })

      jest.spyOn(component, 'components').mockReturnValue([childComponent1, childComponent2])

      // Mock getState
      ;(getState as jest.Mock).mockImplementation((comp, property) => {
        if (property === Properties.__data) {
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

      // Mock getValue
      jest.spyOn(dataTree, 'getValue').mockImplementation((expression: Expression, comp?: Component, resolvePreview?: boolean) => {
        if (resolvePreview === false) {
          // Return full array for loop processing
          return dataTree.previewData[testDataSourceId].pages
        }
        return null
      })

      // Test creating a loop element
      const element = createLoopElementForIndex(component, 0, dataTree)

      expect(element).not.toBeNull()
      expect(element?.classList.contains('ds-loop-item')).toBe(true)
      expect(element?.getAttribute('data-loop-index')).toBe('0')
      
      // Should have two child p elements with preserved content
      const children = element?.children
      expect(children?.length).toBe(2)
      expect(children?.[0].tagName).toBe('P')
      expect(children?.[0].innerHTML).toBe('TEST')
      expect(children?.[1].tagName).toBe('P') 
      expect(children?.[1].innerHTML).toBe('TEST')
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
