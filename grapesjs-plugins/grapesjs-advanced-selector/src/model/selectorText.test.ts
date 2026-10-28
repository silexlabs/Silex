import { fromString } from './ComplexSelector'
import { fitsModel } from './selectorText'

const fits = (selector: string) => fitsModel(selector, fromString(selector, ''))

test('selectors the model keeps', () => {
  ['.card', '.card:hover', '.list > .card', '.list>.card', '.list .card', '.a + .b', '.a ~ .b',
    '.card:has(img)', '.btn:not(.disabled)', '.card.big', '.big.card', '#x.card', 'div.card',
    '.item:nth-child(2n)', '.card::before', '[data-x="y"]', '[data-x=y]',
  ].forEach(selector => expect([selector, fits(selector)]).toEqual([selector, true]))
})

test('selectors the model would change', () => {
  ['.a > .b > .c', '.a .b .c', '.a:hover:focus', '.a:has(.b .c)', '.a:has(> .b)', '.a > .b:has(.c)',
  ].forEach(selector => expect([selector, fits(selector)]).toEqual([selector, false]))
})
