import {describe, expect, test, beforeEach, jest,} from '@jest/globals'
import config from './config'
import * as plugin from './plugin'

const PLUGIN_RESULT = { test: 'me', }
jest.mock('./plugin', () => ({
  loadPlugins: jest.fn().mockResolvedValue(PLUGIN_RESULT),
}))
const loadPlugins = plugin.loadPlugins

describe('Config test', () => {
  let instance
  let empty
  beforeEach(() => {
    expect(config).not.toBeUndefined()
    instance = config('..')
    empty = config('..')
    expect(instance).not.toBeUndefined()
  })
  test('Test add a single plugin', async () => {
    const plugin = {
      require: 'examples/plugin.js',
      type: ['test',],
      active: true,
      hidden: false,
      options: {},
    }
    const result = await instance.addPlugin(plugin)
    // Check that the config includes the plugin result
    expect(result).toBe(instance)
    expect(instance).toEqual({
      ...empty,
      ...PLUGIN_RESULT,
    })
    // Check the loadPlugins calls
    expect(loadPlugins.mock.calls).toHaveLength(1)
    expect(loadPlugins.mock.calls[0][0]).toBe(instance)
    expect(loadPlugins.mock.calls[0][1]).toBeInstanceOf(Array)
    expect(loadPlugins.mock.calls[0][1][0]).toBe(plugin)
  })
  test('Test add multiple plugins', async () => {
    const plugin1 = {
      require: 'examples/plugin.js',
      type: ['test',],
      active: true,
      hidden: false,
      options: {},
    }
    const plugin2 = { ...plugin1, }
    await instance.addPlugin([plugin1, plugin2,])
    // Check the loadPlugins calls
    expect(loadPlugins.mock.calls).toHaveLength(1)
    expect(loadPlugins.mock.calls[0][0]).toBe(instance)
    expect(loadPlugins.mock.calls[0][1]).toBeInstanceOf(Array)
    expect(loadPlugins.mock.calls[0][1][0]).toBe(plugin1)
    expect(loadPlugins.mock.calls[0][1][1]).toBe(plugin2)
  })
  test('Test events', async () => {
    const cbk = jest.fn()
    const params = 'test params'
    const eventName = 'test:event'
    instance.on(eventName, cbk)
    instance.on(eventName, cbk)
    instance.emit(eventName, params)
    instance.emit(eventName, params)
    expect(cbk).toHaveBeenCalledTimes(4)
    expect(cbk).toHaveBeenLastCalledWith(params)
  })
})
