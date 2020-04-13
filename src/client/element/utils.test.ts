import { ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT, ELEM_TEXT } from '../../../__tests__/data-set';
import { ElementRect } from './types';
import {
  center,
  getAllStyles,
  getBoundingBox,
  getElementSize,
  getElementStyle
} from './utils';
import { getSite, updateSite } from '../site/store';
import { initializeElements } from './store';

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

test('get bounding box', () => {
  expect(getBoundingBox([ELEM_TEXT.style.desktop as any, ELEM_CONTAINER.style.desktop as any])).toEqual({
    top: 0,
    left: 0,
    width: 1010,
    height: 1010,
    bottom: 1010,
    right: 1010,
  })
  expect(getBoundingBox([ELEM_SECTION_CONTENT.style.desktop as any])).toEqual({
    top: 0,
    left: 0,
    width: 0,
    height: 500,
    bottom: 500,
    right: 0,
  })
})

// test('get bounding box', () => {
//   expect(getBoundingBox([ELEM_TEXT, ELEM_CONTAINER], false)).toEqual({
//     top: 0,
//     left: 0,
//     width: 1000,
//     height: 1000,
//     bottom: 1010,
//     right: 1010,
//   })
//   expect(getBoundingBox([ELEM_SECTION_CONTENT], false)).toBeNull()
//   // test with top equal to 0
//   expect(getBoundingBox([ELEM_TEXT], false)).not.toBeNull()
// })


test('get all styles', () => {
  initializeElements([ELEM_TEXT])
  const styles = getAllStyles()
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  iframe.contentDocument.body.innerHTML = `<style>${styles}</style><div class="${ELEM_TEXT.id}"></div>`

  const el = iframe.contentDocument.querySelector(`.${ELEM_TEXT.id}`)
  expect(el).not.toBeNull()
  const style = iframe.contentWindow.getComputedStyle(el)
  expect(style).not.toBeNull()
  expect(style.width).toBe('100px')
  expect(style.height).toBe('')
  expect(style['min-height']).toBe('100px')

})

test('get element styles', () => {
  expect(getElementStyle(ELEM_TEXT, 'width', false)).toBe('100px')
  expect(getElementStyle(ELEM_TEXT, 'width', true)).toBe('100px')
  expect(getElementStyle(ELEM_TEXT, 'unknown', true)).toBeUndefined()
  expect(getElementStyle(ELEM_CONTAINER, 'height', true)).toBe('900px')
  expect(getElementStyle(ELEM_CONTAINER, 'top', false)).toBe('10px')
  expect(getElementStyle(ELEM_CONTAINER, 'top', true)).toBeUndefined()
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
