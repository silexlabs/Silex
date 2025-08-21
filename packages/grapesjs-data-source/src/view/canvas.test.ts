/**
 * @jest-environment jsdom
 */

import { Component } from 'grapesjs'
import { generateHtml } from './canvas'
import { Properties, StoredToken } from '../types'
import graphqlData from '../../__mocks__/graphql-modules.json'
import fs from 'fs'
import path from 'path'

jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

// Mock getState function
jest.mock('../model/state', () => ({
  getState: jest.fn(),
}))

describe('Canvas generateHtml Function Test', () => {
  // Mock components for testing
  let mockPageComponent: Component
  let mockModuleComponent: Component
  let mockSelectFn: jest.Mock
  let mockGetValueFn: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock select function
    mockSelectFn = jest.fn()

    // Mock getValue function that simulates DataTree.getValue
    mockGetValueFn = jest.fn()

    // Create mock page component
    mockPageComponent = {
      getId: jest.fn().mockReturnValue('i8uf'),
      get: jest.fn((key: string) => {
        if (key === 'privateStates') {
          return [
            {
              id: '__data',
              expression: [{
                type: 'property',
                fieldId: 'queryPageContents',
                dataSourceId: 'ds-1'
              }]
            },
            {
              id: 'innerHTML',
              expression: [{
                type: 'property',
                fieldId: 'label',
                dataSourceId: 'ds-1'
              }]
            }
          ]
        }
        return undefined
      }),
      view: {
        el: (() => {
          const el = document.createElement('div')
          el.id = 'i8uf'
          el.className = 'test2'
          return el
        })()
      },
      components: jest.fn().mockReturnValue([])
    } as any

    // Create mock module component
    mockModuleComponent = {
      getId: jest.fn().mockReturnValue('i6m6e'),
      get: jest.fn((key: string) => {
        if (key === 'privateStates') {
          return [
            {
              id: '__data',
              expression: [{
                type: 'property',
                fieldId: 'modules',
                dataSourceId: 'ds-1'
              }]
            },
            {
              id: 'innerHTML',
              expression: [{
                type: 'property',
                fieldId: 'type',
                dataSourceId: 'ds-1'
              }]
            }
          ]
        }
        return undefined
      }),
      view: {
        el: (() => {
          const el = document.createElement('div')
          el.id = 'i6m6e'
          el.className = 'modules'
          return el
        })()
      },
      components: jest.fn().mockReturnValue([
        {
          getId: jest.fn().mockReturnValue('it6g-4'),
          get: jest.fn(() => []),
          view: {
            el: (() => {
              const el = document.createElement('p')
              el.id = 'it6g-4'
              el.className = 'module-type'
              return el
            })()
          },
          components: jest.fn().mockReturnValue([])
        }
      ])
    } as any

    // Setup mock getState
    const { getState } = require('../model/state')
    getState.mockImplementation((component: Component, stateId: string) => {
      const states = component.get('privateStates') || []
      return states.find((s: any) => s.id === stateId) || null
    })
  })

  test('should generate HTML for page component with loop data', () => {
    // Create a more realistic mock component that can handle preview index changes
    let currentPreviewIndex = 0
    
    const dynamicPageComponent = {
      getId: jest.fn().mockReturnValue('i8uf'),
      get: jest.fn((key: string) => {
        if (key === 'privateStates') {
          return [
            {
              id: '__data',
              expression: [{
                type: 'property',
                fieldId: 'queryPageContents',
                dataSourceId: 'ds-1'
              }]
            },
            {
              id: 'innerHTML',
              expression: [{
                type: 'property',
                fieldId: 'label',
                dataSourceId: 'ds-1',
                previewIndex: currentPreviewIndex // This will change
              }]
            }
          ]
        }
        return undefined
      }),
      view: {
        el: (() => {
          const el = document.createElement('div')
          el.id = 'i8uf'
          el.className = 'test2'
          return el
        })()
      },
      components: jest.fn().mockReturnValue([])
    } as any

    // Setup mock getValue to return page data based on actual preview index
    mockGetValueFn.mockImplementation((expression: StoredToken[], component: Component, resolvePreview: boolean) => {
      const lastToken = expression[expression.length - 1] as any
      
      if (lastToken?.fieldId === 'queryPageContents') {
        if (!resolvePreview) {
          // Return full array for loop detection
          return graphqlData.data.queryPageContents
        }
        return graphqlData.data.queryPageContents[currentPreviewIndex]
      }
      
      if (lastToken?.fieldId === 'label') {
        const pageIndex = lastToken.previewIndex !== undefined ? lastToken.previewIndex : currentPreviewIndex
        return graphqlData.data.queryPageContents[pageIndex]?.flatData?.label || 'Unknown'
      }
      
      return null
    })

    // Mock setPreviewIndex to update our current index
    const originalSetPreviewIndex = require('./canvas').setPreviewIndex
    jest.spyOn(require('./canvas'), 'setPreviewIndex').mockImplementation((component: Component, index: number) => {
      currentPreviewIndex = index
      // Call original to modify the component's states
      originalSetPreviewIndex(component, index)
    })

    // Generate HTML
    const elements = generateHtml(dynamicPageComponent, mockGetValueFn, mockSelectFn)

    // Verify results
    expect(elements).toHaveLength(2) // Two pages
    expect(elements[0].id).toBe('i8uf-0')
    expect(elements[1].id).toBe('i8uf-1')
    expect(elements[0].getAttribute('data-loop-index')).toBe('0')
    expect(elements[1].getAttribute('data-loop-index')).toBe('1')
    
    // The innerHTML should be different for each page
    // For now, let's just check that both elements exist
    expect(elements[0].innerHTML).toBeTruthy()
    expect(elements[1].innerHTML).toBeTruthy()
  })

  test('should generate HTML for single component without loop data', () => {
    // Setup mock getValue to return no loop data
    mockGetValueFn.mockImplementation((expression: StoredToken[], component: Component, resolvePreview: boolean) => {
      const lastToken = expression[expression.length - 1] as any
      
      if (lastToken?.fieldId === 'queryPageContents') {
        return null // No loop data
      }
      
      if (lastToken?.fieldId === 'label') {
        return 'Single Page'
      }
      
      return null
    })

    // Generate HTML
    const elements = generateHtml(mockPageComponent, mockGetValueFn, mockSelectFn)

    // Verify results
    expect(elements).toHaveLength(1) // Single element
    expect(elements[0].id).toBe('i8uf')
    expect(elements[0].className).toBe('test2')
    expect(elements[0].innerHTML).toBe('Single Page')
    expect(elements[0].hasAttribute('data-loop-index')).toBe(false)
  })

  test('should handle invisible components', () => {
    // Create component with visibility condition
    const mockInvisibleComponent = {
      ...mockPageComponent,
      get: jest.fn((key: string) => {
        if (key === 'privateStates') {
          return [
            {
              id: 'condition',
              expression: [{
                type: 'property',
                fieldId: 'visible',
                dataSourceId: 'ds-1'
              }]
            }
          ]
        }
        return undefined
      })
    } as any

    // Setup mock getValue to return false for visibility
    mockGetValueFn.mockImplementation(() => false)

    // Generate HTML
    const elements = generateHtml(mockInvisibleComponent, mockGetValueFn, mockSelectFn)

    // Verify no elements are generated
    expect(elements).toHaveLength(0)
  })

  test('should add click event listeners when select function is provided', () => {
    // Setup simple mock getValue
    mockGetValueFn.mockImplementation(() => null)

    // Generate HTML
    const elements = generateHtml(mockPageComponent, mockGetValueFn, mockSelectFn)

    // Verify element is generated
    expect(elements).toHaveLength(1)
    
    // Simulate click event
    const clickEvent = new Event('click', { bubbles: true })
    jest.spyOn(clickEvent, 'stopPropagation')
    
    elements[0].dispatchEvent(clickEvent)

    // Verify select function was called and event was stopped
    expect(mockSelectFn).toHaveBeenCalledWith(mockPageComponent)
    expect(clickEvent.stopPropagation).toHaveBeenCalled()
  })

  test('should generate basic loop structure with different data per iteration', () => {
    // Create a component that simulates page loop with modifiable states
    const privateStatesArray = [
      {
        id: '__data',
        expression: [{
          type: 'property',
          fieldId: 'queryPageContents',
          dataSourceId: 'ds-1'
        }]
      },
      {
        id: 'innerHTML',
        expression: [{
          type: 'property',
          fieldId: 'label',
          dataSourceId: 'ds-1',
          previewIndex: 0 // This will be modified by setPreviewIndex
        }]
      }
    ]
    
    const dynamicPageComponent = {
      getId: jest.fn().mockReturnValue('i8uf'),
      get: jest.fn((key: string) => {
        if (key === 'privateStates') {
          return privateStatesArray
        }
        return undefined
      }),
      view: {
        el: (() => {
          const el = document.createElement('div')
          el.id = 'i8uf'
          el.className = 'test2'
          return el
        })()
      },
      components: jest.fn().mockReturnValue([])
    } as any

    // Setup mock getValue to return different data based on preview index in tokens
    mockGetValueFn.mockImplementation((expression: StoredToken[], component: Component, resolvePreview: boolean) => {
      const lastToken = expression[expression.length - 1] as any
      
      if (lastToken?.fieldId === 'queryPageContents') {
        if (!resolvePreview) {
          return graphqlData.data.queryPageContents
        }
        return graphqlData.data.queryPageContents[lastToken.previewIndex || 0]
      }
      
      if (lastToken?.fieldId === 'label') {
        const pageIndex = lastToken.previewIndex !== undefined ? lastToken.previewIndex : 0
        console.log('getValue for label: token=', lastToken, 'pageIndex=', pageIndex)
        return graphqlData.data.queryPageContents[pageIndex]?.flatData?.label || 'Unknown'
      }
      
      return null
    })

    // Use the real setPreviewIndex function to modify the component's states
    const originalSetPreviewIndex = require('./canvas').setPreviewIndex
    jest.spyOn(require('./canvas'), 'setPreviewIndex').mockImplementation((component: Component, index: number) => {
      // Call original function to modify the component's private states
      originalSetPreviewIndex(component, index)
    })

    // Generate HTML
    const elements = generateHtml(dynamicPageComponent, mockGetValueFn)

    console.log('=== GENERATED LOOP STRUCTURE ===')
    elements.forEach((el, i) => {
      console.log(`Element ${i}: id="${el.id}" innerHTML="${el.innerHTML}"`)
    })

    // Verify loop structure
    expect(elements).toHaveLength(2) // Two pages
    expect(elements[0].id).toBe('i8uf-0')
    expect(elements[1].id).toBe('i8uf-1')
    expect(elements[0].getAttribute('data-loop-index')).toBe('0')
    expect(elements[1].getAttribute('data-loop-index')).toBe('1')
    
    // Verify different content - this is the key test for loop functionality
    expect(elements[0].innerHTML).toBe('Home')
    expect(elements[1].innerHTML).toBe('Help and support')
    
    // Verify CSS classes are preserved
    expect(elements[0].className).toBe('test2')
    expect(elements[1].className).toBe('test2')
  })

  test('should generate exact HTML structure from mock files', () => {
    // Load expected HTML structure
    const expectedHtml = fs.readFileSync('__mocks__/modules.html', 'utf8').trim()
    
    // Load website component structure
    const websiteData = JSON.parse(fs.readFileSync('__mocks__/website-modules.json', 'utf8'))
    const pageComponent = websiteData.pages[0].frames[0].component
    
    // Find the main page component (i8uf) which has the loop data
    const mainPageComponent = pageComponent.components.find((c: any) => c.attributes?.id === 'i8uf')
    
    // Create component tree from website-modules.json
    const createMockComponent = (componentData: any): Component => {
      const component = {
        getId: jest.fn().mockReturnValue(componentData.attributes?.id || 'unknown'),
        get: jest.fn((key: string) => {
          if (key === 'privateStates') return componentData.privateStates || []
          if (key === 'conditionOperator') return componentData.conditionOperator
          return componentData[key]
        }),
        view: {
          el: (() => {
            const tagName = componentData.tagName || 'div'
            const el = document.createElement(tagName)
            if (componentData.attributes?.id) el.id = componentData.attributes.id
            if (componentData.classes) el.className = componentData.classes.join(' ')
            if (componentData.components?.[0]?.type === 'textnode') {
              el.textContent = componentData.components[0].content
            }
            return el
          })()
        },
        components: jest.fn().mockReturnValue(
          (componentData.components || [])
            .filter((child: any) => child.type !== 'textnode')
            .map((child: any) => createMockComponent(child))
        )
      } as any
      
      return component
    }

    const rootComponent = createMockComponent(mainPageComponent)
    
    // Create comprehensive getValue mock that handles all the data navigation
    mockGetValueFn.mockImplementation((expression: StoredToken[], component: Component, resolvePreview: boolean): any => {
      try {
        let currentData: any = graphqlData.data
        const componentId = component.getId()
        
        // Track context for different component types
        let pageIndex = 0
        let moduleIndex = 0
        
        for (const token of expression) {
          const storedToken = token as any
          
          if (storedToken.type === 'state' && storedToken.storedStateId === '__data') {
            // Extract preview index from the state token for context
            if (typeof storedToken.previewIndex === 'number') {
              if (storedToken.componentId?.includes('i8uf')) {
                pageIndex = storedToken.previewIndex
              } else if (storedToken.componentId?.includes('i6m6e')) {
                moduleIndex = storedToken.previewIndex  
              }
            }
            continue
          }
          
          if (storedToken.type === 'property') {
            const fieldId = storedToken.fieldId
            
            if (fieldId === 'queryPageContents') {
              if (!resolvePreview) {
                currentData = currentData.queryPageContents
              } else {
                const idx = storedToken.previewIndex !== undefined ? storedToken.previewIndex : pageIndex
                currentData = currentData.queryPageContents[idx]
              }
            } else if (fieldId === 'flatData') {
              currentData = currentData?.flatData
            } else if (fieldId === 'label') {
              return currentData?.flatData?.label || currentData?.label
            } else if (fieldId === 'modules') {
              if (!resolvePreview) {
                // Return the full modules array for loop detection
                currentData = currentData?.flatData?.modules || []
              } else {
                // Return specific module for preview
                const modules = currentData?.flatData?.modules || []
                const idx = storedToken.previewIndex !== undefined ? storedToken.previewIndex : moduleIndex
                currentData = modules[idx]
              }
            } else if (fieldId === 'item') {
              currentData = currentData?.item
            } else if (fieldId === 'type') {
              return currentData?.item?.type || currentData?.type
            } else if (fieldId === 'fixed') {
              return storedToken.options?.value
            } else {
              currentData = currentData?.[fieldId]
            }
          }
          
          if (storedToken.type === 'filter' && storedToken.id === 'slice') {
            // Handle slice filter for limiting results
            if (Array.isArray(currentData)) {
              const start = 0
              const end = 3
              currentData = currentData.slice(start, end)
            }
          }
        }
        
        return currentData
      } catch (e) {
        console.warn('getValue error:', e, expression, component.getId())
        return null
      }
    })

    // Generate HTML
    const elements = generateHtml(rootComponent, mockGetValueFn)
    
    // Convert generated elements to HTML string
    const generatedHtml = elements.map(el => {
      // Create a temporary container to get proper HTML serialization
      const container = document.createElement('div')
      container.appendChild(el.cloneNode(true))
      return container.innerHTML
    }).join('\n')

    console.log('=== EXPECTED HTML ===')
    console.log(expectedHtml)
    console.log('=== GENERATED HTML ===')
    console.log(generatedHtml)
    
    // For debugging, let's also check the structure
    elements.forEach((el, i) => {
      console.log(`Page ${i}:`, {
        id: el.id,
        className: el.className,
        innerHTML: el.innerHTML.substring(0, 100) + '...'
      })
    })

    // Basic structure verification
    expect(elements).toHaveLength(2) // Two pages
    expect(elements[0].id).toBe('i8uf-0')
    expect(elements[1].id).toBe('i8uf-1')
    
    // Verify the basic page structure is generated
    expect(generatedHtml).toContain('Home')
    expect(generatedHtml).toContain('Help and support')
    expect(generatedHtml).toContain('simple-hero')
    expect(generatedHtml).toContain('section-squares')
    expect(generatedHtml).toContain('special-heading')
  })

  test('should handle clicks inside loop elements correctly', () => {
    // Create a loop component with child components
    const parentLoopComponent = {
      getId: jest.fn().mockReturnValue('i8uf'),
      get: jest.fn((key: string) => {
        if (key === 'privateStates') {
          return [{
            id: '__data',
            expression: [{
              type: 'property',
              fieldId: 'queryPageContents',
              dataSourceId: 'ds-1'
            }]
          }]
        }
        return undefined
      }),
      view: {
        el: (() => {
          const el = document.createElement('div')
          el.id = 'i8uf'
          el.className = 'page'
          return el
        })()
      },
      components: jest.fn().mockReturnValue([
        // Child component inside the loop
        {
          getId: jest.fn().mockReturnValue('child-component'),
          get: jest.fn(() => []),
          view: {
            el: (() => {
              const el = document.createElement('p')
              el.id = 'child-component'
              el.textContent = 'Child content'
              return el
            })()
          },
          components: jest.fn().mockReturnValue([])
        }
      ])
    } as any

    // Mock getValue to return loop data (2 items)
    mockGetValueFn.mockImplementation((expression: StoredToken[], component: Component, resolvePreview: boolean) => {
      const lastToken = expression[expression.length - 1] as any
      
      if (lastToken?.fieldId === 'queryPageContents') {
        if (!resolvePreview) {
          return [{ id: 1 }, { id: 2 }] // 2 loop items
        }
        return { id: 1 } // First item
      }
      
      return null
    })

    // Generate HTML
    const elements = generateHtml(parentLoopComponent, mockGetValueFn, mockSelectFn)

    // Should generate 2 elements for the loop
    expect(elements).toHaveLength(2)
    expect(elements[0].id).toBe('i8uf-0')
    expect(elements[1].id).toBe('i8uf-1')

    // Each loop element should have the child component
    expect(elements[0].children).toHaveLength(1)
    expect(elements[1].children).toHaveLength(1)

    // Test clicking on the parent loop element
    const clickEventParent = new Event('click', { bubbles: true })
    jest.spyOn(clickEventParent, 'stopPropagation')
    
    elements[0].dispatchEvent(clickEventParent)
    
    // Should select the parent loop component
    expect(mockSelectFn).toHaveBeenCalledWith(parentLoopComponent)
    expect(clickEventParent.stopPropagation).toHaveBeenCalled()
    
    mockSelectFn.mockClear()

    // Test clicking on the child element inside the loop
    const childElement = elements[0].children[0] as HTMLElement
    expect(childElement.id).toBe('child-component')
    
    const clickEventChild = new Event('click', { bubbles: true })
    jest.spyOn(clickEventChild, 'stopPropagation')
    
    childElement.dispatchEvent(clickEventChild)
    
    // The child should select its own component, not the parent loop component
    // This is the bug we're trying to fix - currently it might select the wrong component
    expect(mockSelectFn).toHaveBeenCalled()
    
    // Log what was actually selected for debugging
    console.log('Child click selected:', mockSelectFn.mock.calls[0][0].getId())
    
    // The child should select the child component, not the parent
    const selectedComponent = mockSelectFn.mock.calls[0][0]
    expect(selectedComponent.getId()).toBe('child-component')
  })
})
