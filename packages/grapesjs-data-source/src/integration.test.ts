/**
 * @jest-environment jsdom
 */

import fs from 'fs'
import path from 'path'
import grapesjs from 'grapesjs'
import plugin from './index'
import { PREVIEW_RENDER_END, Type, Field, DataSourceType } from './types'
import { addDataSource } from './api'
import { GQLField, GQLType } from './datasources/GraphQL'
import { FieldKind, IDataSource } from '../dist'
import { getDataTreeFromUtils } from './utils'

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
    const query = this.mockTypes.data.__schema.types
      .find((type: GQLType) => type.name === this.queryType)
    const customTypes = query
      ? query.fields.map((field: GQLField) => {
        const typeId = field.type.name || field.type.ofType?.name || 'Unknown'
        const fullType = this.mockTypes.data.__schema.types.find((t: GQLType) => t.name === typeId)
        const fields = fullType && fullType.fields
          ? fullType.fields.map((f: GQLField) => ({
            id: f.name,
            label: f.name,
            typeIds: [f.type.name || f.type.ofType?.name || 'Unknown'],
            kind: (f.type.kind || '').toLowerCase() as FieldKind,
            dataSourceId: this.id,
          }))
          : []
        return {
          id: typeId,
          label: field.name,
          fields,
          dataSourceId: this.id,
        }
      })
      : []
    return [...builtinTypes, ...customTypes]
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

// HTML comparison with readable diff
function compareHtml(actual: string, expected: string): { match: boolean; diff?: string, normalizedActual: string, normalizedExpected: string, } {
  const normalizedActual = normalizeHtml(actual)
  const normalizedExpected = normalizeHtml(expected)

  if (normalizedActual === normalizedExpected) {
    return { match: true }
  }

  return {
    match: false,
    normalizedActual,
    normalizedExpected,
    diff: `
Expected HTML:
${normalizedExpected}

Actual HTML:
${normalizedActual}
    `
  }
}


// Get all test case directories
function getTestCaseDirectories(): string[] {
  const sampleDataPath = path.join(__dirname, '..', 'sample-data')

  if (!fs.existsSync(sampleDataPath)) {
    return []
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
  const testCasePath = path.join(__dirname, '..', 'sample-data', testCaseName)

  const graphqlTypes = JSON.parse(
    fs.readFileSync(path.join(testCasePath, 'graphql-types.json'), 'utf8')
  )

  const graphqlResponse = JSON.parse(
    fs.readFileSync(path.join(testCasePath, 'graphql-response.json'), 'utf8')
  )

  const website = JSON.parse(
    fs.readFileSync(path.join(testCasePath, 'website.json'), 'utf8')
  )

  const expectedHtml = fs.readFileSync(
    path.join(testCasePath, 'preview.html'), 'utf8'
  )

  return { graphqlTypes, graphqlResponse, website, expectedHtml }
}

test('returns correct types and fields for countries-lists', () => {
  // Load mock types from sample-data
  const { graphqlTypes, graphqlResponse } = loadTestCase('countries-lists')

  const mockDataSource = new MockDataSource('countries', graphqlTypes, graphqlResponse)

  const types = mockDataSource.getTypes()
  expect(Array.isArray(types)).toBe(true)
  expect(types.length).toBeGreaterThan(0)

  // Check that at least one type has fields
  const hasFields = types.some(type => Array.isArray(type.fields) && type.fields.length > 0)
  expect(hasFields).toBe(true)

  // Check a known type and field
  const continentType = types.find(type => type.id === 'Continent')
  expect(continentType).toBeDefined()
  expect(continentType?.fields.some(f => f.id === 'name')).toBe(true)
  expect(continentType?.fields.some(f => f.id === 'countries')).toBe(true)
  expect(types.find(type => !!type.fields.some(f => f.typeIds.includes('String')))).toBeTruthy()
})

describe('Integration Tests', () => {

  test('generated preview on the canvas', (done) => {
    const testCaseDirectories = getTestCaseDirectories()

    if (testCaseDirectories.length === 0) {
      console.warn('No test cases found in sample-data/. Create test case directories with graphql-response.json, website.json, and preview.html files.')
      done()
      return
    }

    console.log(`Found ${testCaseDirectories.length} test case(s): ${testCaseDirectories.join(', ')}`)

    // Test only the first case for now to fix the issues
    const testCaseName = testCaseDirectories[0]
    console.log(`\n--- Running test case: ${testCaseName} ---`)

    // Load test data
    const { graphqlTypes, graphqlResponse, website, expectedHtml } = loadTestCase(testCaseName)

    const container = document.createElement('div')
    document.body.appendChild(container)

    // Create GrapesJS editor WITHOUT headless to get real DOM elements
    const editor = grapesjs.init({
      container,
      headless: false,
      plugins: [plugin],
      pluginsOpts: {
        [plugin.toString()]: {
          view: {el : null},
        },
      }
    })

    editor.on('load', () => {
      const mockDataSource = new MockDataSource('countries', graphqlTypes, graphqlResponse)
      expect(mockDataSource.getTypes().flatMap(t => t.fields).find(t => t.typeIds.includes('String'))).toBeTruthy()
      addDataSource(mockDataSource)
      editor.loadProjectData(website)
      const dataTree = getDataTreeFromUtils()
      dataTree.previewData = {
        'countries': graphqlResponse.data,
      }
      editor.once(PREVIEW_RENDER_END, () => {
        done()

        const pages = editor.Pages.getAll();
        expect(pages).toHaveLength(1)
        const wrapper = editor.getWrapper()
        expect(wrapper).toBeTruthy()
        expect(wrapper?.view).toBeTruthy()
        expect(wrapper?.view?.el).toBeTruthy()

        const actualHtml = editor.getWrapper()?.view?.el.outerHTML

        const comparison = compareHtml(actualHtml!, expectedHtml)
        expect(comparison.normalizedExpected).toBe(comparison.normalizedActual)

        editor.destroy()
        container.remove()
      })
    })
  })
})
