/**
 * @jest-environment jsdom
 */
import { DataSourceEditor } from './types'
import storage from './storage'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

const config1 = { get: jest.fn(() => true), id: 'config1' } // from the config
const config2 = { get: jest.fn(() => true), id: 'config2' } // from the config
const website1 = { get: jest.fn(() => false), id: 'website1' } // from the website
const website2 = { get: jest.fn(() => undefined), id: 'website2' } // from the website
jest.mock('./datasources/GraphQL', () => jest.fn().mockImplementation((x) => ({ connect: jest.fn(), id: 'website1DataSource', x })))

describe('storage', () => {
  let editor: DataSourceEditor
  let onStore: Function
  let onLoad: Function
  beforeEach(() => {
    const callbacks = new Map<string, Function>()
    editor = {
      on: (event, callback) => callbacks.set(event, callback),
      DataSourceManager: {
        getAll: jest.fn(() => [
          config1,
          config2,
          website1,
          website2,
        ]),
        reset: jest.fn(),
        add: jest.fn(),
      }
    } as any as DataSourceEditor
    storage(editor)
    expect(callbacks.size).toBe(2)
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
  })
  it('should load data sources from website and keep those from the config', () => {
    const newWebsite1 = { get: jest.fn(() => false), id: 'newWebsite1' }
    const newWebsite2 = { get: jest.fn(() => undefined), id: 'newWebsite2' }
    const newWebsite3 = { get: jest.fn(() => true), id: 'newWebsite3' }

    const data = { dataSources: [
      newWebsite1,
      newWebsite2,
      newWebsite3,
    ] }
    onLoad(data)
    expect(editor.DataSourceManager.reset).toHaveBeenCalledWith([
      config1,
      config2,
    ])
    expect(editor.DataSourceManager.add).toHaveBeenCalledTimes(1)
    expect(editor.DataSourceManager.add.mock.calls[0][0][0].id).toEqual('website1DataSource')
    expect(editor.DataSourceManager.add.mock.calls[0][0][0].x.id).toEqual('newWebsite1')
  })
})
