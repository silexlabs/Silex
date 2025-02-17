import { ComplexSelector, toString } from './ComplexSelector'
import { IdSelector } from './SimpleSelector'

const id = 'TEST_ID'

describe('toString', () => {
  test('builds correct selector string', () => {
    expect(toString({
      mainSelector: {
        selectors: [
          {
            type: 'id',
            value: id,
            active: true,
          } as IdSelector
        ]
      }
    } as ComplexSelector)).toBe(`#${id}`)
  })
})