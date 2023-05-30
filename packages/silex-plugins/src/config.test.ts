import config from './config'

test('empty config', () => {
    expect(config).not.toBeUndefined()
})