import { ELEM_CONTAINER, ELEM_IMAGE, ELEM_TEXT, ELEM_SECTION, ELEM_SECTION_CONTENT, ELEM_CONTAINER_2_CHILDREN, ELEM_HTML } from '../../../__tests__/data-set';
import { getElementById } from '../element/filters';
import { initializeElements } from '../element/store';
import { selectBody, moveElements } from './dispatchers';
import { DomDirection } from './types'

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])
})

test('select body', () => {
  initializeElements([{
    ...ELEM_TEXT,
    selected: true,
  }, ELEM_IMAGE, ELEM_CONTAINER])
  expect(getElementById(ELEM_TEXT.id).selected).toBe(true)
  expect(getElementById(ELEM_CONTAINER.id).selected).toBe(false)
  selectBody()
  expect(getElementById(ELEM_TEXT.id).selected).toBe(false)
  expect(getElementById(ELEM_CONTAINER.id).selected).toBe(true)
})

test('move 1 element', () => {
  expect(ELEM_CONTAINER.children[0]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_IMAGE.id)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT], DomDirection.UP)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT], DomDirection.TOP)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT], DomDirection.BOTTOM)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_TEXT.id)
})

test('move 2 elements among 2', () => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER_2_CHILDREN])
  expect(ELEM_CONTAINER.children[0]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_IMAGE, ELEM_TEXT], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
})

test('move 2 elements among 3', () => {
  expect(ELEM_CONTAINER.children[0]).toBe(ELEM_TEXT.id)
  moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_HTML.id)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_IMAGE.id)
  moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.DOWN)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_HTML.id)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_IMAGE.id)
  moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.UP)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_IMAGE.id)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_HTML.id)
  moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.BOTTOM)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_HTML.id)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_IMAGE.id)
  moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.TOP)
  expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
  expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_IMAGE.id)
  expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_HTML.id)
})
