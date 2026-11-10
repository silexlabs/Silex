/*
 * @jest-environment jsdom
 */

import { beforeEach, expect, jest, test } from '@jest/globals'
import { Expression } from '@silexlabs/grapesjs-data-source'
import type { Component } from 'grapesjs'
import { getTeraExpression, resetTeraVariables, teraString } from './tera'

jest.mock('lit-html', () => ({}))

const COMPONENT = { getId: () => 'body', get: () => ({}) } as unknown as Component

const field = (fieldId: string, dataSourceId?: string) => ({ type: 'property', propType: 'field', fieldId, label: fieldId, kind: 'scalar', typeIds: ['String'], dataSourceId })
const state = (storedStateId: string) => ({ type: 'state', storedStateId, componentId: 'body', exposed: true, label: storedStateId })

beforeEach(resetTeraVariables)

test('Strings escaped for Tera, which has no \\u escape', () => {
  expect(teraString('a"b\\c\nd\te')).toBe('"a\\"b\\\\c\\nd\\te"')
  expect(teraString('a\u0001b')).toBe('"a\u0001b"')
})

test('A missing field gives the fallback, 0 and false stay', () => {
  expect(getTeraExpression(COMPONENT, [field('post', 'wp'), field('title')] as Expression, '""')).toEqual({
    prefix: '{% set silex_0 = ds_wp?.post?.title | default(value=none) %}{% if silex_0 is none %}{% set silex_0 = "" %}{% endif %}',
    value: 'silex_0',
  })
})

test('Fields which are not Tera identifiers', () => {
  expect(getTeraExpression(COMPONENT, [state('item'), field('true'), field('a-b')] as Expression, '""').prefix)
    .toContain('state_body_item?["true"]?["a-b"]')
})

test('Names of variables start again at each publication', () => {
  getTeraExpression(COMPONENT, [field('post', 'wp')] as Expression, '""')
  resetTeraVariables()
  expect(getTeraExpression(COMPONENT, [field('post', 'wp')] as Expression, '""').value).toBe('silex_0')
})
