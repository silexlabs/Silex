/*
 * @jest-environment jsdom
 */

import { expect, jest, test } from '@jest/globals'
import type { Filter } from '@silexlabs/grapesjs-data-source'
import type { TeraOptions } from './tera'

jest.unstable_mockModule('@silexlabs/grapesjs-data-source', () => ({
  getFilters: () => ['slice', 'truncate', 'append', 'upcase', 'split', 'sort', 'size', 'reverse', 'slugify', 'downcase', 'replace', 'escape', 'default', 'date']
    .map(id => ({ id, label: id }) as unknown as Filter),
}))
const { getTeraFilters } = await import('./tera-filters')

function options(values: Record<string, string | null>): TeraOptions {
  return {
    text: key => values[key] ? `"${values[key]}"` : '""',
    integer: key => values[key] ?? null,
    variable: value => value === 'list' || value === 'text' ? value : `bound(${value})`,
    path: key => values[key]?.split('.') ?? [],
  }
}

function toTera(id: string, input: string, values: Record<string, string | null>): string {
  const filter = getTeraFilters().find(filter => filter.id === id)
  if (!filter) throw new Error(`No filter ${id}`)
  return filter.toTera(input, options(values))
}

test('Only the filters Zola can publish', () => {
  expect(getTeraFilters().map(({ id }) => id)).toEqual(['slice', 'truncate', 'append', 'split', 'sort', 'size', 'reverse', 'slugify', 'downcase', 'replace', 'escape', 'default', 'date'])
})

test('Slice takes a start and a length, like Liquid', () => {
  expect(toTera('slice', 'list', { start: '1', end: '2' })).toBe('list[1:3]')
  expect(toTera('slice', 'list', { start: null, end: null })).toBe('list[0:]')
  expect(toTera('slice', 'list', { start: '2', end: '0' })).toBe('list[2:]')
  expect(toTera('slice', 'list', { start: '-1', end: '1' })).toBe('list[-1:]')
  expect(toTera('slice', 'list', { start: '-3', end: '1' })).toBe('list[-3:-2]')
  expect(toTera('slice', 'list', { start: 'silex_0', end: '2' })).toBe('list[silex_0:silex_0 + 2]')
})

test('Truncate counts the ellipsis in the length', () => {
  expect(toTera('truncate', 'text', { length: '10' })).toBe('text if (text | length) <= 10 else (text | truncate(length=7, end="..."))')
  expect(toTera('truncate', 'text', { length: null })).toContain('<= 50')
  expect(toTera('truncate', 'text', { length: 'silex_0' })).toContain('truncate(length=(silex_0 - 3 if silex_0 > 3 else 0)')
})

test('Split cuts at the separator, as it is', () => {
  expect(toTera('split', 'text', { separator: ' - ' })).toBe('text | split(pat=" - ")')
})

test('Sort sorts the items, or by the field of an item the key names', () => {
  expect(toTera('sort', 'list', { key: null })).toBe('list | sort')
  expect(toTera('sort', 'list', { key: 'author.name' })).toBe('list | sort(attribute="author.name")')
})

test('The filters with a Tera twin of another name', () => {
  expect(toTera('size', 'list', {})).toBe('list | length')
  expect(toTera('downcase', 'text', {})).toBe('text | lower')
})

test('Replace replaces every occurrence, like Liquid', () => {
  expect(toTera('replace', 'text', { search: 'a', replace: '@' })).toBe('text | replace(from="a", to="@")')
})

test('Default replaces nil, false and empty values but not 0, like Liquid', () => {
  expect(toTera('default', 'item.title', { value: 'none' })).toBe('(bound(item.title) if bound(item.title) or bound(item.title) == 0 else "none")')
})

test('Date always gives Zola the time zone, UTC unless told another', () => {
  expect(toTera('date', 'text', { format: '%Y-%m-%d', timeZone: null })).toBe('text | date(format="%Y-%m-%d", timezone="UTC")')
  expect(toTera('date', 'text', { format: '%Y-%m-%d', timeZone: 'Europe/Paris' })).toBe('text | date(format="%Y-%m-%d", timezone="Europe/Paris")')
})
