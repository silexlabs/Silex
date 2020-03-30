import { ELEM_CONTAINER, ELEM_IMAGE, ELEM_TEXT, PAGE1, ELEM_CONTAINER_2_CHILDREN, ELEM_HTML } from '../../../__tests__/data-set'
import { getElementById } from '../element/filters'
import { initializeElements } from '../element/store'
import { addElement, moveElements, selectBody, selectElements } from './dispatchers'
import { DomDirection, ElementType } from './types'
import { PageData } from '../page/types'
import { initializePages } from '../page/store'

jest.mock('../../../node_modules/sortablejs/modular/sortable.core.esm.js', () => jest.fn());

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])
  initializePages([PAGE1])
})

test('select elements', () => {
  initializeElements([{
    ...ELEM_TEXT,
    selected: true,
  }, ELEM_IMAGE, ELEM_CONTAINER])
  expect(getElementById(ELEM_TEXT.id).selected).toBe(true)
  expect(getElementById(ELEM_IMAGE.id).selected).toBe(false)
  expect(getElementById(ELEM_CONTAINER.id).selected).toBe(false)
  selectBody()
  expect(getElementById(ELEM_TEXT.id).selected).toBe(false)
  expect(getElementById(ELEM_IMAGE.id).selected).toBe(false)
  expect(getElementById(ELEM_CONTAINER.id).selected).toBe(true)
  selectElements([getElementById(ELEM_TEXT.id), getElementById(ELEM_IMAGE.id)])
  expect(getElementById(ELEM_TEXT.id).selected).toBe(true)
  expect(getElementById(ELEM_IMAGE.id).selected).toBe(true)
  expect(getElementById(ELEM_CONTAINER.id).selected).toBe(false)
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

test('add element', () => {
  const [element, updatedParentData] = addElement({
    type: ElementType.HTML,
    parent: ELEM_CONTAINER,
    componentName: null,
    style: {
      mobile: {},
      desktop: {
        top: '450px',
        left: '450px',
      },
    },
  })
  expect(element).not.toBeNull()
  expect(element.selected).toBe(true)
  expect(element.style.desktop).not.toBeNull()
  expect(element.style.desktop.top).toBe('450px')
  expect(element.style.desktop.left).toBe('450px')

  expect(updatedParentData.id).toBe(ELEM_CONTAINER.id)
  expect(updatedParentData.innerHtml).toBe(ELEM_CONTAINER.innerHtml)
  expect(updatedParentData.pageNames).toBe(ELEM_CONTAINER.pageNames)
  expect(updatedParentData.selected).toBe(false)
  expect(updatedParentData.style).toEqual(ELEM_CONTAINER.style)
  expect(updatedParentData.children).not.toBe(ELEM_CONTAINER.children)
  expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER.children.length + 1)
  expect(updatedParentData.children).toContain(element.id)
})
