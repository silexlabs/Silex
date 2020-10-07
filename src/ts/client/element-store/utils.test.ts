import { ELEM_CONTAINER, ELEM_SECTION, ELEM_SECTION_CONTENT, ELEM_TEXT } from '../../test-utils/data-set'
import { ElementRect, ElementState } from './types'
import {
  getAllStyles,
  getBoundingBox,
  getElementStyle
} from './utils'
import { getSite, updateSite } from '../site-store/index'
import { initializeElements } from './index'

// in this file we do not use the store, so crudId is not needed, ElementData and ElementState can be used
const ELEM_TEXT_STATE = ELEM_TEXT as ElementState
const ELEM_CONTAINER_STATE = ELEM_CONTAINER as ElementState
const ELEM_SECTION_STATE = ELEM_SECTION as ElementState
const ELEM_SECTION_CONTENT_STATE = ELEM_SECTION_CONTENT as ElementState

const getSize = (el) => ({width: parseInt(el.style.desktop.width), height: parseInt(el.style.desktop.height)})

// test('center in container', () => {
//   expect(center({
//     element: ELEM_TEXT_STATE,
//     parent: ELEM_CONTAINER_STATE,
//     win: window,
//   })).toEqual({
//     top: 450,
//     left: 450,
//   })
// })

test('get bounding box', () => {
  expect(getBoundingBox([ELEM_TEXT_STATE.style.desktop as any, ELEM_CONTAINER_STATE.style.desktop as any])).toEqual({
    top: 0,
    left: 0,
    width: 1010,
    height: 1010,
    bottom: 1010,
    right: 1010,
  })
  expect(getBoundingBox([ELEM_SECTION_CONTENT_STATE.style.desktop as any])).toEqual({
    top: 0,
    left: 0,
    width: 0,
    height: 500,
    bottom: 500,
    right: 0,
  })
})

test('get bounding box', () => {
  expect(getBoundingBox([ELEM_TEXT_STATE.style.desktop as any, ELEM_CONTAINER_STATE.style.desktop as any])).toEqual({
    top: 0,
    left: 0,
    width: 1010,
    height: 1010,
    bottom: 1010,
    right: 1010,
  })
  // test with top equal to 0
  expect(getBoundingBox([ELEM_TEXT_STATE.style.desktop as any])).not.toBeNull()
})


test('get all styles', () => {
  initializeElements([ELEM_TEXT_STATE])
  const styles = getAllStyles()
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  iframe.contentDocument.body.innerHTML = `<style>${styles}</style><div class="${ELEM_TEXT_STATE.id}"></div>`

  const el = iframe.contentDocument.querySelector(`.${ELEM_TEXT_STATE.id}`)
  expect(el).not.toBeNull()
  const style = iframe.contentWindow.getComputedStyle(el)
  expect(style).not.toBeNull()
  expect(style.width).toBe('100px')
  expect(style.height).toBe('')
  expect(style['min-height']).toBe('100px')

})

test('get element styles', () => {
  expect(getElementStyle(ELEM_TEXT_STATE, 'width', false)).toBe('100px')
  expect(getElementStyle(ELEM_TEXT_STATE, 'width', true)).toBe('100px')
  expect(getElementStyle(ELEM_TEXT_STATE, 'unknown', true)).toBeUndefined()
  expect(getElementStyle(ELEM_CONTAINER_STATE, 'height', true)).toBe('900px')
  expect(getElementStyle(ELEM_CONTAINER_STATE, 'top', false)).toBe('10px')
  expect(getElementStyle(ELEM_CONTAINER_STATE, 'top', true)).toBeUndefined()
})

// test('get element size on desktop', () => {
//   // element with style
//   expect(getElementSize(null, ELEM_TEXT_STATE, false, [ELEM_TEXT_STATE])).toEqual({
//     width: 100,
//     height: 100,
//   })
//   // section width
//   expect(getElementSize(null, ELEM_CONTAINER_STATE, false, [ELEM_CONTAINER_STATE])).toEqual({
//     width: 1000,
//     height: 1000,
//   })
//   // section height
//   expect(getElementSize({innerWidth: 9999} as Window, ELEM_SECTION_STATE, false, [ELEM_SECTION_CONTENT_STATE, ELEM_SECTION_STATE])).toEqual({
//     width: 9999,
//     height: 500,
//   })
//   // section container whidth
//   updateSite({
//     ...getSite(),
//     width: 1234,
//   })
//   expect(getElementSize({innerWidth: 9999} as Window, ELEM_SECTION_CONTENT_STATE, false, [ELEM_SECTION_CONTENT_STATE])).toEqual({
//     width: 1234,
//     height: 500,
//   })
// })

test('get element size on mobile', () => {
  // element with style
  // section width
  // section height
  // section container whidth
  // FIXME: test mobile too
  console.warn('FIXME: test mobile too')
})
