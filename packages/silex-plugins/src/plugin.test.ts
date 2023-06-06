import {describe, expect, test, } from '@jest/globals'
import { loadPlugins, Plugin, } from './plugin'
import { Config, } from '.'

const TEST_VALUE = {test: 'example',}
const FAKE_CONFIG = {} as Config

describe('Plugins test', () => {
  test('Test loading 0 plugins', async () => {
    const result = await loadPlugins(FAKE_CONFIG, [], {})
    expect(result).toEqual({})
  })
  test('Test loadPlugins', async () => {
    const plugin = '../examples/plugin.js' as Plugin
    const options = {}
    const result = await loadPlugins(FAKE_CONFIG, [plugin,], options)
    expect(result).toEqual(TEST_VALUE)
  })
  test('Test add a function plugin', async () => {
    const plugin = jest.fn().mockResolvedValue(TEST_VALUE)
    const result = await loadPlugins(FAKE_CONFIG, [plugin,])
    // Check that the config includes the plugin result
    expect(result).toEqual(TEST_VALUE)

    // Check the plugin calls
    // loadPlugins is called because of the mock
    expect(plugin.mock.calls).toHaveLength(1)
    expect(plugin.mock.calls[0][0]).toBe(FAKE_CONFIG)
  })
})
