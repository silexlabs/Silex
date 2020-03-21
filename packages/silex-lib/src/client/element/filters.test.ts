import { crudIdKey } from '../flux/crud-store';
import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER, ELEM_SECTION_CONTENT, ELEM_HTML } from '../../../__tests__/data-set';
import { initializeElements, getElements } from '../element/store';
import { getParent, isBody, getBody, getChildren, getChildrenRecursive } from '../element/filters';
import { selectBody } from '../element/dispatchers';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_HTML, ELEM_CONTAINER])
})

test('find parent', () => {
  expect(getParent(ELEM_TEXT)).toBe(ELEM_CONTAINER)
  expect(getParent(ELEM_IMAGE)).toBe(ELEM_CONTAINER)
  expect(getParent(ELEM_CONTAINER)).toBeUndefined()
})

test('body', () => {
  expect(isBody(ELEM_TEXT)).toBe(false)
  expect(isBody(ELEM_IMAGE)).toBe(false)
  expect(isBody(ELEM_CONTAINER)).toBe(true)
  expect(getBody()).toBe(ELEM_CONTAINER)
  expect(ELEM_CONTAINER.selected).toBe(false)
})

test('find children', () => {
  const elem3Children = getChildren(ELEM_CONTAINER)
  expect(elem3Children).toHaveLength(3)
  expect(elem3Children[0]).toBe(ELEM_TEXT)
  expect(elem3Children[1]).toBe(ELEM_IMAGE)
  expect(elem3Children[2]).toBe(ELEM_HTML)

  const elem3ChildrenRecursive = getChildrenRecursive(ELEM_CONTAINER)
  expect(elem3ChildrenRecursive).toHaveLength(3)
  expect(elem3ChildrenRecursive[0]).toBe(ELEM_TEXT)
  expect(elem3ChildrenRecursive[1]).toBe(ELEM_IMAGE)
  expect(elem3ChildrenRecursive[2]).toBe(ELEM_HTML)

  const elem4ChildrenRecursive = getChildrenRecursive(ELEM_SECTION_CONTENT)
  expect(elem4ChildrenRecursive).toHaveLength(4)
  expect(elem4ChildrenRecursive[0]).toBe(ELEM_CONTAINER)
  expect(elem4ChildrenRecursive[1]).toBe(ELEM_TEXT)
  expect(elem4ChildrenRecursive[2]).toBe(ELEM_IMAGE)
  expect(elem4ChildrenRecursive[3]).toBe(ELEM_HTML)
})
