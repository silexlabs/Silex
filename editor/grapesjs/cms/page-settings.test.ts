/*
 * @jest-environment jsdom
 */

import { expect, jest, test } from '@jest/globals'

jest.mock('lit-html', () => ({}))
jest.mock('lit-html/directives/ref.js', () => ({}))
jest.mock('lit-html/directives/live.js', () => ({}))

const { permalinkWarning } = await import('./page-settings')

const fixed = (value: string) => ({ type: 'property', propType: 'field', fieldId: 'fixed', kind: 'scalar', options: { value } })
const text = (id: string, value: string) => ({ type: 'filter', id, options: { value: JSON.stringify([fixed(value)]) } })
const slug = { type: 'property', propType: 'field', fieldId: 'slug', kind: 'scalar', dataSourceId: 'wp' }

test('a slash around a dynamic permalink is a warning', () => {
  expect(permalinkWarning({ eleventyPermalink: JSON.stringify([slug, text('prepend', 'blog/')]) })).toBeNull()
  expect(permalinkWarning({ eleventyPermalink: JSON.stringify([slug, text('prepend', 'blog/'), text('append', '/')]) })).toContain('slash')
  expect(permalinkWarning({ eleventyPermalink: JSON.stringify([slug, text('prepend', '/blog/')]) })).toContain('slash')
  expect(permalinkWarning({ eleventyPermalink: JSON.stringify([fixed('/about/')]) })).toBeNull()
})
