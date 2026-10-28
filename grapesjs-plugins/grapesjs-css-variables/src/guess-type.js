import { TYPE_COLOR, TYPE_SIZE, TYPE_FONT_FAMILY } from './types.js'

// A value says what it is, the way the browser reads it: red is a color, 16px a size
export function guessType(value, supports = (property, text) => CSS.supports(property, text)) {
  if (supports('color', value)) return TYPE_COLOR
  if (supports('width', value)) return TYPE_SIZE
  return TYPE_FONT_FAMILY
}
