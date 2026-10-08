import { Field, Type } from '../types'
import { SchemaLookup, expressionToPath, parsePath, resolvePath } from './path'

const field = (id: string, typeIds: string[], kind: Field['kind'], args: string[] = []): Field => ({
  id, label: id, typeIds, kind, dataSourceId: 'wp',
  arguments: args.map(name => ({ name, typeId: 'Int' })),
})

const types: Type[] = [
  { id: 'RootQueryToPostConnection', label: '', fields: [field('nodes', ['Post'], 'list'), field('pageInfo', ['PageInfo'], 'object')] },
  { id: 'Post', label: '', fields: [field('title', ['String'], 'scalar'), field('featuredImage', ['Edge'], 'object'), field('author', ['User', 'Bot'], 'object')] },
  { id: 'Edge', label: '', fields: [field('node', ['MediaItem'], 'object')] },
  { id: 'MediaItem', label: '', fields: [field('sourceUrl', ['String'], 'scalar')] },
  { id: 'User', label: '', fields: [field('name', ['String'], 'scalar')] },
  { id: 'Bot', label: '', fields: [field('model', ['String'], 'scalar')] },
]

const lookup: SchemaLookup = {
  queryables: () => [field('posts', ['RootQueryToPostConnection'], 'object', ['first', 'where'])],
  type: id => types.find(type => type.id === id),
  secondary: ['pageInfo'],
}

test('paths become the tokens the editor stores, and back', () => {
  const { tokens, field: last } = resolvePath(parsePath('wp.posts(first: 3, where: {search: "a, b"}).nodes').slice(1), null, 'wp', lookup)
  expect(tokens.map(t => [t.fieldId, t.typeIds, t.kind, t.options])).toEqual([
    ['posts', ['RootQueryToPostConnection'], 'object', { first: '3', where: '{search: "a, b"}' }],
    ['nodes', ['Post'], 'list', undefined],
  ])
  expect(last.kind).toBe('list')
  expect(expressionToPath(tokens, t => String(t.dataSourceId))).toBe('wp.posts(first: 3, where: {search: "a, b"}).nodes')
  expect(parsePath('ds-0.posts')[0].name).toBe('ds-0')

  const item = field('nodes', ['Post'], 'object')
  expect(resolvePath(parsePath('item.featuredImage.node.sourceUrl').slice(1), item, 'item', lookup).tokens.map(t => t.fieldId))
    .toEqual(['featuredImage', 'node', 'sourceUrl'])
  expect(resolvePath(parsePath('item.author.model').slice(1), item, 'item', lookup).tokens[0].typeIds).toEqual(['Bot'])
})

test('paths that cannot work say what to do', () => {
  expect(() => resolvePath(parsePath('wp.posts.nodes.title').slice(1), null, 'wp', lookup)).toThrow('wp.posts.nodes is a list')
  expect(() => resolvePath(parsePath('wp.posts.nodez').slice(1), null, 'wp', lookup)).toThrow('No field "nodez" on RootQueryToPostConnection. Fields: nodes.')
  expect(() => resolvePath(parsePath('wp.posts(limit: 3)').slice(1), null, 'wp', lookup)).toThrow('Arguments: first, where')
  expect(() => parsePath('wp.posts(first: 3')).toThrow('Unclosed (')
  expect(() => parsePath('wp.posts(where: {search: "${x}"}).nodes')).toThrow('cannot contain')
})
