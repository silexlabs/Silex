import { addToMobileOrDesktopStyle, fixStyleForElement } from './styles'
import { ELEM_TEXT, ELEM_SECTION, ELEM_CONTAINER } from '../../test-utils/data-set'
import { ElementState } from '../element-store/types'

// in this file we do not use the store, so crudId is not needed, ElementData and ElementState can be used
const ELEM_TEXT_STATE = ELEM_TEXT as ElementState
const ELEM_CONTAINER_STATE = ELEM_CONTAINER as ElementState
const ELEM_SECTION_STATE = ELEM_SECTION as ElementState

test('add to mobile or desktop style', () => {
  expect(
    addToMobileOrDesktopStyle(true, {
      mobile: { a1: 'x1', b1: 'y1' },
      desktop: { a2: 'x2', b2: 'y2' },
    }, { a1: 'x2', c1: 'z1' })
  ).toEqual({
    mobile: { a1: 'x2', b1: 'y1', c1: 'z1' },
    desktop: { a2: 'x2', b2: 'y2' },
  })
})

test('fix style for type', () => {
  let style = fixStyleForElement(ELEM_TEXT_STATE, false, { height: '20px', width: '10px', a: 'b' })
  expect(style).toEqual({ height: '20px', width: '10px', a: 'b' })

  style = fixStyleForElement(ELEM_TEXT_STATE, false, { a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForElement(ELEM_SECTION_STATE, false, { height: '20px', width: '10px', a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForElement(ELEM_CONTAINER_STATE, true, { height: '20px', width: '10px', a: 'b' })
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ height: '20px', a: 'b' })

  style = fixStyleForElement(ELEM_SECTION_STATE, false, { a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForElement(ELEM_SECTION_STATE, false, { height: '20px', width: '10px', a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForElement(ELEM_CONTAINER_STATE, false, { height: '20px', width: '10px', a: 'b' })
  expect(style).toEqual({ height: '20px', width: '10px', a: 'b' })
})

