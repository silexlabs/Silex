import { DataSourceId, Field, Filter, Token, Type } from "./types"

export async function importDataSource(datas?: unknown[]) {
  if (datas?.length) {
    global.fetch = jest.fn()
    datas?.forEach(data => {
      global.fetch = (global.fetch as jest.Mock)
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        })
      })
    })
  }
  // @ts-ignore
  return (await import('./datasources/GraphQL')).default.default // Why default.default?
}

export const testDataSourceId: DataSourceId = 'testDataSourceId'

export const testTokens: Record<string, Token> = {
  rootField1: {
    type: 'property',
    propType: 'field',
    fieldId: 'rootField1',
    label: 'test',
    typeIds: ['rootTypeId1'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  },
  filter: {
    type: 'filter',
    id: 'filterId',
    label: 'filter name',
    validate: () => true,
    output: () => null,
    apply: () => null,
    options: {},
    quotedOptions: [],
  },
  rootField2: {
    type: 'property',
    propType: 'field',
    fieldId: 'rootField2',
    label: 'test',
    typeIds: ['rootTypeId2'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  },
  childField1: {
    type: 'property',
    propType: 'field',
    fieldId: 'childField1',
    label: 'test',
    typeIds: ['childTypeId1'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  },
  childField2: {
    type: 'property',
    propType: 'field',
    fieldId: 'childField2',
    label: 'test',
    typeIds: ['childTypeId2'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  },
  childField3: {
    type: 'property',
    propType: 'field',
    fieldId: 'childField3',
    label: 'test',
    typeIds: ['childTypeId3'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  },
}

export const simpleFilters: Filter[] = [{
  type: 'filter',
  id: 'testFilterAnyInput',
  label: 'test filter any input',
  validate: type => !type, // Just for empty expressions
  output: () => null,
  quotedOptions: [],
  options: {},
  apply: jest.fn(),
}, {
  type: 'filter',
  id: 'testFilterId',
  label: 'test filter name',
  validate: type => !!type?.typeIds.includes('testTypeId'),
  output: type => type!,
  quotedOptions: [],
  options: {},
  apply: jest.fn(),
}, {
  type: 'filter',
  id: 'testFilterId2',
  label: 'test filter name 2',
  validate: type => !!type?.typeIds.includes('testFieldTypeId'),
  output: () => null,
  quotedOptions: [],
  options: {},
  apply: jest.fn(),
}]

export const simpleTypes: Type[] = [{
  id: 'testTypeId',
  label: 'test type name',
  fields: [
    {
      id: 'testFieldId',
      label: 'test field name',
      typeIds: ['testFieldTypeId'],
      kind: 'scalar',
      dataSourceId: testDataSourceId,
    }
  ],
  dataSourceId: testDataSourceId,
}, {
  id: 'testFieldTypeId',
  label: 'test field type name',
  fields: [],
  dataSourceId: testDataSourceId,
}]

export const simpleQueryables: Field[] = [{
  id: 'testSimpleQueryableId',
  label: 'test queryable',
  typeIds: ['testTypeId'],
  kind: 'scalar',
  dataSourceId: testDataSourceId,
}]
