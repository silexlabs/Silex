/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import grapesjs from 'grapesjs'
import plugin from './index'
import { Type, Field, DataSourceType } from './types'
import { addDataSource } from './api'
import { GQLField, GQLType } from './datasources/GraphQL'
import { FieldKind, IDataSource } from '../dist'
import { getDataTreeFromUtils } from './utils'
import { compare, GroupingReporter } from 'dom-compare'
import { diff as jestDiff } from 'jest-diff'

// ////
// Use require instead of import so the TextEncoder/TextDecoder polyfill is set before jsdom loads (avoids hoisting).
/* @ts-expect-error Workaround jest+jsdom bug */
import { TextEncoder, TextDecoder } from 'util'
import { doRender } from './view/canvas'
;import { act } from 'react'
(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder
const { JSDOM } = require('jsdom')
// ////

const TESTS_PATH = '/integration-tests'

// tests/setupJest.ts (setupFilesAfterEnv dans Jest)
Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
  get() { return window },
})

Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
  get() { return document },
})

// Quand un iframe est ajouté au DOM, on simule son "load"
const origAppend = Element.prototype.appendChild
Element.prototype.appendChild = function (child: unknown) {
  const res = origAppend.call(this, child)
  if (child && child.tagName === 'IFRAME') {
    // microtask → simulateur de chargement
    Promise.resolve().then(() => {
      child.dispatchEvent(new Event('load'))
    })
  }
  return res
}

// Mock lit to avoid ES module import issues
jest.mock('lit', () => ({
  html: jest.fn((strings, ...values) => ({ strings, values })),
  render: jest.fn(),
}))

// Mock UI components that use decorators
jest.mock('./view/settings', () => jest.fn((editor, options) => {
  // Mock settings function that does nothing
}))

jest.mock('./view/custom-states-editor', () => ({
  CustomStatesEditor: jest.fn()
}))

jest.mock('./view/properties-editor', () => ({
  PropertiesEditor: jest.fn()
}))

// Mock module that doesn't exist
jest.mock('@silexlabs/expression-input', () => ({}), { virtual: true })

// Mock data source inspirée de EleventyDataSource
class MockDataSource implements IDataSource {
  /**
  * Unique identifier of the data source
  * This is used to retrieve the data source from the editor
  */
  public id = 'MockDataSourceId'
  public label = 'MockDataSourceLabel'
  public url = ''
  public type = 'graphql' as DataSourceType
  public method = 'POST'
  public headers = {}
  public hidden = true
  public readonly = true

  private mockData: { data: unknown[] }
  private mockTypes: {data: {__schema: {types: GQLType[], queryType: {name: string}}}}
  private queryType: string = ''

  private eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {}

  constructor(id: string, mockTypes: {data: {__schema: {types: GQLType[], queryType: {name: string}}}}, mockData: { data: unknown[] }) {
    this.mockTypes = mockTypes
    this.mockData = mockData
    this.queryType = mockTypes.data.__schema.queryType.name
    this.id = id
  }

  // Simple event handling
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) return
    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    } else {
      this.eventListeners[event] = []
    }
  }

  trigger(event: string, ...args: unknown[]): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event].forEach(callback => callback(...args))
  }

  /**
  * Implement IDatasource
  */
  async connect(): Promise<void> {}
  isConnected(): boolean { return true }

  /**
  * Implement IDatasource
  */
  getQuery(/*expressions: Expression[]*/): string { return '' }

  /**
  * Implement IDatasource
  */
  getTypes(): Type[] {
    // Built-in scalar types for GraphQL
    const builtinTypes: Type[] = [
      { id: 'String', label: 'String', fields: [], dataSourceId: this.id },
      { id: 'Int', label: 'Int', fields: [], dataSourceId: this.id },
      { id: 'ID', label: 'ID', fields: [], dataSourceId: this.id },
      { id: 'Boolean', label: 'Boolean', fields: [], dataSourceId: this.id },
      { id: 'Float', label: 'Float', fields: [], dataSourceId: this.id },
    ]

    // Include ALL types from the schema, not just query fields
    const allTypes = this.mockTypes.data.__schema.types
      .filter((type: GQLType) =>
        type.name &&
        !type.name.startsWith('__') && // Skip introspection types
        type.kind === 'OBJECT' // Only include object types for now
      )
      .map((type: GQLType) => {
        const fields = type.fields
          ? type.fields.map((f: GQLField) => ({
            id: f.name,
            label: f.name,
            typeIds: [f.type.name || f.type.ofType?.name || 'Unknown'],
            kind: (f.type.kind || '').toLowerCase() as FieldKind,
            dataSourceId: this.id,
          }))
          : []
        return {
          id: type.name,
          label: type.name,
          fields,
          dataSourceId: this.id,
        }
      })

    return [...builtinTypes, ...allTypes]
  }
  // getTypes(): Type[] {
  //   return [{
  //     id: 'string',
  //     label: 'String',
  //     dataSourceId: 'eleventy',
  //     fields: [],
  //   }, {
  //     id: 'locale_link',
  //     label: 'locale_link',
  //     dataSourceId: 'eleventy',
  //     fields: [{
  //       id: 'url',
  //       label: 'url',
  //       typeIds: ['string'],
  //       kind: 'scalar',
  //       dataSourceId: 'eleventy',
  //     }, {
  //       id: 'lang',
  //       label: 'lang',
  //       typeIds: ['string'],
  //       kind: 'scalar',
  //       dataSourceId: 'eleventy',
  //     }, {
  //       id: 'label',
  //       label: 'label',
  //       typeIds: ['string'],
  //       kind: 'scalar',
  //       dataSourceId: 'eleventy',
  //     }],
  //   }]
  // }

  getQueryables(): Field[] {
    const query = this.mockData.data.__schema.types
      .find((type: GQLType) => type.name === this.queryType)
    return query.fields
  }

  // getQueryables(): Field[] {
  //   return [{
  //     id: 'page',
  //     label: 'page',
  //     typeIds: ['page'],
  //     kind: 'object',
  //     dataSourceId: 'eleventy',
  //     //}, {
  //     //  id: 'eleventy',
  //     //  label: 'eleventy',
  //     //  typeIds: ['eleventy'],
  //     //  kind: 'object',
  //     //  dataSourceId: 'eleventy',
  //     //}, {
  //     //  id: 'env',
  //     //  label: 'env',
  //     //  typeIds: ['env'],
  //     //  kind: 'object',
  //     //  dataSourceId: 'eleventy',
  //   }]
  // }

  fetchValues(query: string): Promise<unknown[]> {
    console.log('MockDataSource fetchValues called with:', query)
    return Promise.resolve(this.mockData.data)
  }
}

// HTML normalization for comparison
function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

// Get all test case directories
function getTestCaseDirectories(): string[] {
  const sampleDataPath = path.join(__dirname, '..', TESTS_PATH)

  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data not found, ${sampleDataPath} doesn't exist`)
  }

  return fs.readdirSync(sampleDataPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(dirName => {
      const testCasePath = path.join(sampleDataPath, dirName)
      // Check if directory contains all required files
      return fs.existsSync(path.join(testCasePath, 'graphql-response.json')) &&
             fs.existsSync(path.join(testCasePath, 'website.json')) &&
             fs.existsSync(path.join(testCasePath, 'preview.html'))
    })
}

// Load test case data
function loadTestCase(testCaseName: string) {
  const testCasePath = path.join(__dirname, '..', TESTS_PATH, testCaseName)

  const graphqlTypes = JSON.parse(
    fs.readFileSync(path.join(testCasePath, 'graphql-types.json'), 'utf8')
  )

  const graphqlResponse = JSON.parse(
    fs.readFileSync(path.join(testCasePath, 'graphql-response.json'), 'utf8')
  )

  const website = JSON.parse(
    fs.readFileSync(path.join(testCasePath, 'website.json'), 'utf8')
  )

  const expectedHtml = normalizeHtml(fs.readFileSync(
    path.join(testCasePath, 'preview.html'), 'utf8'
  ))

  const dataSourceId = (website.dataSources[0] || {}).id || 'countries'

  return { dataSourceId, graphqlTypes, graphqlResponse, website, expectedHtml }
}

/** --- tiny helpers (no extra deps) --- */
function parseBody(html: string): HTMLElement {
  // Prefer the jsdom test env DOMParser if available; fallback to JSDOM
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(html, 'text/html').body as unknown as HTMLElement
  }
  return new JSDOM(html).window.document.body as unknown as HTMLElement
}

// Normalize: trim text nodes, collapse spaces, sort class names
function normalizeDom(root: HTMLElement) {
  const walker = root.ownerDocument!.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  const toNormalize: Node[] = []
  while (walker.nextNode()) toNormalize.push(walker.currentNode)

  for (const node of toNormalize) {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = (node.nodeValue || '').replace(/\s+/g, ' ').trim()
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      // sort class names (ignore order-only diffs)
      if (el.hasAttribute('class')) {
        const cls = el.getAttribute('class')!
        const sorted = cls.split(/\s+/).filter(Boolean).sort().join(' ')
        el.setAttribute('class', sorted)
      }
      // normalize attribute whitespace (e.g., title, data-*)
      for (const attr of Array.from(el.attributes)) {
        el.setAttribute(attr.name, attr.value.replace(/\s+/g, ' ').trim())
      }
    }
  }
}

// very small prettifier - just adds newlines between tags/text runs for better diffs
function pretty(html: string): string {
  return html
    .replace(/>\s+</g, '><')
    .replace(/</g, '\n<')
    .replace(/\n+/g, '\n')
    .trim()
}

function summarizeGrouped(result: ReturnType<typeof compare>) {
  const grouped = GroupingReporter.getDifferences(result) as Record<string, { message: string }[]>
  const lines: string[] = []
  const PATH_LIMIT = 8
  const MSG_LIMIT = 4
  const paths = Object.keys(grouped)
  for (let i = 0; i < Math.min(paths.length, PATH_LIMIT); i++) {
    const path = paths[i]
    const msgs = grouped[path]
    lines.push(`• ${path}`)
    for (let j = 0; j < Math.min(msgs.length, MSG_LIMIT); j++) {
      lines.push(`  - ${msgs[j].message}`)
    }
    if (msgs.length > MSG_LIMIT) lines.push(`  - …and ${msgs.length - MSG_LIMIT} more at this node`)
  }
  if (paths.length > PATH_LIMIT) lines.push(`…and ${paths.length - PATH_LIMIT} more nodes differ`)
  return lines.join('\n')
}

/** --- drop-in API-compatible function --- */
export function toEqualDom(received: string, expected: string, testCaseName: string) {
  const a = parseBody(received).cloneNode(true) as HTMLElement
  const b = parseBody(expected).cloneNode(true) as HTMLElement

  normalizeDom(a)
  normalizeDom(b)

  const result = compare(a, b, {
    stripSpaces: true,
    collapseSpaces: true,
    normalizeWhitespace: true,
  } as any)

  if (result.getResult()) {
    return { pass: true, message: 'DOMs are equal' }
  }

  // grouped summary (clear, low-noise)
  const groupedSummary = summarizeGrouped(result)

  // compact unified diff of prettified HTML (helps spot exact spot)
  const unified = jestDiff(pretty(b.innerHTML), pretty(a.innerHTML), {
    expand: false,
    contextLines: 1,
  }) || ''

  const message = `
[${testCaseName}] DOMs differ:
${groupedSummary.substring(0, 5000)}

[${testCaseName}] Unified diff (prettified body HTML):
${unified.substring(0, 5000)}
`

  return { pass: false, message }
}

const testCaseDirectories = getTestCaseDirectories()

if (testCaseDirectories?.length === 0) {
  throw new Error(`No test cases found in ${TESTS_PATH}. Create test case directories with graphql-response.json, website.json, and preview.html files.`)
}

describe('Integration tests validation', () => {
  testCaseDirectories.forEach(testCaseName => {
    test(`Validate the data found for ${testCaseName}`, () => {
      const { dataSourceId, graphqlTypes, graphqlResponse, website, expectedHtml } = loadTestCase(testCaseName)

      expect(Array.isArray(graphqlResponse.data?.continents)).toBe(true)

      expect(website.pages).toHaveLength(1)
      expect(website.dataSources).toBeDefined()
      expect(website.dataSources.length <= 1).toBe(true)

      expect(expectedHtml).toMatch(/^<div .*data-gjs-type="wrapper".*>/)

      const mockDataSource = new MockDataSource(dataSourceId, graphqlTypes, graphqlResponse)

      const types = mockDataSource.getTypes()
      expect(Array.isArray(types)).toBe(true)
      expect(types.length).toBeGreaterThan(0)
      expect(types.flatMap(t => t.fields).find(t => t.typeIds.includes('String'))).toBeTruthy()

      const hasFields = types.some(type => Array.isArray(type.fields) && type.fields.length > 0)
      expect(hasFields).toBe(true)

      const continentType = types.find(type => type.id === 'Continent')
      expect(continentType).toBeDefined()
      expect(continentType?.fields.some(f => f.id === 'name')).toBe(true)
      expect(continentType?.fields.some(f => f.id === 'countries')).toBe(true)
      expect(types.find(type => !!type.fields.some(f => f.typeIds.includes('String')))).toBeTruthy()
    })
  })
})

describe('Integration tests', () => {

  testCaseDirectories.forEach(testCaseName => {
    test(`Generated preview for ${ testCaseName }`, (done) => {

      // Load test data
      const { dataSourceId, graphqlTypes, graphqlResponse, website, expectedHtml } = loadTestCase(testCaseName)

      const container = document.createElement('div')
      document.body.appendChild(container)

      // Create GrapesJS editor WITHOUT headless to get real DOM elements
      const editor = grapesjs.init({
        container,
        headless: false,
        plugins: [plugin],
        pluginsOpts: {
          [plugin.toString()]: {
            view: {
              el : null,
              previewRefreshEvents: '', // let me call doRender directly
            },
            filters: 'liquid',
          },
        }
      })

      editor.on('load', () => {
        const dataTree = getDataTreeFromUtils()
        const mockDataSource = new MockDataSource(dataSourceId, graphqlTypes, graphqlResponse)
        addDataSource(mockDataSource)
        editor.loadProjectData(website)
        // Wait longer to account for debounced rendering
        setTimeout(() => {
          dataTree.previewData = {
            [dataSourceId]: graphqlResponse.data,
          }
          const beforePreview = editor.getWrapper()?.view?.el.outerHTML || ''
          doRender(editor, dataTree)
          const actualHtml = editor.getWrapper()?.view?.el.outerHTML || ''
          const previewHtmlDir = process.env.PREVIEW_HTML_OUT_DIR
          if (previewHtmlDir) {
            console.info(`Writting test resuslt to ${path.join(previewHtmlDir, testCaseName + '.html')}`)
            fs.writeFileSync(
              path.join(previewHtmlDir, testCaseName + '.html'),
              actualHtml,
              'utf8',
            )
          }
          done()
          const compared = toEqualDom(actualHtml, expectedHtml, testCaseName)
          if (!compared.pass) {
            console.warn(`
              ${compared.message}
_______________________
before preview: ${beforePreview.substring(0, 500)}
_______________________
expected html: ${expectedHtml.substring(0, 500)}
_______________________
actual html: ${actualHtml.substring(0, 500)}
_______________________
            `)
          }
          expect(compared.pass).toBe(true)

          editor.destroy()
          container.remove()
        }, 100)
      })
    })
  })
})
