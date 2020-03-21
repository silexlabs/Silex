import { ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT, ELEM_TEXT } from '../../../__tests__/data-set';
import { getSite, updateSite } from '../site/store';
import { initializeElements } from './store';
import { center, cloneElement, cloneElements, flat, getElementSize, getElementStyle } from './utils';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT])
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

test('cloneElements', () => {
  const [all, root] = cloneElements([ELEM_TEXT])
  expect(all).not.toBeNull()
  expect(all).toHaveLength(1)
  expect(all).toEqual(root)
  expect(all[0].id).not.toBe(ELEM_TEXT.id)
  expect(all[0].id).not.toBe(ELEM_TEXT.id)
})

const getSize = (el) => ({width: parseInt(el.style.desktop.width), height: parseInt(el.style.desktop.height)})

test('center in container', () => {
  expect(center(getSize(ELEM_TEXT), getSize(ELEM_CONTAINER))).toEqual({
    top: 450,
    left: 450,
  })
})

// test('get bounding box', () => {
//   expect(getBoundingBox([ELEM_TEXT, ELEM_CONTAINER], false)).toEqual({
//     top: 10,
//     left: 10,
//     width: 1000,
//     height: 1000,
//     bottom: 1010,
//     right: 1010,
//   })
// })

test('get element styles', () => {
  expect(getElementStyle(ELEM_TEXT, 'width', false)).toBe('100px')
  expect(getElementStyle(ELEM_TEXT, 'width', true)).toBe('100px')
  expect(getElementStyle(ELEM_TEXT, 'unknown', true)).toBeUndefined()
  expect(getElementStyle(ELEM_CONTAINER, 'height', true)).toBe('900px')
})

test('get element size on desktop', () => {
  // element with style
  expect(getElementSize(null, ELEM_TEXT, false)).toEqual({
    width: 100,
    height: 100,
  })
  // section width
  expect(getElementSize(null, ELEM_CONTAINER, false)).toEqual({
    width: 1000,
    height: 1000,
  })
  // section height
  expect(getElementSize({innerWidth: 9999} as Window, ELEM_SECTION, false)).toEqual({
    width: 9999,
    height: 500,
  })
  // section container whidth
  updateSite({
    ...getSite(),
    width: 1234,
  })
  expect(getElementSize({innerWidth: 9999} as Window, ELEM_SECTION_CONTENT, false)).toEqual({
    width: 1234,
    height: 500,
  })
})

test('get element size on mobile', () => {
  // element with style
  // section width
  // section height
  // section container whidth
  console.error('FIXME: test mobile too')
})
