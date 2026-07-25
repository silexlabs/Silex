/*
 * @jest-environment jsdom
 */

import dedent from 'dedent'
import { expect, jest, test } from '@jest/globals'
import { buildAttributes, getFrontMatter, isAttribute, queryToDataFile } from './publication'
import { echoBlock } from './liquid'
import { IDataSource, toExpression } from '@silexlabs/grapesjs-data-source'
import { Page } from 'grapesjs'
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

test('Front matter of a simple page', () => {
  expect(() => getFrontMatter(PAGE_TEST, {} as Silex11tyPluginWebsiteSettings, 'page-1', '')).not.toThrow()
  expect(getFrontMatter(PAGE_TEST, {} as Silex11tyPluginWebsiteSettings, 'page-1', '')).toEqual(dedent`
  ---
  permalink: "/page-1/index.html"
  \n---\n`)
})

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
