import { ElementType } from '../element-store/types';
import { addToMobileOrDesktopStyle, fixStyleForType } from './styles';

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
  let style = fixStyleForType(ElementType.TEXT, false, { height: '20px', width: '10px', a: 'b' })
  expect(style).toEqual({ height: '20px', width: '10px', a: 'b' })

  style = fixStyleForType(ElementType.TEXT, false, { a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForType(ElementType.SECTION, false, { height: '20px', width: '10px', a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForType(ElementType.CONTAINER, true, { height: '20px', width: '10px', a: 'b' })
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ height: '20px', a: 'b' })

  style = fixStyleForType(ElementType.SECTION, false, { a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForType(ElementType.SECTION, false, { height: '20px', width: '10px', a: 'b' })
  expect(Object.keys(style)).not.toContain('height')
  expect(Object.keys(style)).not.toContain('width')
  expect(style).toEqual({ a: 'b' })

  style = fixStyleForType(ElementType.CONTAINER, false, { height: '20px', width: '10px', a: 'b' })
  expect(style).toEqual({ height: '20px', width: '10px', a: 'b' })
})

