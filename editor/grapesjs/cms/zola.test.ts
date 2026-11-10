/*
 * @jest-environment jsdom
 */

import { beforeEach, expect, jest, test } from '@jest/globals'
import grapesjs, { type Editor } from 'grapesjs'
import { ClientSideFileType } from '~/common/types'
import dataSourcePlugin from '@silexlabs/grapesjs-data-source'

jest.unstable_mockModule('./tera-filters', () => ({ getTeraFilters: () => [] }))
const { zola } = await import('./zola')

const fixed = (value: string) => ({ type: 'property', propType: 'field', fieldId: 'fixed', label: 'Fixed value', kind: 'scalar', typeIds: ['String'], options: { value } })
const pageData = JSON.stringify([{ type: 'property', propType: 'field', fieldId: 'posts', label: 'posts', kind: 'list', typeIds: ['Post'], dataSourceId: 'wp' }])

let editor: Editor

beforeEach(() => {
  editor = grapesjs.init({ headless: true, storageManager: false, plugins: [editor => dataSourcePlugin(editor, { dataSources: [], filters: [] })] })
  editor.getModel().set('config', { publicationTransformers: [] })
})

function itemPermalink(...parts: object[]) {
  return JSON.stringify([
    { type: 'state', storedStateId: 'item', componentId: 'body-id', exposed: true, label: 'Page item' },
    { type: 'property', propType: 'field', fieldId: 'slug', label: 'slug', kind: 'scalar', typeIds: ['String'], dataSourceId: 'wp' },
    ...parts,
  ])
}

function addCollectionPage(permalink: string) {
  const page = editor.Pages.add({ name: 'Article', settings: { eleventyPageData: pageData, eleventyPermalink: permalink, withData: itemPermalink() } })!
  page.getMainComponent().addAttributes({ id: 'body-id' })
  page.getMainComponent().set('id-plugin-data-source', 'body-id')
  return page
}

test('Pages without data are copied to static/, the error page too', () => {
  const ssg = zola(editor)
  expect(ssg.transformPath!('/about.html', ClientSideFileType.HTML)).toBe('/static/about.html')
  expect(ssg.transformPath!('/css/about.css', ClientSideFileType.CSS)).toBe('/static/css/about.css')
})

test('A collection page whose items end with .html is refused', () => {
  addCollectionPage(itemPermalink({ type: 'filter', id: 'append', label: 'append', options: { value: JSON.stringify([fixed('.html')]) } }))
  expect(zola(editor).check!().map(({ message }) => message).join('\n')).toMatch(/Permalink which ends with \.html/)
})

test('A collection page whose permalink uses another filter is refused', () => {
  addCollectionPage(itemPermalink({ type: 'filter', id: 'math.Add', label: 'add', options: {} }))
  expect(zola(editor).check!().map(({ message }) => message).join('\n')).toMatch(/Permalink made of something else/)
})

test('Like Eleventy, the address of an item gets a slash at each end', () => {
  addCollectionPage(itemPermalink())
  const files = [{ type: ClientSideFileType.HTML, path: '/templates/silex-article.html', content: '' }]
  zola(editor).onData!({ files } as never)
  const split = files.find(({ path }) => path === '/data/silex/article.split.json')
  expect(JSON.parse(split!.content).path).toEqual([{ text: '/' }, { field: ['slug'] }, { text: '/' }])
})

test('The error page with data is the 404 template of Zola, without content', () => {
  const page = editor.Pages.add({ name: '404', settings: { withData: itemPermalink() } })!
  page.getMainComponent().set('id-plugin-data-source', 'body-id')
  const ssg = zola(editor)
  expect(ssg.transformPath!('/404.html', ClientSideFileType.HTML)).toBe('/templates/404.html')
  const files = [{ type: ClientSideFileType.HTML, path: '/templates/404.html', content: '' }]
  ssg.onData!({ files } as never)
  expect(files.map(({ path }) => path)).toEqual(['/templates/404.html'])
})

test('A website without data still has the templates folder Zola needs', () => {
  editor.Pages.add({ name: 'about' })
  const files = [{ type: ClientSideFileType.HTML, path: '/static/about/index.html', content: '' }]
  zola(editor).onData!({ files } as never)
  expect(files.map(({ path }) => path)).toEqual(['/static/about/index.html', '/templates/.gitkeep'])
})
