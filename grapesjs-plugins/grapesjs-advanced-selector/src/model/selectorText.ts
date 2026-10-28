import { ComplexSelector, toString } from './ComplexSelector'

/**
 * Whether the model keeps everything the selector says: fromString reads one relation
 * at most and silently drops what it does not know (".a > .b > .c" becomes ".a > .b.c")
 */
export function fitsModel(selector: string, cs: ComplexSelector): boolean {
  return normalize(selector) === normalize(toString(cs))
}

// Compounds and combinators in order, the simple selectors sorted inside each compound:
// their order does not change the meaning, and the model writes them in its own order
function normalize(selector: string): string {
  const text = selector
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([>+~(])\s*/g, '$1')
    .replace(/\s+\)/g, ')')
  const parts: string[] = []
  let compound: string[] = []
  let current = ''
  let depth = 0
  const flushSimple = () => {
    if (current) compound.push(current.replace(/["']/g, '').replace(/^::/, ':'))
    current = ''
  }
  const flushCompound = () => {
    flushSimple()
    parts.push(compound.sort().join(''))
    compound = []
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (depth === 0 && ' >+~'.includes(char)) {
      flushCompound()
      parts.push(char)
      continue
    }
    if (depth === 0 && ('.#['.includes(char) || (char === ':' && text[i - 1] !== ':'))) flushSimple()
    if ('(['.includes(char)) depth++
    if (')]'.includes(char)) depth--
    current += char
  }
  flushCompound()
  return parts.join('')
}
