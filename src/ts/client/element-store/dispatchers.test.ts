import { DomDirection, ElementType, ElementState } from './types'
import {
  ELEM_CONTAINER,
  ELEM_CONTAINER_2_CHILDREN,
  ELEM_HTML,
  ELEM_IMAGE,
  ELEM_SECTION,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
} from '../../test-utils/data-set'
import { PageState } from '../page-store/types'
import {
  addElement,
  moveElements,
  removeFromPage,
  removeElementsWithoutConfirm,
  selectBody,
  selectElements
} from './dispatchers'
import { fromElementData } from './'
import { getElementById } from '../element-store/filters'
import { initializeElements } from '../element-store/index'
import { isBody } from './filters'
import { store } from '../store'

jest.mock('../../../../node_modules/sortablejs/modular/sortable.core.esm.js', () => jest.fn())

// in this file we do not use the store, so crudId is not needed, ElementData and ElementState can be used
const ELEM_CONTAINER_STATE = ELEM_CONTAINER as ElementState
const ELEM_CONTAINER_2_CHILDREN_STATE = ELEM_CONTAINER_2_CHILDREN as ElementState
const ELEM_HTML_STATE = ELEM_HTML as ElementState
const ELEM_IMAGE_STATE = ELEM_IMAGE as ElementState
const ELEM_SECTION_CONTENT_STATE = ELEM_SECTION_CONTENT as ElementState
const ELEM_SECTION_STATE = ELEM_SECTION as ElementState
const ELEM_TEXT_STATE = ELEM_TEXT as ElementState

test('select elements', () => {
  const dispatch = jest.fn()
  const ELEMENTS = [{
    ...ELEM_TEXT_STATE,
    selected: true,
  }, ELEM_IMAGE_STATE, ELEM_CONTAINER_STATE]

  selectBody(ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [ELEM_TEXT_STATE, { // deselect text element
      ...ELEM_CONTAINER_STATE, // select container (the root)
      selected: true,
    }],
  })

  dispatch.mockReset()

  selectElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE], ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_IMAGE_STATE,
      selected: true,
    }],
  })
})

test('move 1 element', () => {
  const dispatch = jest.fn()
  const ELEMENTS = [ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_CONTAINER_STATE]

  expect(ELEM_CONTAINER_STATE.children[0]).toBe(ELEM_TEXT_STATE.id)

  moveElements([ELEM_TEXT_STATE], DomDirection.DOWN, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch.mock.calls[0][0].items[0].children).toHaveLength(3)
  expect(dispatch.mock.calls[0][0].items[0].children[0]).toBe(ELEM_IMAGE_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[1]).toBe(ELEM_TEXT_STATE.id)

  dispatch.mockReset()
  moveElements([ELEM_TEXT_STATE], DomDirection.UP, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(0)

  dispatch.mockReset()
  moveElements([ELEM_TEXT_STATE], DomDirection.TOP, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(0)

  dispatch.mockReset()
  moveElements([ELEM_TEXT_STATE], DomDirection.BOTTOM, ELEMENTS, dispatch)
  expect(dispatch.mock.calls[0][0].items[0].children[2]).toBe(ELEM_TEXT_STATE.id)
})

test('move 2 elements among 2', () => {
  const dispatch = jest.fn()
  const ELEMENTS = [ELEM_TEXT_STATE, ELEM_IMAGE_STATE, {
    ...ELEM_CONTAINER_STATE,
    children: [ELEM_IMAGE_STATE.id, ELEM_TEXT_STATE.id],
  }]

  moveElements([ELEM_IMAGE_STATE, ELEM_TEXT_STATE], DomDirection.DOWN, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(0)

  moveElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE], DomDirection.DOWN, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(0)

  moveElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE], DomDirection.TOP, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(0)

  // moveElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE], DomDirection.BOTTOM, ELEMENTS, dispatch, true)
  // expect(dispatch).toHaveBeenCalledTimes(0)
})

test('move 2 elements among 3', () => {
  const dispatch = jest.fn()
  const ELEMENTS = [ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_CONTAINER_STATE]

  moveElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE], DomDirection.DOWN, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch.mock.calls[0][0].items[0].children[0]).toBe(ELEM_HTML_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[1]).toBe(ELEM_TEXT_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[2]).toBe(ELEM_IMAGE_STATE.id)

  dispatch.mockReset()
  moveElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE], DomDirection.BOTTOM, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch.mock.calls[0][0].items[0].children[0]).toBe(ELEM_HTML_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[1]).toBe(ELEM_TEXT_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[2]).toBe(ELEM_IMAGE_STATE.id)

  dispatch.mockReset()
  moveElements([ELEM_HTML_STATE, ELEM_IMAGE_STATE], DomDirection.UP, ELEMENTS, dispatch)
  expect(dispatch.mock.calls[0][0].items[0].children[0]).toBe(ELEM_IMAGE_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[1]).toBe(ELEM_HTML_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[2]).toBe(ELEM_TEXT_STATE.id)

  dispatch.mockReset()
  moveElements([ELEM_HTML_STATE, ELEM_IMAGE_STATE], DomDirection.TOP, ELEMENTS, dispatch)
  expect(dispatch.mock.calls[0][0].items[0].children[0]).toBe(ELEM_IMAGE_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[1]).toBe(ELEM_HTML_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[2]).toBe(ELEM_TEXT_STATE.id)
})

test('move 1 element among invisible elements', () => {
  const dispatch = jest.fn()
  const ELEMENTS = [{
    ...ELEM_IMAGE_STATE,
    pageNames: ['invisible-page']
  }, {
    ...ELEM_HTML_STATE,
  }, ELEM_TEXT_STATE, ELEM_CONTAINER_STATE]

  // here ELEM_CONTAINER_STATE.children is [ 'testId0Text', 'testId1Image', 'testId2Html' ]
  moveElements([ELEM_TEXT_STATE], DomDirection.DOWN, ELEMENTS, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)

  // the text element is expected to have moved 2 elements down
  expect(dispatch.mock.calls[0][0].items[0].children[0]).toBe(ELEM_IMAGE_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[1]).toBe(ELEM_HTML_STATE.id)
  expect(dispatch.mock.calls[0][0].items[0].children[2]).toBe(ELEM_TEXT_STATE.id)
})

test('add element', async () => {
  const [body] = fromElementData([{
    ...ELEM_SECTION_STATE,
    selected: true,
  }])
  // TODO: refactore add element to be able to unit test
  initializeElements([body, ELEM_SECTION_CONTENT_STATE, ELEM_CONTAINER_STATE])
  const dispatch = jest.fn(store.dispatch)
  const [element, updatedParentData] = await addElement({
    type: ElementType.HTML,
    parent: ELEM_CONTAINER_STATE,
    componentName: null,
    style: {
      mobile: {},
      desktop: {
        top: '450px',
        left: '450px',
      },
    },
  }, dispatch)

  // check that we de-selected the body
  expect(dispatch.mock.calls[0][0].type).toBe('ELEMENT_CREATE')
  expect(dispatch.mock.calls[1][0].type).toBe('ELEMENT_UPDATE')
  expect(dispatch.mock.calls[1][0].items[0].id).toBe(body.id)
  expect(dispatch.mock.calls[1][0].items[0].selected).toBe(false)

  expect(element).not.toBeNull()
  expect(element.selected).toBe(true)
  expect(element.style.desktop).not.toBeNull()
  expect(element.style.desktop.top).toBe('450px')
  expect(element.style.desktop.left).toBe('450px')

  expect(updatedParentData).not.toBeNull()
  expect(updatedParentData.id).toBe(ELEM_CONTAINER_STATE.id)
  expect(updatedParentData.innerHtml).toBe(ELEM_CONTAINER_STATE.innerHtml)
  expect(updatedParentData.pageNames).toBe(ELEM_CONTAINER_STATE.pageNames)
  expect(updatedParentData.selected).toBe(false)
  expect(updatedParentData.style).toEqual(ELEM_CONTAINER_STATE.style)
  expect(updatedParentData.children).not.toBe(ELEM_CONTAINER_STATE.children)
  expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER_STATE.children.length + 1)
  expect(updatedParentData.children).toContain(element.id)

})

test('add element in a selected element', async () => {
  const selectedContainer = {
    ...ELEM_CONTAINER_STATE,
    selected: true,
  }
  // TODO: refactore add element to be able to unit test
  initializeElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE, selectedContainer, ELEM_SECTION_CONTENT_STATE])
  const [element, updatedParentData] = await addElement({
    type: ElementType.HTML,
    parent: getElementById(selectedContainer.id),
    componentName: null,
    style: {
      mobile: {},
      desktop: {},
    },
  })
  expect(element).not.toBeNull()
  expect(element.selected).toBe(true)
  expect(element.style.desktop).not.toBeNull()

  expect(updatedParentData.id).toBe(ELEM_CONTAINER_STATE.id)
  expect(updatedParentData.selected).toBe(false)
  expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER_STATE.children.length + 1)
  expect(updatedParentData.children).toContain(element.id)
})

test('add a section', async () => {
  // TODO: refactore add element to be able to unit test
  initializeElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_CONTAINER_STATE, ELEM_SECTION_CONTENT_STATE])
  // add a section in a container
  await expect(
    addElement({
      type: ElementType.SECTION,
      parent: ELEM_CONTAINER_STATE,
      componentName: null,
      style: {
        mobile: {},
        desktop: {},
      },
    })
  ).rejects.toThrow('added to the body')

  // add a section in the body
  initializeElements([ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_CONTAINER_STATE]) // here ELEM_CONTAINER_STATE has no parent => it is considered the body
  expect(isBody(ELEM_CONTAINER_STATE)).toBe(true)
  const [element, updatedParentData] = await addElement({
    type: ElementType.SECTION,
    parent: ELEM_CONTAINER_STATE,
    componentName: null,
    style: {
      mobile: {},
      desktop: {},
    },
  })
  expect(element).not.toBeNull()
  expect(element.selected).toBe(true)
  expect(element.style.desktop.top).toBeUndefined()
  expect(element.style.desktop.left).toBeUndefined()
  expect(element.style.desktop.height).toBeUndefined()
  expect(element.style.desktop.width).toBeUndefined()

  const sectionContent = getElementById(element.children[0])
  expect(sectionContent).not.toBeNull()
  expect(sectionContent.selected).toBe(false)
  expect(sectionContent.style.desktop.top).toBeUndefined()
  expect(sectionContent.style.desktop.left).toBeUndefined()
  expect(sectionContent.style.desktop.height).toBe('100px')
  expect(sectionContent.style.desktop.width).toBeUndefined()

  expect(updatedParentData.id).toBe(ELEM_CONTAINER_STATE.id)
  expect(updatedParentData.innerHtml).toBe(ELEM_CONTAINER_STATE.innerHtml)
  expect(updatedParentData.pageNames).toBe(ELEM_CONTAINER_STATE.pageNames)
  expect(updatedParentData.selected).toBe(false)
  expect(updatedParentData.style).toEqual(ELEM_CONTAINER_STATE.style)
  expect(updatedParentData.children).not.toBe(ELEM_CONTAINER_STATE.children)
  expect(updatedParentData.children).toHaveLength(ELEM_CONTAINER_STATE.children.length + 1)
  expect(updatedParentData.children).toContain(element.id)
})

test('removeFromPage', () => {
  const dispatch = jest.fn()

  // remove from an element with only this page
  removeFromPage([{
    ...ELEM_TEXT_STATE,
    pageNames: ['fake-id'],
  }], { id: 'fake-id' } as PageState, null, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_TEXT_STATE,
    }],
  })

})

test('removeElements section', () => {
  const dispatch = jest.fn()

  const elemBody = {
    ...ELEM_CONTAINER_STATE,
    children: [ELEM_SECTION_STATE.id],
  }
  const sectionContent = {
    ...ELEM_SECTION_CONTENT_STATE,
    children: [ELEM_TEXT_STATE.id],
  }

  removeElementsWithoutConfirm([ELEM_SECTION_STATE], [
    elemBody,
    ELEM_TEXT_STATE,
    ELEM_SECTION_STATE,
    sectionContent,
  ], dispatch)
  expect(dispatch).toHaveBeenCalledTimes(2) // called for delete elements and update parents

  expect(dispatch).toHaveBeenNthCalledWith(1, {
    type: 'ELEMENT_UPDATE',
    items: [{
      ...elemBody,
      children: [],
    }],
  })

  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: 'ELEMENT_DELETE',
    items: [
      ELEM_SECTION_STATE,
      sectionContent,
      ELEM_TEXT_STATE,
    ],
  })
})

test('removeElements section container', () => {
  const dispatch = jest.fn()

  const elemBody = {
    ...ELEM_CONTAINER_STATE,
    children: [ELEM_SECTION_STATE.id],
  }
  const sectionContent = {
    ...ELEM_SECTION_CONTENT_STATE,
    children: [ELEM_TEXT_STATE.id],
  }

  removeElementsWithoutConfirm([sectionContent], [
    elemBody,
    ELEM_TEXT_STATE,
    ELEM_SECTION_STATE,
    sectionContent,
  ], dispatch)
  expect(dispatch).toHaveBeenCalledTimes(2) // called for delete elements and update parents

  expect(dispatch).toHaveBeenNthCalledWith(1, {
    type: 'ELEMENT_UPDATE',
    items: [{
      ...elemBody,
      children: [],
    }],
  })

  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: 'ELEMENT_DELETE',
    items: [
      ELEM_SECTION_STATE,
      sectionContent,
      ELEM_TEXT_STATE,
    ],
  })

})

