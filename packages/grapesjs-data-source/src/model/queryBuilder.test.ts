/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import grapesjs, { Editor, Page } from 'grapesjs'
import { DataTree } from './DataTree'
import { getPageQuery, buildPageQueries } from './queryBuilder'
import { initializeDataSourceRegistry, setDataSources } from './dataSourceRegistry'
import { initializeDataSourceManager } from './dataSourceManager'
import { Expression, IDataSource, Property } from '../types'

// FIXME: Workaround to avoid import of lit-html which breaks unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

// No need to mock dataSourceManager since we pass dataTree explicitly

describe('QueryBuilder', () => {
  let editor: Editor
  let dataTree: DataTree
  let mockDataSource: IDataSource
  let page: Page

  beforeEach(() => {
    editor = grapesjs.init({
      container: document.createElement('div'),
      components: '<div></div>',
    })

    mockDataSource = {
      id: 'test-ds',
      label: 'Test Data Source',
      url: 'http://test.com',
      type: 'graphql',
      method: 'POST',
      headers: {},
      readonly: false,
      hidden: false,
      connect: jest.fn(),
      isConnected: jest.fn(() => true),
      getTypes: jest.fn(() => []),
      getQueryables: jest.fn(() => []),
      getQuery: jest.fn((trees) => `query { ${trees.map(t => t.token.fieldId).join(' ')} }`),
      fetchValues: jest.fn(() => Promise.resolve({})),
      on: jest.fn(),
      off: jest.fn(),
    }

    // Initialize registry and set data sources
    initializeDataSourceRegistry(editor)
    setDataSources([mockDataSource])

    // Initialize DataSourceManager with proper config
    initializeDataSourceManager([mockDataSource], editor, {
      dataSources: [],
      filters: [],
      view: {},
      commands: { refresh: 'refresh' },
    })

    dataTree = new DataTree(editor, {
      dataSources: [mockDataSource],
      filters: [],
    })

    page = editor.Pages.getSelected()!
  })

  it('should return empty query when no expressions found', () => {
    // Mock getPageExpressions to return empty array
    jest.spyOn(dataTree, 'getPageExpressions').mockReturnValue([])

    const queries = getPageQuery(page, editor, dataTree)
    expect(queries).toEqual({})
  })

  it('should return empty query when data source is not connected', () => {
    // Mock data source as not connected
    mockDataSource.isConnected = jest.fn(() => false)

    const queries = getPageQuery(page, editor, dataTree)
    expect(queries).toEqual({})
  })

  it('should generate query when expressions are found', () => {
    // Mock getPageExpressions to return expressions
    const mockExpression = {
      component: editor.getComponents().first(),
      expression: [{
        type: 'property',
        fieldId: 'testField',
        propType: 'field',
        label: 'Test Field',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'test-ds',
      }] as Expression
    }

    jest.spyOn(dataTree, 'getPageExpressions').mockReturnValue([mockExpression])
    jest.spyOn(dataTree, 'toTrees').mockReturnValue([{
      token: mockExpression.expression[0] as Property,
      children: []
    }])

    const queries = getPageQuery(page, editor, dataTree)
    expect(queries).toEqual({
      'test-ds': 'query { testField }'
    })
    expect(mockDataSource.getQuery).toHaveBeenCalled()
  })

  it('should handle state resolution in expressions', () => {
    const mockExpression = {
      component: editor.getComponents().first(),
      expression: [{
        type: 'state',
        storedStateId: 'test-state',
        componentId: 'test-component',
        exposed: true,
        label: 'Test State',
      }] as Expression
    }

    const resolvedExpression = [{
      type: 'property',
      fieldId: 'resolvedField',
      propType: 'field',
      label: 'Resolved Field',
      typeIds: ['string'],
      kind: 'scalar',
      dataSourceId: 'test-ds',
    }] as Expression

    jest.spyOn(dataTree, 'getPageExpressions').mockReturnValue([mockExpression])
    jest.spyOn(dataTree, 'resolveState').mockReturnValue(resolvedExpression)
    jest.spyOn(dataTree, 'toTrees').mockReturnValue([{
      token: resolvedExpression[0] as Property,
      children: []
    }])

    const queries = getPageQuery(page, editor, dataTree)
    expect(queries).toEqual({
      'test-ds': 'query { resolvedField }'
    })
    expect(dataTree.resolveState).toHaveBeenCalledWith(mockExpression.expression[0], mockExpression.component)
  })

  it('should filter expressions by data source', () => {
    const mockExpression1 = {
      component: editor.getComponents().first(),
      expression: [{
        type: 'property',
        fieldId: 'field1',
        propType: 'field',
        label: 'Field 1',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'test-ds',
      }] as Expression
    }

    const mockExpression2 = {
      component: editor.getComponents().first(),
      expression: [{
        type: 'property',
        fieldId: 'field2',
        propType: 'field',
        label: 'Field 2',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'other-ds',
      }] as Expression
    }

    jest.spyOn(dataTree, 'getPageExpressions').mockReturnValue([mockExpression1, mockExpression2])
    jest.spyOn(dataTree, 'toTrees').mockReturnValue([{
      token: mockExpression1.expression[0] as Property,
      children: []
    }])

    const queries = getPageQuery(page, editor, dataTree)
    expect(queries).toEqual({
      'test-ds': 'query { field1 }'
    })
    // Should only call toTrees with expressions for the matching data source
    expect(dataTree.toTrees).toHaveBeenCalledWith([{
      component: mockExpression1.component,
      expression: mockExpression1.expression
    }], 'test-ds')
  })

  it('should build queries for multiple pages', () => {
    const page1 = editor.Pages.add({ id: 'page1' }) as Page
    const page2 = editor.Pages.add({ id: 'page2' }) as Page

    jest.spyOn(dataTree, 'getPageExpressions').mockReturnValue([])

    const queries = buildPageQueries([page1, page2], editor, dataTree)
    expect(queries).toEqual({
      [page1.getId()]: {},
      [page2.getId()]: {}
    })
  })

  it('should handle errors in state resolution', () => {
    const mockExpression = {
      component: editor.getComponents().first(),
      expression: [{
        type: 'state',
        storedStateId: 'invalid-state',
        componentId: 'test-component',
        exposed: true,
        label: 'Invalid State',
      }] as Expression
    }

    jest.spyOn(dataTree, 'getPageExpressions').mockReturnValue([mockExpression])
    jest.spyOn(dataTree, 'resolveState').mockReturnValue(null)
    jest.spyOn(editor, 'runCommand').mockImplementation(() => {})

    expect(() => getPageQuery(page, editor, dataTree)).toThrow('Unable to resolve state')
    expect(editor.runCommand).toHaveBeenCalledWith('notifications:add', expect.objectContaining({
      type: 'error',
      message: expect.stringContaining('Unable to resolve state')
    }))
  })
})
