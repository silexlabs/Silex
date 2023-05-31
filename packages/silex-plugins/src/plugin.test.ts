import {describe, expect, test, } from '@jest/globals'
import { loadPlugins, } from './plugin'
import { Config, } from '.'

describe('Plugins test', () => {
  test('Test loading 0 plugins', async () => {
    const result = await loadPlugins({} as Config, [])
    expect(result).toEqual({})
  })
  test('Test loadPlugins', async () => {
    const plugin = {
      require: '../examples/plugin.js',
      type: ['test',],
      active: true,
      hidden: false,
      options: {},
    }
    const result = await loadPlugins({} as Config, [plugin,])
    expect(result).toEqual({test: 'example',})
  })
})
