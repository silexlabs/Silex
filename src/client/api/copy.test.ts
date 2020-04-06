import {
  ELEM_CONTAINER,
  ELEM_HTML,
  ELEM_IMAGE,
  ELEM_SECTION,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
  PAGE1,
} from '../../../__tests__/data-set';
import { cloneElement, cloneElements, flat, pasteElements } from './copy';
import { getElementById } from '../element/filters';
import { getElements, initializeElements } from '../element/store';
import { initializePages } from '../page/store';

jest.mock('../../../node_modules/sortablejs/modular/sortable.core.esm.js', () => jest.fn());
jest.mock('../components/SiteFrame', () => ({
  getSiteDocument: () => document,
}));

jest.mock('../components/StageWrapper', () => ({
  getStage: () => ({
    getState: (doc, el) => ({ metrics: { computedStyleRect: {}}}),
  })
}))

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT])
  initializePages([PAGE1])
})

test('flat', () => {
  expect(flat([['a', 'b'], 'c'])).toEqual(['a', 'b', 'c'])
  expect(flat(['a', ['b', 'c']])).toEqual(['a', 'b', 'c'])
  expect(flat([['a', 'b', 'c']])).toEqual(['a', 'b', 'c'])
  expect(flat(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
})

test('cloneElement', () => {
  const cloned = cloneElement(ELEM_TEXT)
  expect(cloned).not.toBeNull()
  expect(cloned[0].id).not.toBe(ELEM_TEXT.id)
  expect(cloned[0].id).not.toBe(ELEM_TEXT.id)
})

test('cloneElements 1 element', () => {
  const [all, root] = cloneElements([ELEM_TEXT])
  expect(all).toHaveLength(1)
  expect(all).not.toBeNull()
  expect(all).toHaveLength(1)
  expect(all).toEqual(root)
  expect(all[0].id).not.toBe(ELEM_TEXT.id)
})

test('cloneElements container', () => {
  initializeElements([ELEM_TEXT, ELEM_CONTAINER, ELEM_IMAGE, ELEM_HTML, ELEM_SECTION, ELEM_SECTION_CONTENT])
  const [all, root] = cloneElements([ELEM_CONTAINER])
  expect(all).toHaveLength(4)
})

test('cloneElements with non existing elements', () => {
  expect(() => cloneElements([ELEM_CONTAINER])).toThrow(Error)
})

test('pasteElements 2 root elements', () => {
  expect(getElements()).toHaveLength(4)
  const elementsToPaste = [ELEM_IMAGE, ELEM_HTML]
  pasteElements({
    parent: ELEM_CONTAINER,
    rootElements: elementsToPaste,
    allElements: elementsToPaste,
  })
  expect(getElements()).toHaveLength(6)
})

test('pasteElements 3 elements with 1 root element', () => {
  initializeElements([ELEM_SECTION])
  expect(getElements()).toHaveLength(1)
  expect(getElementById(ELEM_SECTION.id).children).toHaveLength(1)
  pasteElements({
    parent: ELEM_SECTION,
    rootElements: [ELEM_CONTAINER],
    allElements: [ELEM_CONTAINER, ELEM_IMAGE, ELEM_HTML],
  })
  expect(getElements()).toHaveLength(4)
  expect(getElementById(ELEM_SECTION.id).children).toHaveLength(2)
  expect(getElementById(ELEM_SECTION.id).children).toStrictEqual(expect.arrayContaining([ELEM_CONTAINER.id]))
  expect(getElementById(ELEM_CONTAINER.id).children).toStrictEqual(expect.arrayContaining([ELEM_HTML.id]))
})
