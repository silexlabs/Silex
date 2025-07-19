/**
 * @jest-environment jsdom
 */
import { Editor } from 'grapesjs'
import storage from './storage'
import { resetDataSources, refreshDataSources } from './model/dataSourceManager'
import { getAllDataSources, addDataSource } from './model/dataSourceRegistry'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

// Mock the dataSourceManager to avoid complex initialization
jest.mock('./model/dataSourceManager', () => ({
  resetDataSources: jest.fn(),
  refreshDataSources: jest.fn()
}))

// Mock the dataSourceRegistry 
jest.mock('./model/dataSourceRegistry', () => ({
  getAllDataSources: jest.fn(),
  addDataSource: jest.fn(),
}))

const config1 = { readonly: true, id: 'config1', label: 'Config 1', url: 'http://config1.com', type: 'graphql' as const } // from the config
const config2 = { readonly: true, id: 'config2', label: 'Config 2', url: 'http://config2.com', type: 'graphql' as const } // from the config
const website1 = { readonly: false, id: 'website1', label: 'Website 1', url: 'http://website1.com', type: 'graphql' as const } // from the website
const website2 = { id: 'website2', label: 'Website 2', url: 'http://website2.com', type: 'graphql' as const } // from the website (readonly undefined)
jest.mock('./datasources/GraphQL', () => jest.fn().mockImplementation((x) => ({ connect: jest.fn(), id: 'website1DataSource', ...x })))

describe('storage', () => {
  let editor: Editor
  let onStore: Function
  let onLoad: Function
  beforeEach(() => {
    const callbacks = new Map<string, Function>()
    editor = {
      on: (event, callback) => callbacks.set(event, callback),
    } as any as Editor

    // Mock the getAllDataSources to return our test data
    ;(getAllDataSources as jest.Mock).mockReturnValue([config1, config2, website1, website2])

    storage(editor)
    expect(callbacks.get('storage:start:store')).toBeDefined()
    onStore = callbacks.get('storage:start:store')!
    expect(callbacks.get('storage:end:load')).toBeDefined()
    onLoad = callbacks.get('storage:end:load')!
  })

  it('should store data sources from the website only', () => {
    const previousDataSource = { id: 'whatever data'}
    const data = { dataSources: [previousDataSource] }
    onStore(data)
    expect(data.dataSources).toHaveLength(2)
    expect(data.dataSources[0]).not.toEqual(previousDataSource)
    expect(data.dataSources[0].id).toEqual('website1')
    expect(data.dataSources[1].id).toEqual('website2')
  })
  it('should load data sources from website and keep those from the config', async () => {
    const newWebsite1 = { readonly: false, id: 'newWebsite1', label: 'New Website 1', url: 'http://new1.com', type: 'graphql' as const }
    const newWebsite2 = { id: 'newWebsite2', label: 'New Website 2', url: 'http://new2.com', type: 'graphql' as const }
    const newWebsite3 = { readonly: true, id: 'newWebsite3', label: 'New Website 3', url: 'http://new3.com', type: 'graphql' as const }

    const data = { dataSources: [
      newWebsite1,
      newWebsite2,
      newWebsite3,
    ] }
    await onLoad(data)

    // Check that resetDataSources was called with config data sources only
    expect(resetDataSources).toHaveBeenCalledWith([config1, config2])

    // Check that addDataSource was called for each new data source
    expect(addDataSource).toHaveBeenCalledTimes(3)
  })
})
