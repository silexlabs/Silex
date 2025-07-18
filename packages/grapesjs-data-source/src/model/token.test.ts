/**
 * @jest-environment jsdom
 */

import grapesjs, { Component, Editor } from 'grapesjs'
import { Expression } from '../types'
import { getExpressionResultType } from './token'
import { simpleQueryables, simpleTypes, testDataSourceId } from '../test-data'
import { DataTree } from './DataTree'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

let editor: Editor
let firstComponent: Component
beforeEach(async () => {
  jest.resetAllMocks()
  editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div></div>',
  })
  firstComponent = editor.getComponents().first()
})

test('get type with simple context', () => {
  const dataTree = new DataTree(editor as Editor, {
    filters: [],
    dataSources: [{
      id: testDataSourceId,
      connect: async () => { },
      isConnected: () => true,
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })

  // Empty value
  expect(getExpressionResultType([] as Expression, firstComponent, dataTree)).toBeNull()

  // 1 level value
  const type = getExpressionResultType([{
    fieldId: 'testFieldId',
    label: 'test field name',
    type: 'property',
    propType: 'field',
    typeIds: ['testFieldTypeId'],
    dataSourceId: testDataSourceId,
    kind: 'object',
  }], firstComponent, dataTree)
  expect(type).not.toBeNull()
  expect(type?.id).toBe('testFieldId')

  // 2 levels value
  const type2 = getExpressionResultType([{
    fieldId: 'first',
    label: 'test field name',
    type: 'property',
    propType: 'field',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'second',
    label: 'test field name',
    typeIds: ['testFieldTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }], firstComponent, dataTree)
  expect(type2).not.toBeNull()
  expect(type2?.id).toBe('second')
})
