import { DomDirection, ElementType } from './types'
import {
  ELEM_CONTAINER,
  ELEM_CONTAINER_2_CHILDREN,
  ELEM_HTML,
  ELEM_IMAGE,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
  PAGE1
} from '../../test-utils/data-set';
import { addElement, moveElements, selectBody, selectElements } from './dispatchers'
import { getElementById } from '../element-store/filters'
import { initializeElements, fromElementData } from '../element-store/index'
import { initializePages, fromPageData } from '../page-store/index'
import { isBody } from './filters';

jest.mock('../../../../node_modules/sortablejs/modular/sortable.core.esm.js', () => jest.fn());

beforeEach(() => {
  initializePages(fromPageData([PAGE1]))
})

test('select elements', () => {
  initializeElements(fromElementData([{
    ...ELEM_TEXT,
    selected: true,
  }, ELEM_IMAGE, ELEM_CONTAINER]))

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

// test('move 1 element', () => {
//   initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])

//   expect(ELEM_CONTAINER.children[0]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_IMAGE.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT], DomDirection.UP)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT], DomDirection.TOP)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT], DomDirection.BOTTOM)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_TEXT.id)
// })

// test('move 2 elements among 2', () => {
//   initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER_2_CHILDREN])

//   expect(ELEM_CONTAINER.children[0]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_IMAGE, ELEM_TEXT], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
// })

// test('move 2 elements among 3', () => {
//   initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])

//   expect(ELEM_CONTAINER.children[0]).toBe(ELEM_TEXT.id)
//   moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_HTML.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_IMAGE.id)
//   moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.DOWN)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_HTML.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_IMAGE.id)
//   moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.UP)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_IMAGE.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_HTML.id)
//   moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.BOTTOM)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_HTML.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_TEXT.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_IMAGE.id)
//   moveElements([ELEM_TEXT, ELEM_IMAGE], DomDirection.TOP)
//   expect(getElementById(ELEM_CONTAINER.id).children[0]).toBe(ELEM_TEXT.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[1]).toBe(ELEM_IMAGE.id)
//   expect(getElementById(ELEM_CONTAINER.id).children[2]).toBe(ELEM_HTML.id)
// })

// test('add element', () => {
//   const [element, updatedParentData] = addElement({
//     type: ElementType.HTML,
//     parent: getElementById(ELEM_CONTAINER.id),
//     componentName: null,
//     style: {
//       mobile: {},
//       desktop: {
//         top: '450px',
//         left: '450px',
//       },
//     },
//   })
//   expect(element).not.toBeNull()
//   expect(element.selected).toBe(true)
//   expect(element.style.desktop).not.toBeNull()
//   expect(element.style.desktop.top).toBe('450px')
//   expect(element.style.desktop.left).toBe('450px')

//   expect(updatedParentData.id).toBe(ELEM_CONTAINER.id)
//   expect(updatedParentData.innerHtml).toBe(ELEM_CONTAINER.innerHtml)
//   expect(updatedParentData.pageNames).toBe(ELEM_CONTAINER.pageNames)
//   expect(updatedParentData.selected).toBe(false)
//   expect(updatedParentData.style).toEqual(ELEM_CONTAINER.style)
//   expect(updatedParentData.children).not.toBe(ELEM_CONTAINER.children)
//   expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER.children.length + 1)
//   expect(updatedParentData.children).toContain(element.id)

// })

// test('add a section in a selected element', () => {
//   const selectedContainer = {
//     ...ELEM_CONTAINER,
//     selected: true,
//   }
//   initializeElements([ELEM_TEXT, ELEM_IMAGE, selectedContainer, ELEM_SECTION_CONTENT])
//   const [element, updatedParentData] = addElement({
//     type: ElementType.HTML,
//     parent: getElementById(selectedContainer.id),
//     componentName: null,
//     style: {
//       mobile: {},
//       desktop: {},
//     },
//   })
//   expect(element).not.toBeNull()
//   expect(element.selected).toBe(true)
//   expect(element.style.desktop).not.toBeNull()

//   expect(updatedParentData.id).toBe(ELEM_CONTAINER.id)
//   expect(updatedParentData.selected).toBe(false)
//   expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER.children.length + 1)
//   expect(updatedParentData.children).toContain(element.id)
// })

// test('add a section', () => {
//   initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER, ELEM_SECTION_CONTENT])
//   // add a section in a container
//   expect(() => {
//     addElement({
//       type: ElementType.SECTION,
//       parent: getElementById(ELEM_CONTAINER.id),
//       componentName: null,
//       style: {
//         mobile: {},
//         desktop: {},
//       },
//     })
//   }).toThrow()

//   // add a section in the body
//   initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER]) // here ELEM_CONTAINER has no parent => it is considered the body
//   expect(isBody(ELEM_CONTAINER)).toBe(true)
//   const [element, updatedParentData] = addElement({
//     type: ElementType.SECTION,
//     parent: getElementById(ELEM_CONTAINER.id),
//     componentName: null,
//     style: {
//       mobile: {},
//       desktop: {},
//     },
//   })
//   expect(element).not.toBeNull()
//   expect(element.selected).toBe(true)
//   expect(element.style.desktop.top).toBeUndefined()
//   expect(element.style.desktop.left).toBeUndefined()
//   expect(element.style.desktop.height).toBeUndefined()
//   expect(element.style.desktop.width).toBeUndefined()

//   const sectionContent = getElementById(element.children[0])
//   expect(sectionContent).not.toBeNull()
//   expect(sectionContent.selected).toBe(false)
//   expect(sectionContent.style.desktop.top).toBeUndefined()
//   expect(sectionContent.style.desktop.left).toBeUndefined()
//   expect(sectionContent.style.desktop.height).toBe('100px')
//   expect(sectionContent.style.desktop.width).toBeUndefined()

//   expect(updatedParentData.id).toBe(ELEM_CONTAINER.id)
//   expect(updatedParentData.innerHtml).toBe(ELEM_CONTAINER.innerHtml)
//   expect(updatedParentData.pageNames).toBe(ELEM_CONTAINER.pageNames)
//   expect(updatedParentData.selected).toBe(false)
//   expect(updatedParentData.style).toEqual(ELEM_CONTAINER.style)
//   expect(updatedParentData.children).not.toBe(ELEM_CONTAINER.children)
//   expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER.children.length + 1)
//   expect(updatedParentData.children).toContain(element.id)
// })
