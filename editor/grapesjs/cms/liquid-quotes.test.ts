/*
 * @jest-environment jsdom
 */

import { expect, test } from '@jest/globals'
import type { Expression, Filter, Property } from '@silexlabs/grapesjs-data-source'

const { getLiquidStatement, getLiquidStatementProperties } = await import('./liquid')
const { Liquid } = await import('liquidjs')

// Regression tests for https://github.com/silexlabs/Silex/issues/1940
// A fixed value is written between double quotes in the published liquid,
// so a quote or a backslash in the value must be escaped when it is written.

/**
 * A fixed value token, as stored in an expression
 */
const fixed = (value: string): Property => ({
  type: 'property',
  propType: 'field',
  fieldId: 'fixed',
  label: 'fixed value',
  typeIds: ['String'],
  kind: 'scalar',
  options: { value },
} as unknown as Property)

/**
 * A data source field token, as stored in an expression
 */
const field = (fieldId: string): Property => ({
  type: 'property',
  propType: 'field',
  fieldId,
  label: fieldId,
  typeIds: ['String'],
  kind: 'scalar',
} as unknown as Property)

/**
 * A filter whose option is a fixed value, as stored by the expression input
 */
const filterWithFixedOption = (id: string, key: string, value: string): Filter => ({
  type: 'filter',
  id,
  label: id,
  options: { [key]: JSON.stringify([fixed(value)]) },
} as unknown as Filter)

test('A normal fixed value is wrapped in quotes as before', () => {
  expect(getLiquidStatementProperties([fixed('Hello')] as Expression)).toBe('"Hello"')
})

test('Double quotes in a fixed value are escaped', () => {
  expect(getLiquidStatementProperties([fixed('Say "hi"')] as Expression)).toBe('"Say \\"hi\\""')
})

test('Backslashes in a fixed value are escaped', () => {
  expect(getLiquidStatementProperties([fixed('C:\\backslash')] as Expression)).toBe('"C:\\\\backslash"')
})

test('Quotes and backslashes together are escaped', () => {
  expect(getLiquidStatementProperties([fixed('a "b" \\ c')] as Expression)).toBe('"a \\"b\\" \\\\ c"')
})

test('An empty fixed value stays an empty liquid string', () => {
  expect(getLiquidStatementProperties([fixed('')] as Expression)).toBe('""')
})

test('A filter option fixed value is escaped, like append with a suffix', () => {
  // Reproduction of the issue: append with the fixed value Say "hi"
  // used to give `append: "Say "hi""` and liquidjs stopped on it
  const expression = [
    fixed('Hello'),
    filterWithFixedOption('append', 'value', 'Say "hi"'),
  ] as Expression
  expect(getLiquidStatement(expression, 'var').statement)
    .toBe('assign var = "Hello" | append: "Say \\"hi\\""')
})

test('A quoted option keeps the escaping of a fixed value', () => {
  // join's separator is a quoted option, the value is quoted again after
  // the expression is converted, and that must not drop the escapes
  const expression = [
    field('tags'),
    filterWithFixedOption('join', 'separator', 'a "b" \\ c'),
  ] as Expression
  expect(getLiquidStatement(expression, 'var').statement)
    .toBe('assign var = tags | join: "a \\"b\\" \\\\ c"')
})

test('The published liquid renders back the value the user typed', async () => {
  // The liquid from the issue, which liquidjs used to reject with
  // `unexpected character "hi""`
  const expression = [
    fixed('Hello'),
    filterWithFixedOption('append', 'value', 'Say "hi"'),
  ] as Expression
  const statement = getLiquidStatement(expression, 'var').statement
  const template = `{% liquid\n  ${statement}\n  echo var\n%}`
  const rendered = await new Liquid().parseAndRender(template)
  expect(rendered).toBe('HelloSay "hi"')
})
