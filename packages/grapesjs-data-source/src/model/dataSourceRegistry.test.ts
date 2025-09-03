/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { 
  initializeDataSourceRegistry,
  getAllDataSources,
  addDataSource,
  removeDataSource,
  getDataSource,
  setDataSources,
  dataSourcesToJSON
} from './dataSourceRegistry'
import { IDataSource } from '../types'

// FIXME: Workaround to avoid import of lit-html which breaks unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

describe('DataSourceRegistry', () => {
  let editor: Editor
  let mockDataSource1: IDataSource
  let mockDataSource2: IDataSource

  beforeEach(() => {
    editor = grapesjs.init({
      container: document.createElement('div'),
      components: '<div></div>',
    })

    mockDataSource1 = {
      id: 'test1',
      label: 'Test Data Source 1',
      url: 'http://test1.com',
      type: 'graphql',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      readonly: false,
      hidden: false,
      connect: jest.fn(),
      isConnected: jest.fn(() => true),
      getTypes: jest.fn(() => []),
      getQueryables: jest.fn(() => []),
      getQuery: jest.fn(() => ''),
      fetchValues: jest.fn(() => Promise.resolve({})),
      on: jest.fn(),
      off: jest.fn(),
    }

    mockDataSource2 = {
      id: 'test2',
      label: 'Test Data Source 2',
      url: 'http://test2.com',
      type: 'graphql',
      method: 'GET',
      headers: {},
      readonly: true,
      hidden: false,
      connect: jest.fn(),
      isConnected: jest.fn(() => true),
      getTypes: jest.fn(() => []),
      getQueryables: jest.fn(() => []),
      getQuery: jest.fn(() => ''),
      fetchValues: jest.fn(() => Promise.resolve({})),
      on: jest.fn(),
      off: jest.fn(),
    }

    initializeDataSourceRegistry(editor)
  })

  it('should initialize with empty data sources', () => {
    expect(getAllDataSources()).toHaveLength(0)
  })

  it('should add a data source', () => {
    addDataSource(mockDataSource1)
    expect(getAllDataSources()).toHaveLength(1)
    expect(getAllDataSources()[0]).toBe(mockDataSource1)
  })

  it('should remove a data source', () => {
    addDataSource(mockDataSource1)
    addDataSource(mockDataSource2)
    expect(getAllDataSources()).toHaveLength(2)

    removeDataSource(mockDataSource1)
    expect(getAllDataSources()).toHaveLength(1)
    expect(getAllDataSources()[0]).toBe(mockDataSource2)
  })

  it('should get a data source by ID', () => {
    addDataSource(mockDataSource1)
    addDataSource(mockDataSource2)

    expect(getDataSource('test1')).toBe(mockDataSource1)
    expect(getDataSource('test2')).toBe(mockDataSource2)
    expect(getDataSource('nonexistent')).toBeUndefined()
  })

  it('should set all data sources', () => {
    addDataSource(mockDataSource1)
    expect(getAllDataSources()).toHaveLength(1)

    setDataSources([mockDataSource2])
    expect(getAllDataSources()).toHaveLength(1)
    expect(getAllDataSources()[0]).toBe(mockDataSource2)
  })

  it('should convert data sources to JSON', () => {
    addDataSource(mockDataSource1)
    addDataSource(mockDataSource2)

    const json = dataSourcesToJSON()
    expect(json).toHaveLength(2)
    expect(json[0]).toEqual({
      id: 'test1',
      label: 'Test Data Source 1',
      url: 'http://test1.com',
      type: 'graphql',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      readonly: false,
      hidden: false,
    })
    expect(json[1]).toEqual({
      id: 'test2',
      label: 'Test Data Source 2',
      url: 'http://test2.com',
      type: 'graphql',
      method: 'GET',
      headers: {},
      readonly: true,
      hidden: false,
    })
  })

  it('should trigger DATA_SOURCE_CHANGED event when adding data source', () => {
    const triggerSpy = jest.spyOn(editor, 'trigger')
    addDataSource(mockDataSource1)
    expect(triggerSpy).toHaveBeenCalledWith('data-source:changed')
  })

  it('should trigger DATA_SOURCE_CHANGED event when removing data source', () => {
    addDataSource(mockDataSource1)
    const triggerSpy = jest.spyOn(editor, 'trigger')
    removeDataSource(mockDataSource1)
    expect(triggerSpy).toHaveBeenCalledWith('data-source:changed')
  })

  it('should trigger DATA_SOURCE_CHANGED event when setting data sources', () => {
    const triggerSpy = jest.spyOn(editor, 'trigger')
    setDataSources([mockDataSource1])
    expect(triggerSpy).toHaveBeenCalledWith('data-source:changed')
  })

  it('should throw error when not initialized', async () => {
    // Create a new registry instance to test uninitialized state
    jest.resetModules()
    const { getAllDataSources: uninitializedGetAll } = await import('./dataSourceRegistry')
    expect(() => uninitializedGetAll()).toThrow('DataSourceRegistry not initialized')
  })
})