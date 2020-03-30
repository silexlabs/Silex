import { ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT, ELEM_TEXT } from '../../../__tests__/data-set';
import { getSite, updateSite } from '../site/store';
import { initializeElements } from './store';
import { center, getElementSize, getElementStyle } from './utils';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT])
})

const getSize = (el) => ({width: parseInt(el.style.desktop.width), height: parseInt(el.style.desktop.height)})

test('center in container', () => {
  expect(center({
    element: ELEM_TEXT,
    parent: ELEM_CONTAINER,
    win: window,
  })).toEqual({
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
