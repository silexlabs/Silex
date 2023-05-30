import {describe, expect, test, beforeEach, jest} from '@jest/globals'
import config, { Config } from './config'
import * as plugin from './plugin'

jest.mock('./plugin', () => ({
  loadPlugins: jest.fn<any>().mockResolvedValue({}),
}))

describe('Config test', () => {
    let instance
    beforeEach(() => {
        expect(config).not.toBeUndefined()
        instance = config('test', '..')
        expect(instance).not.toBeUndefined()
    })
    test('empty config', async () => {
        const result = await instance.addPlugin({
          require: 'examples/plugin.js',
          type: ['test'],
          active: true,
          hidden: false,
          options: {},
        })
        expect(result).toEqual(instance)
    })
})
