import { StoredState } from '@silexlabs/grapesjs-data-source'

/**
 * This expression generates the GraphQL query:
 * ```
 * query {
 *   language(code: 'fr') {
 *     name
 *   }
 * }
 * ```
 */
export const simpleExpression = {
  'expression': [
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'language',
      'label': 'language',
      'typeIds': [
        'Language'
      ],
      'dataSourceId': 'countries',
      'kind': 'object',
    },
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'name',
      'label': 'name',
      'typeIds': [
        'String'
      ],
      'dataSourceId': 'countries',
      'kind': 'scalar'
    }
  ]
} as StoredState

export const expressionWithState = {
  'expression': [
    {
      'type': 'state',
      'storedStateId': '__data',
      'componentId': 'c685',
      'exposed': false,
      'forceKind': 'object',
      'label': 'loop item'
    },
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'code',
      'label': 'code',
      'typeIds': [
        'ID'
      ],
      'dataSourceId': 'countries',
      'kind': 'scalar'
    }
  ]
} as StoredState

export const expressionWithFirst = {
  expression: [
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'continent',
      'label': 'continent',
      'typeIds': [
        'Continent'
      ],
      'dataSourceId': 'countries',
      'kind': 'object',
      'options': {
        'code': 'TR',
      }
    },
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'countries',
      'label': 'countries',
      'typeIds': [
        'Country'
      ],
      'dataSourceId': 'countries',
      'kind': 'list'
    },
    {
      'type': 'filter',
      'id': 'first',
      'label': 'first',
      'options': {}
    },
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'name',
      'label': 'name',
      'typeIds': [
        'String'
      ],
      'dataSourceId': 'countries',
      'kind': 'scalar',
      'options': {
        'lang': 'EN'
      }
    }
  ]
} as StoredState

export const expressionList = {
  expression: [
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'continent',
      'label': 'continent',
      'typeIds': [
        'Continent'
      ],
      'dataSourceId': 'countries',
      'kind': 'object',
      'options': {
        'code': 'TR',
      }
    },
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'countries',
      'label': 'countries',
      'typeIds': [
        'Country'
      ],
      'dataSourceId': 'countries',
      'kind': 'list'
    },
  ]
} as StoredState

export const expressionListWithWhere = {
  expression: [
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'continent',
      'label': 'continent',
      'typeIds': [
        'Continent'
      ],
      'dataSourceId': 'countries',
      'kind': 'object',
      'options': {
        'code': 'TR',
      }
    },
    {
      'type': 'property',
      'propType': 'field',
      'fieldId': 'countries',
      'label': 'countries',
      'typeIds': [
        'Country'
      ],
      'dataSourceId': 'countries',
      'kind': 'list'
    },
    {
      'type': 'filter',
      'id': 'where',
      'label': 'where',
      'options': {
        'key': 'lang',
        'value': 'FR'
      }
    }
  ]
} as StoredState
