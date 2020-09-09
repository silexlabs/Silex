import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER, ELEM_SECTION_CONTENT, ELEM_HTML } from '../../test-utils/data-set'
import { getParent, isBody, getBody, getChildren, getChildrenRecursive, getElementById } from '../element-store/filters'
import { ElementState } from './types'

// in this file we do not use the store, so crudId is not needed, ElementData and ElementState can be used
const ELEM_CONTAINER_STATE = ELEM_CONTAINER as ElementState
const ELEM_IMAGE_STATE = ELEM_IMAGE as ElementState
const ELEM_SECTION_CONTENT_STATE = ELEM_SECTION_CONTENT as ElementState
const ELEM_TEXT_STATE = ELEM_TEXT as ElementState
const ELEM_HTML_STATE = ELEM_HTML as ElementState

const ELEMENTS = [ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_HTML_STATE, ELEM_CONTAINER_STATE]

test('getElementById', () => {
  expect(getElementById(ELEM_TEXT_STATE.id, ELEMENTS)).toBe(ELEM_TEXT_STATE)
  expect(getElementById(ELEM_IMAGE_STATE.id, ELEMENTS)).toBe(ELEM_IMAGE_STATE)
  expect(getElementById(ELEM_CONTAINER_STATE.id, ELEMENTS)).toBe(ELEM_CONTAINER_STATE)
})

test('find parent', () => {
  expect(getParent(ELEM_TEXT_STATE, ELEMENTS).id).toBe(ELEM_CONTAINER_STATE.id)
  expect(getParent(ELEM_IMAGE_STATE, ELEMENTS).id).toBe(ELEM_CONTAINER_STATE.id)
  expect(getParent(ELEM_CONTAINER_STATE, ELEMENTS)).toBeUndefined()
})

test('body', () => {
  expect(isBody(ELEM_TEXT_STATE, ELEMENTS)).toBe(false)
  expect(isBody(ELEM_IMAGE_STATE, ELEMENTS)).toBe(false)
  expect(isBody(ELEM_CONTAINER_STATE, ELEMENTS)).toBe(true)
  expect(getBody(ELEMENTS).id).toBe(ELEM_CONTAINER_STATE.id)
})

test('find children', () => {
  const elem3Children = getChildren(ELEM_CONTAINER_STATE, ELEMENTS)
  expect(elem3Children).toHaveLength(3)
  expect(elem3Children[0]).toBe(ELEM_TEXT_STATE)
  expect(elem3Children[1]).toBe(ELEM_IMAGE_STATE)
  expect(elem3Children[2]).toBe(ELEM_HTML_STATE)

  const elem3ChildrenRecursive = getChildrenRecursive(ELEM_CONTAINER_STATE, ELEMENTS)
  expect(elem3ChildrenRecursive).toHaveLength(3)
  expect(elem3ChildrenRecursive[0]).toBe(ELEM_TEXT_STATE)
  expect(elem3ChildrenRecursive[1]).toBe(ELEM_IMAGE_STATE)
  expect(elem3ChildrenRecursive[2]).toBe(ELEM_HTML_STATE)

  const elem4ChildrenRecursive = getChildrenRecursive(ELEM_SECTION_CONTENT_STATE, ELEMENTS)
  expect(elem4ChildrenRecursive).toHaveLength(4)
  expect(elem4ChildrenRecursive[0]).toBe(ELEM_CONTAINER_STATE)
  expect(elem4ChildrenRecursive[1]).toBe(ELEM_TEXT_STATE)
  expect(elem4ChildrenRecursive[2]).toBe(ELEM_IMAGE_STATE)
  expect(elem4ChildrenRecursive[3]).toBe(ELEM_HTML_STATE)
})

test('getChildrenRecursive', () => {
  expect(getChildrenRecursive(ELEM_TEXT_STATE, ELEMENTS)).toEqual([])
  expect(getChildrenRecursive(ELEM_CONTAINER_STATE, ELEMENTS)).toEqual([ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_HTML])
  expect(getChildrenRecursive(ELEM_SECTION_CONTENT_STATE, ELEMENTS)).toEqual(expect.arrayContaining(ELEMENTS))
  expect(getChildrenRecursive(ELEM_SECTION_CONTENT_STATE, ELEMENTS).map(e => e.id).sort()).toEqual(ELEMENTS.map(e => e.id).sort())

  expect(getChildrenRecursive(ELEM_SECTION_CONTENT_STATE, ELEMENTS).map(e => e.id).sort()).toEqual(ELEMENTS.map(e => e.id).sort())
})
