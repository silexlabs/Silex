/*
 * @jest-environment jsdom
 */

import dedent from 'dedent'
import { expect, jest, test } from '@jest/globals'
import { buildAttributes, getFrontMatter, isAttribute, linkToPermalink, queryToDataFile } from './publication'
import { echoBlock, ifBlock } from './liquid'
import { BinaryOperator, IDataSource, toExpression } from '@silexlabs/grapesjs-data-source'
import grapesjs, { Page } from 'grapesjs'
import { Silex11tyPluginWebsiteSettings } from './index'

// Prevent lit-html from being imported (it is a peer dependency and breaks the tests)
jest.mock('lit-html', () => ({}))

const PAGE_TEST = {
  getName: () => 'page name example',
  getId: () => 'page id example',
  getMainComponent: () => ({
    ccid: 'ccidtest',
  }),
} as unknown as Page

const PAGE_DATA_TEST = `[{
  "options": { "filter": "{}" },
  "type": "property",
  "propType": "field",
  "fieldId": "continents",
  "label": "continents",
  "typeIds": ["Continent"],
  "dataSourceId": "datasourceIdTest",
  "kind": "list"
}]`

const PAGE_DATA_FIXED_TEST = `[{
  "type": "property",
  "propType": "field",
  "fieldId": "fixed",
  "label": "Fixed value",
  "kind": "scalar",
  "typeIds": ["String"],
  "options": { "value": "/test/" }
}]`

test('Front matter of a collection page', () => {
  const settings = { eleventyPageData: PAGE_DATA_TEST } as Silex11tyPluginWebsiteSettings
  expect(() => getFrontMatter(PAGE_TEST, settings, 'page-1', 'collectionTest')).not.toThrow()
  expect(getFrontMatter(PAGE_TEST, settings, 'page-1', 'collectionTest')).toEqual(dedent`
  ---
  pagination:
    addAllPagesToCollections: true
    data: datasourceIdTest.continents
    size: 1
  collection: "collectionTest"
  \n---\n`)
})

test('Permalink', () => {
  const settings = {
    eleventyPageData: PAGE_DATA_TEST,
    eleventyPermalink: PAGE_DATA_TEST,
  } as Silex11tyPluginWebsiteSettings
  expect(() => getFrontMatter(PAGE_TEST, settings, 'page-1', '')).not.toThrow()
  expect(getFrontMatter(PAGE_TEST, settings, 'page-1', '')).toEqual(dedent`
  ---
  pagination:
    addAllPagesToCollections: true
    data: datasourceIdTest.continents
    size: 1
  permalink: "/{% assign var_ccidtest_1 = datasourceIdTest.continents %}{{ var_ccidtest_1 }}/"
  \n---\n`)
})

test('Permalink with fixed string expression', () => {
  const settings = {
    eleventyPageData: PAGE_DATA_TEST,
    eleventyPermalink: PAGE_DATA_FIXED_TEST,
  } as Silex11tyPluginWebsiteSettings
  expect(() => getFrontMatter(PAGE_TEST, settings, 'page-1', '')).not.toThrow()
  expect(getFrontMatter(PAGE_TEST, settings, 'page-1', '')).toEqual(dedent`
  ---
  pagination:
    addAllPagesToCollections: true
    data: datasourceIdTest.continents
    size: 1
  permalink: "/test/"
  \n---\n`)
})

test('With languages', () => {
  const settings = {
    eleventyPageData: 'directus.posts',
    silexLanguagesList: 'fr,en',
    silexLanguagesDefault: 'en',
  } as Silex11tyPluginWebsiteSettings
  expect(() => getFrontMatter(PAGE_TEST, settings, 'page-1', '', 'fr')).not.toThrow()
  expect(getFrontMatter(PAGE_TEST, settings, 'page-1', '', 'fr')).toEqual(dedent`
  ---
  pagination:
    addAllPagesToCollections: true
    data: directus.posts
    size: 1
  lang: "fr"
  \n---\n`)
})

// A data-source expression that contains a filter (property `continents` | downcase)
const PAGE_DATA_FILTER_TEST = `[
  { "type": "property", "propType": "field", "fieldId": "continents", "label": "continents", "typeIds": ["Continent"], "dataSourceId": "datasourceIdTest", "kind": "list" },
  { "type": "filter", "id": "downcase", "label": "downcase", "options": {} }
]`

test('Permalink with a filter in the expression', () => {
  const settings = {
    eleventyPageData: PAGE_DATA_TEST,
    eleventyPermalink: PAGE_DATA_FILTER_TEST,
  } as Silex11tyPluginWebsiteSettings
  const fm = getFrontMatter(PAGE_TEST, settings, 'page-1', '')
  // The filter must be part of the generated permalink liquid, wrapped in slashes
  expect(fm).toContain('| downcase')
  expect(fm).toMatch(/permalink: "\/{% assign .*= datasourceIdTest\.continents \| downcase %}{{ .* }}\/"/)
})

test('SEO field with an expression that contains a filter (echoBlock)', () => {
  // transformPage() feeds SEO fields (title/description/og:*) through echoBlock
  const body = PAGE_TEST.getMainComponent()
  const out = echoBlock(body, toExpression(PAGE_DATA_FILTER_TEST)!)
  expect(out).toContain('datasourceIdTest.continents | downcase')
  expect(out).toMatch(/{% liquid[\s\S]*assign [\s\S]*\| downcase[\s\S]*echo /)
})

// Visibility conditions (issue #1942): a fixed number compared with a numeric field
// must be published without quotes, else Liquid compares a number to the string "826"
// and the condition is always false while it is true in the editor
test('Visibility condition with a numeric field and a fixed number (ifBlock)', () => {
  const body = PAGE_TEST.getMainComponent()
  const count = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "count", "label": "count",
    "kind": "scalar", "typeIds": ["Int"], "dataSourceId": "datasourceIdTest"
  }]`)!
  const fixed826 = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "fixed", "label": "Fixed value",
    "kind": "scalar", "typeIds": ["String"], "options": { "value": "826" }
  }]`)!
  const [start] = ifBlock(body, {
    operator: BinaryOperator.EQUAL,
    expression: count,
    expression2: fixed826,
  })
  expect(start).toMatch(/assign \w+ = datasourceIdTest\.count/)
  // The fixed number is published as a number, not as the text "826"
  expect(start).toMatch(/assign \w+ = 826\b/)
  expect(start).not.toContain('"826"')
})

test('Visibility condition with a numeric field and a fixed number on the left (ifBlock)', () => {
  const body = PAGE_TEST.getMainComponent()
  const fixed826 = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "fixed", "label": "Fixed value",
    "kind": "scalar", "typeIds": ["String"], "options": { "value": "826" }
  }]`)!
  const count = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "count", "label": "count",
    "kind": "scalar", "typeIds": ["Float"], "dataSourceId": "datasourceIdTest"
  }]`)!
  const [start] = ifBlock(body, {
    operator: BinaryOperator.EQUAL,
    expression: fixed826,
    expression2: count,
  })
  // The fixed number on the left is published as a number too
  expect(start).toMatch(/assign \w+ = 826\b/)
  expect(start).not.toContain('"826"')
  expect(start).toMatch(/assign \w+ = datasourceIdTest\.count/)
})

test('Visibility condition with a string field keeps the quotes (ifBlock)', () => {
  const body = PAGE_TEST.getMainComponent()
  const name = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "name", "label": "name",
    "kind": "scalar", "typeIds": ["String"], "dataSourceId": "datasourceIdTest"
  }]`)!
  const fixedAlex = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "fixed", "label": "Fixed value",
    "kind": "scalar", "typeIds": ["String"], "options": { "value": "Alex" }
  }]`)!
  const [start] = ifBlock(body, {
    operator: BinaryOperator.EQUAL,
    expression: name,
    expression2: fixedAlex,
  })
  // A string field still gets a quoted string
  expect(start).toMatch(/assign \w+ = datasourceIdTest\.name/)
  expect(start).toMatch(/assign \w+ = "Alex"/)
})

test('Visibility condition with a numeric field and a fixed text keeps the quotes (ifBlock)', () => {
  const body = PAGE_TEST.getMainComponent()
  const count = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "count", "label": "count",
    "kind": "scalar", "typeIds": ["Int"], "dataSourceId": "datasourceIdTest"
  }]`)!
  const fixedNotANumber = toExpression(`[{
    "type": "property", "propType": "field", "fieldId": "fixed", "label": "Fixed value",
    "kind": "scalar", "typeIds": ["String"], "options": { "value": "Alex" }
  }]`)!
  const [start] = ifBlock(body, {
    operator: BinaryOperator.EQUAL,
    expression: count,
    expression2: fixedNotANumber,
  })
  // A fixed text is not turned into a number
  expect(start).toMatch(/assign \w+ = "Alex"/)
})

test('isAttribute', () => {
  expect(isAttribute('data-attribute')).toBe(true)
  expect(isAttribute('href')).toBe(true)
  expect(isAttribute('innerHTML')).toBe(false)
  expect(isAttribute('')).toBe(false)
})

test('buildAttributes', () => {
  const attributes = buildAttributes({
    'href': 'original-value',
    'class': 'original-value',
  }, [{
    stateId: 'href-id',
    label: 'href',
    value: 'new-value',
  }, {
    stateId: 'class-id',
    label: 'class',
    value: 'new-value',
  }])
  expect(attributes).toEqual('href="new-value" class="original-value new-value"')
})

test('queryToDataFile with EleventyFetch and with plain fetch', () => {
  const dataSourceId = 'data source id example'
  // queryToDataFile reads `type` and `serverToServer` as direct properties
  const dataSource = {
    id: dataSourceId,
    type: 'graphql',
    serverToServer: {
      url: 'http://localhost:8055',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    },
  } as unknown as IDataSource
  const query = 'query str example'
  const baseOptions = { cacheBuster: false, dataSources: [], view: {}, filters: [], previewActive: false }

  // With EleventyFetch
  const result1 = queryToDataFile(dataSource, query, { ...baseOptions, fetchPluginSettings: {} } as never, PAGE_TEST, 'fr', {})
  expect(result1.split('{').length).toBe(result1.split('}').length)
  expect(result1.split('(').length).toBe(result1.split(')').length)
  expect(result1).toContain('EleventyFetch(')

  // With fetchPluginSettings false -> no EleventyFetch
  const result2 = queryToDataFile(dataSource, query, { ...baseOptions, fetchPluginSettings: false } as never, PAGE_TEST, 'fr', false)
  expect(result2).not.toContain('EleventyFetch')
  expect(result2.split('{').length).toBe(result2.split('}').length)
  expect(result2.split('(').length).toBe(result2.split(')').length)

  // With plain fetch
  const result3 = queryToDataFile(dataSource, query, { ...baseOptions } as never, PAGE_TEST, 'fr', false)
  expect(result3).not.toContain('EleventyFetch')
  expect(result3).toContain('await fetch(')
})

test('Links to a page follow its fixed permalink', () => {
  const editor = grapesjs.init({ headless: true, storageManager: false })
  const fixed = (value: string) => JSON.stringify([{ type: 'property', propType: 'field', fieldId: 'fixed', label: 'Fixed value', kind: 'scalar', typeIds: ['String'], options: { value } }])
  editor.Pages.add({ name: 'About', settings: { eleventyPermalink: fixed('/a-propos/') } })
  editor.Pages.add({ name: 'Contact' })
  expect(linkToPermalink(editor, '/about/#team')).toBe('/a-propos/#team')
  expect(linkToPermalink(editor, '/contact/')).toBe('/contact/')
})

test('Permalink of a collection page: fixed text around a field of the item of the page', () => {
  const fixed = (value: string) => ({ type: 'property', propType: 'field', fieldId: 'fixed', label: 'Fixed value', kind: 'scalar', typeIds: ['String'], options: { value } })
  const settings = {
    eleventyPageData: PAGE_DATA_TEST,
    eleventyPermalink: JSON.stringify([
      { type: 'state', storedStateId: 'items', componentId: 'body', exposed: true, label: 'Pagination items' },
      { type: 'filter', id: 'first', label: 'first', options: {} },
      { type: 'property', propType: 'field', fieldId: 'slug', label: 'slug', kind: 'scalar', typeIds: ['String'], dataSourceId: 'datasourceIdTest' },
      { type: 'filter', id: 'prepend', label: 'prepend', options: { value: JSON.stringify([fixed('blog/')]) } },
    ]),
  } as Silex11tyPluginWebsiteSettings
  expect(getFrontMatter(PAGE_TEST, settings, 'post', '')).toMatch(
    /permalink: "\/{% assign (var_\w+) = pagination\.items \| first %}{% assign (var_\w+) = \1\.slug \| prepend: \\"blog\/\\" %}{{ \2 }}\/"/)
})
