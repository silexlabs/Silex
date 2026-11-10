/*
 * @jest-environment jsdom
 */

import { expect, jest, test } from '@jest/globals'
import { Expression, StoredFilter } from '@silexlabs/grapesjs-data-source'
import { getTemplateExpression, type ExpressionLanguage } from './render'

jest.mock('lit-html', () => ({}))

const field = (fieldId: string, dataSourceId?: string) => ({ type: 'property', propType: 'field', fieldId, label: fieldId, kind: 'scalar', typeIds: ['String'], dataSourceId })
const fixed = (value: string) => ({ ...field('fixed'), options: { value } })
const filter = (id: string) => ({ type: 'filter', id, label: id, options: {} })
const state = (storedStateId: string) => ({ type: 'state', storedStateId, componentId: 'body', exposed: true, label: storedStateId })

const language: ExpressionLanguage = {
  string: value => `'${value}'`,
  variable: name => `$${name}`,
  field: (base, fields) => [base, ...fields].join('.'),
  filter: (stored: StoredFilter, input) => `${stored.id}(${input})`,
}

test('A field of a data source, of a state, then a filter', () => {
  expect(getTemplateExpression([field('posts', 'wp'), field('title')] as Expression, language)).toBe('$ds_wp.posts.title')
  expect(getTemplateExpression([state('item'), field('slug')] as Expression, language)).toBe('$state_body_item.slug')
  expect(getTemplateExpression([field('posts', 'wp'), filter('first'), field('title')] as Expression, language)).toBe('(first($ds_wp.posts)).title')
})

test('A fixed text, alone or before a filter', () => {
  expect(getTemplateExpression([fixed('/blog/')] as Expression, language)).toBe('\'/blog/\'')
  expect(getTemplateExpression([fixed('a'), filter('upcase')] as Expression, language)).toBe('(upcase(\'a\'))')
})

test('A language which reads no field of a filtered value', () => {
  const bound: string[] = []
  const expression = getTemplateExpression([field('posts', 'wp'), filter('first'), field('title')] as Expression, {
    ...language,
    fieldOfFiltered: filtered => {
      bound.push(filtered)
      return '$bound'
    },
  })
  expect(expression).toBe('$bound.title')
  expect(bound).toEqual(['(first($ds_wp.posts))'])
})

test('Malformed expressions', () => {
  expect(() => getTemplateExpression([], language)).toThrow('Expression is empty')
  expect(() => getTemplateExpression([filter('first')] as Expression, language)).toThrow('Expression cannot start with a filter')
  expect(() => getTemplateExpression([field('a', 'wp'), state('item')] as Expression, language)).toThrow('State can only be the first token in an expression')
  expect(() => getTemplateExpression([field('a')] as Expression, language)).toThrow('has no data source')
})
