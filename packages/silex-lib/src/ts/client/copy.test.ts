import {
  ELEM_CONTAINER,
  ELEM_HTML,
  ELEM_IMAGE,
  ELEM_SECTION,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
} from '../test-utils/data-set'
import { ElementState, ElementType } from './element-store/types'
import { cloneElement, cloneElements, pasteElements, ElementStateaWithParentId } from './copy'

// in this file we do not use the store, so crudId is not needed, ElementData and ElementState can be used
const ELEM_CONTAINER_STATE = ELEM_CONTAINER as ElementState
const ELEM_IMAGE_STATE = ELEM_IMAGE as ElementState
const ELEM_SECTION_STATE = ELEM_SECTION as ElementState
const ELEM_SECTION_CONTENT_STATE = ELEM_SECTION_CONTENT as ElementState
const ELEM_TEXT_STATE = ELEM_TEXT as ElementState
const ELEM_HTML_STATE = ELEM_HTML as ElementState

jest.mock('./components/SiteFrame', () => ({
  getSiteDocument: () => document,
  getSiteIFrame: () => document.body,
}))

jest.mock('./element-store/dom', () => ({
  getDomElement: (doc, parent) => document.body,
}))

test('cloneElement 1 element', () => {
  const cloned = cloneElement(ELEM_TEXT_STATE, null, [ELEM_TEXT_STATE])
  expect(cloned).toHaveLength(1)
  expect(cloned[0].id).not.toBe(ELEM_TEXT_STATE.id)
  expect(cloned[0].id).not.toBe(ELEM_TEXT_STATE.id)
})

test('cloneElement 1 element with children', () => {
  const cloned = cloneElement(ELEM_CONTAINER_STATE, null, [ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_HTML_STATE, ELEM_CONTAINER_STATE])
  expect(cloned).toHaveLength(4)
  expect(cloned[0].type).toBe(ElementType.CONTAINER)
  expect(cloned[0].children[0]).toBe(cloned[1].id)
  expect(cloned[0].children[0]).not.toBe(ELEM_TEXT_STATE.id)
})

test('cloneElements root', () => {
  const [all, root] = cloneElements([ELEM_TEXT_STATE], [ELEM_TEXT_STATE])
  expect(all).toHaveLength(0)
  expect(root).toHaveLength(0)
})

test('copy elements with 2 containers inside one another', () => {
  const initial = [ELEM_SECTION_CONTENT_STATE, ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_HTML_STATE, ELEM_CONTAINER_STATE]
  const cloned = cloneElement(ELEM_SECTION_CONTENT_STATE, null, initial)
  expect(cloned).toHaveLength(5)
  expect(cloned[0].type).toBe(ElementType.CONTAINER)
  expect(cloned[1].type).toBe(ElementType.CONTAINER)
  expect(cloned[0].children[0]).toBe(cloned[1].id)
  expect(cloned[0].children).toHaveLength(1)
  expect(cloned[1].children[0]).toBe(cloned[2].id)
  expect(cloned[1].children[0]).not.toBe(ELEM_TEXT_STATE.id)
  expect(cloned[1].children).toHaveLength(3)
})

test('cloneElements 1 element', () => {
  const [all, root] = cloneElements([ELEM_TEXT_STATE], [ELEM_TEXT_STATE, ELEM_IMAGE_STATE, ELEM_HTML_STATE, ELEM_CONTAINER_STATE])
  expect(all).toHaveLength(1)
  expect(root).toHaveLength(1)
  expect(all).toEqual(root)
  expect(all[0].id).not.toBe(ELEM_TEXT_STATE.id)
})

test('cloneElements container with children', () => {
  const [all, root] = cloneElements([ELEM_CONTAINER_STATE], [ELEM_TEXT_STATE, ELEM_CONTAINER_STATE, ELEM_IMAGE_STATE, ELEM_HTML_STATE, ELEM_SECTION_STATE, ELEM_SECTION_CONTENT_STATE])
  expect(all).toHaveLength(4)
  expect(root).toHaveLength(1)
  expect(root[0].type).toBe(ElementType.CONTAINER)
  expect(root[0].id).not.toBe(ELEM_CONTAINER_STATE.id)
  expect(root[0].children[0]).not.toBe(ELEM_TEXT_STATE.id)
  expect(root[0].children[0]).toBe(all[1].id)
})

test('cloneElements with non existing elements', () => {
  expect(() => cloneElements([ELEM_CONTAINER_STATE], [])).toThrow(Error)
})

function duplicate(state, id, children = [], isBody = false, innerHtml = '') {
  return {
    ...state,
    id,
    children,
    isBody,
    innerHtml,
  }
}

test('clone 1 root element', () => {
  const txt1 = duplicate(ELEM_TEXT_STATE, 'txt1', [], false, 'txt1')
  const c1 = duplicate(ELEM_CONTAINER_STATE, 'c1', [txt1.id], false, 'c1')
  const c2 = duplicate(ELEM_CONTAINER_STATE, 'c2', [], false, 'c2')
  const c3 = duplicate(ELEM_CONTAINER_STATE, 'c3', [c1.id, c2.id], false, 'c3')
  const body = duplicate(ELEM_CONTAINER_STATE, 'body', [c3.id], true)
  const elements = [body, c1, c2, c3, txt1]
  const dispatch = jest.fn()

  const [all, root] = cloneElements([c3], elements)

  const c3_ = all.find(el => el.innerHtml === 'c3') as ElementStateaWithParentId
  const c1_ = all.find(el => el.innerHtml === 'c1') as ElementStateaWithParentId
  const c2_ = all.find(el => el.innerHtml === 'c2') as ElementStateaWithParentId
  const txt1_ = all.find(el => el.innerHtml === 'txt1') as ElementStateaWithParentId

  // check that all elements have been duplicated
  expect(all).toHaveLength(4)
  expect(root).toHaveLength(1)
  expect(c3_).not.toBeNull()
  expect(c1_).not.toBeNull()
  expect(c2_).not.toBeNull()
  expect(txt1_).not.toBeNull()

  // check that the children have been set correctly
  expect(root[0]).toBe(c3_)
  expect(c3_.selected).toBe(true)
  expect(c3_.children).toContain(c1_.id)
  expect(c3_.children).toContain(c2_.id)
  expect(c1_.children).toContain(txt1_.id)

  // make sure temporary value is not present anymore
  expect(c1_.parentId).toBeUndefined()
  expect(c2_.parentId).toBeUndefined()
  expect(c3_.parentId).toBeUndefined()
  expect(txt1_.parentId).toBeUndefined()
})

test('pasteElements 1 root elements', () => {
  const txt1 = duplicate(ELEM_TEXT_STATE, 'txt1')
  const c1 = duplicate(ELEM_CONTAINER_STATE, 'c1', [txt1.id])
  const c2 = duplicate(ELEM_CONTAINER_STATE, 'c2', [])
  const c3 = duplicate(ELEM_CONTAINER_STATE, 'c3', [c1.id, c2.id])
  const body = duplicate(ELEM_CONTAINER_STATE, 'body', [], true)
  const clipboard = [c1, c2, c3, txt1]
  const elements = [...clipboard, body]
  const dispatch = jest.fn()
  pasteElements({
    parent: body,
    rootElements: [c3],
    allElements: clipboard,
    pageNames: [],
  }, elements, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(2) // 2 calls for the 2 root elements

  // 1st call: create
  expect(dispatch.mock.calls[0]).toHaveLength(1) // 1 arg which is the action
  expect(dispatch.mock.calls[0][0].type).toBe('ELEMENT_CREATE')
  expect(dispatch.mock.calls[0][0].items).toHaveLength(clipboard.length)
  expect(dispatch.mock.calls[0][0].items.map((i) => i.id)).toEqual(clipboard.map(el => el.id))

  // 2nd call: update parents
  expect(dispatch.mock.calls[1]).toHaveLength(1) // 1 arg which is the action
  expect(dispatch.mock.calls[1][0].type).toBe('ELEMENT_UPDATE')
  expect(dispatch.mock.calls[1][0].items).toHaveLength(1)
  expect(dispatch.mock.calls[1][0].items.map((i) => i.id)).toEqual([body.id])
})

test('pasteElements 2 root elements', () => {
  const elementsToPaste = [ELEM_IMAGE_STATE, ELEM_HTML_STATE]
  const dispatch = jest.fn()
  pasteElements({
    parent: ELEM_CONTAINER_STATE,
    rootElements: elementsToPaste,
    allElements: elementsToPaste,
    pageNames: [],
  }, [ELEM_TEXT_STATE, ELEM_CONTAINER_STATE, ELEM_SECTION_STATE, ELEM_SECTION_CONTENT_STATE], dispatch)
  expect(dispatch).toHaveBeenCalledTimes(2) // 2 calls

  // 1st call: create
  expect(dispatch.mock.calls[0]).toHaveLength(1) // 1 arg which is the action
  expect(dispatch.mock.calls[0][0].type).toBe('ELEMENT_CREATE')
  expect(dispatch.mock.calls[0][0].items).toHaveLength(2)
  expect(dispatch.mock.calls[0][0].items.map((i) => i.id)).toEqual([ELEM_IMAGE_STATE.id, ELEM_HTML_STATE.id])

  // 2nd call: update parents
  expect(dispatch.mock.calls[1]).toHaveLength(1) // 1 arg which is the action
  expect(dispatch.mock.calls[1][0].type).toBe('ELEMENT_UPDATE')
  expect(dispatch.mock.calls[1][0].items).toHaveLength(1)
  expect(dispatch.mock.calls[1][0].items.map((i) => i.id)).toEqual([ELEM_CONTAINER_STATE.id])
})

test('pasteElements 3 elements with 1 root element', () => {
  const dispatch = jest.fn()
  pasteElements({
    parent: ELEM_SECTION_STATE,
    rootElements: [ELEM_CONTAINER_STATE],
    allElements: [ELEM_CONTAINER_STATE, ELEM_IMAGE_STATE, ELEM_HTML_STATE],
    pageNames: [],
  }, [ELEM_SECTION_STATE], dispatch)

  // 1st call: create
  expect(dispatch.mock.calls[0]).toHaveLength(1) // 1 arg which is the action
  expect(dispatch.mock.calls[0][0].type).toBe('ELEMENT_CREATE')
  expect(dispatch.mock.calls[0][0].items).toHaveLength(3)
  expect(dispatch.mock.calls[0][0].items.map((i) => i.id)).toEqual([ELEM_CONTAINER_STATE.id, ELEM_IMAGE_STATE.id, ELEM_HTML_STATE.id])

  // 2nd call: update parents
  expect(dispatch.mock.calls[1]).toHaveLength(1) // 1 arg which is the action
  expect(dispatch.mock.calls[1][0].type).toBe('ELEMENT_UPDATE')
  expect(dispatch.mock.calls[1][0].items).toHaveLength(1)
  expect(dispatch.mock.calls[1][0].items.map((i) => i.id)).toEqual([ELEM_SECTION_STATE.id])
})
