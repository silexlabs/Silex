/**
 * @jest-environment jsdom
 */

import grapesjs, { Editor } from 'grapesjs'
import { getTrees } from './ExpressionTree'
import { setState } from './state'
import { FIXED_TOKEN_ID, Property, Filter, State, Tree, Type } from '../types'
import { DataSourceManagerState } from './dataSourceManager'

// Mock lit to avoid ES module import issues (same workaround as the other tests)
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

const DS = 'ds1'

// Minimal schema so isRelative() can tell that `name`/`code` are fields of `Country`
const types: Type[] = [
  {
    id: 'Country',
    label: 'Country',
    fields: [
      { id: 'name', label: 'name', typeIds: ['String'], kind: 'scalar', dataSourceId: DS },
      { id: 'code', label: 'code', typeIds: ['ID'], kind: 'scalar', dataSourceId: DS },
    ],
    dataSourceId: DS,
  },
  { id: 'String', label: 'String', fields: [], dataSourceId: DS },
  { id: 'ID', label: 'ID', fields: [], dataSourceId: DS },
]

function mockManager(): DataSourceManagerState {
  const editor = { runCommand: jest.fn() } as unknown as Editor
  const dataSources = [{
    id: DS,
    isConnected: () => true,
    getTypes: () => types,
  }] as unknown as DataSourceManagerState['dataSources']
  return { editor, dataSources } as unknown as DataSourceManagerState
}

// Token builders --------------------------------------------------------------
const prop = (fieldId: string, typeId: string, kind: 'scalar' | 'list' | 'object' = 'scalar'): Property =>
  ({ type: 'property', propType: 'field', dataSourceId: DS, fieldId, label: fieldId, typeIds: [typeId], kind })
const countries = prop('countries', 'Country', 'list')
const name = prop('name', 'String')
const code = prop('code', 'ID')
const fixed: Property =
  ({ type: 'property', propType: 'field', fieldId: FIXED_TOKEN_ID, label: 'Fixed value', kind: 'scalar', typeIds: ['String'], options: { value: 'x' } })
const filter = (id: string, options: Record<string, unknown>): Filter =>
  ({ type: 'filter', id, label: id, options, quotedOptions: ['key'], optionsKeys: ['key', 'value'] } as Filter)

// Turn the tree into a compact {id, children} shape for assertions
const flatten = (trees: Tree[]): unknown[] =>
  trees.map(t => ({ id: t.token.fieldId ?? (t.token as unknown as { id: string }).id, children: flatten(t.children) }))

function comp(): { editor: Editor, component: ReturnType<Editor['getWrapper']> } {
  const editor = grapesjs.init({ container: document.createElement('div'), components: '<div id="c"></div>' }) as Editor
  const component = editor.Components.getById('c')
  return { editor, component: component as unknown as ReturnType<Editor['getWrapper']> }
}

// -----------------------------------------------------------------------------

test('normal property chain: countries -> name is nested', () => {
  const { component } = comp()
  const trees = getTrees(mockManager(), { expression: [countries, name], component }, DS)
  expect(flatten(trees)).toEqual([{ id: 'countries', children: [{ id: 'name', children: [] }] }])
})

test('fields referenced inside a filter option are collected (append suffix)', () => {
  const { component } = comp()
  // "" | append: (countries -> name)  — the field lives ONLY inside the filter option
  const append = filter('append', { value: JSON.stringify([countries, name]) })
  const trees = getTrees(mockManager(), { expression: [fixed, append], component }, DS)
  // The leading Fixed token must not drop the expression; name must be queried
  expect(flatten(trees)).toEqual([{ id: 'countries', children: [{ id: 'name', children: [] }] }])
})

test('where key field is collected as a child of the list', () => {
  const { component } = comp()
  const where = filter('where', { key: JSON.stringify([code]), value: JSON.stringify([fixed]) })
  const trees = getTrees(mockManager(), { expression: [countries, where], component }, DS)
  expect(flatten(trees)).toEqual([{ id: 'countries', children: [{ id: 'code', children: [] }] }])
})

test('tokens after a resolved state are not dropped (loop item -> name)', () => {
  const { editor, component } = comp()
  component.set('id-plugin-data-source', 'loop-1')
  // The component is a loop over countries
  setState(component, '__data', { label: 'loop', expression: [countries] }, false)
  const loopItem: State = { type: 'state', storedStateId: '__data', componentId: 'loop-1', exposed: false, label: 'Loop item' } as State
  // Loop item -> name : `name` follows the state token and must be kept
  const trees = getTrees(mockManager(), { expression: [loopItem, name], component }, DS)
  expect(flatten(trees)).toEqual([{ id: 'countries', children: [{ id: 'name', children: [] }] }])
  editor.destroy()
})

test('a token of another data source is skipped, not fatal', () => {
  const { component } = comp()
  const otherDsField = { ...prop('foo', 'String'), dataSourceId: 'other-ds' } as Property
  // Building trees for DS from an expression that starts with another source's token
  const trees = getTrees(mockManager(), { expression: [otherDsField, countries], component }, DS)
  // otherDsField is skipped; countries (this source) is still collected
  expect(flatten(trees)).toEqual([{ id: 'countries', children: [] }])
})
