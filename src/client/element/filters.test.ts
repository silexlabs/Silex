import { crudIdKey } from '../flux/crud-store';
import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER, ELEM_SECTION_CONTENT, ELEM_HTML } from '../../../__tests__/data-set';
import { initializeElements, getElements } from '../element/store';
import { getParent, isBody, getBody, getChildren, getChildrenRecursive } from '../element/filters';
import { selectBody } from '../element/dispatchers';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_HTML, ELEM_CONTAINER])
})

test('find parent', () => {
  expect(getParent(ELEM_TEXT).id).toBe(ELEM_CONTAINER.id)
  expect(getParent(ELEM_IMAGE).id).toBe(ELEM_CONTAINER.id)
  expect(getParent(ELEM_CONTAINER)).toBeUndefined()
})

test('body', () => {
  expect(isBody(ELEM_TEXT)).toBe(false)
  expect(isBody(ELEM_IMAGE)).toBe(false)
  expect(isBody(ELEM_CONTAINER)).toBe(true)
  expect(getBody().id).toBe(ELEM_CONTAINER.id)
  expect(ELEM_CONTAINER.selected).toBe(false)
})

test('find children', () => {
  const elem3Children = getChildren(ELEM_CONTAINER)
  expect(elem3Children).toHaveLength(3)
  expect(elem3Children[0].id).toBe(ELEM_TEXT.id)
  expect(elem3Children[1].id).toBe(ELEM_IMAGE.id)
  expect(elem3Children[2].id).toBe(ELEM_HTML.id)

  const elem3ChildrenRecursive = getChildrenRecursive(ELEM_CONTAINER)
  expect(elem3ChildrenRecursive).toHaveLength(3)
  expect(elem3ChildrenRecursive[0].id).toBe(ELEM_TEXT.id)
  expect(elem3ChildrenRecursive[1].id).toBe(ELEM_IMAGE.id)
  expect(elem3ChildrenRecursive[2].id).toBe(ELEM_HTML.id)

  const elem4ChildrenRecursive = getChildrenRecursive(ELEM_SECTION_CONTENT)
  expect(elem4ChildrenRecursive).toHaveLength(4)
  expect(elem4ChildrenRecursive[0].id).toBe(ELEM_CONTAINER.id)
  expect(elem4ChildrenRecursive[1].id).toBe(ELEM_TEXT.id)
  expect(elem4ChildrenRecursive[2].id).toBe(ELEM_IMAGE.id)
  expect(elem4ChildrenRecursive[3].id).toBe(ELEM_HTML.id)
})
