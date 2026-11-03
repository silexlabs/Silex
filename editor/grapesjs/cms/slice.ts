/**
 * Liquid has no length for "all the items after start"
 * Slice will never return more items than this
 */
export const SLICE_ALL_LENGTH = Number.MAX_SAFE_INTEGER

/**
 * Get the liquid options of the slice filter, like the editor does
 * - Numbers typed by the user are published without quotes, e.g. "2" becomes 2,
 *   or Liquid would add the start and length as strings
 * - Text like "abc" keeps its quotes, or Liquid reads it as a variable
 * - An empty start is 0
 * - An empty or 0 length keeps all the items after start,
 *   in Liquid slice without a length returns only 1 item
 */
export function getSliceOptions(options: unknown[]): string[] {
  const [start, length] = options.map(option => unquoteNumber(String(option ?? '')))
  return [
    start || '0',
    !length || isNumber(length) && parseInt(length) <= 0 ? String(SLICE_ALL_LENGTH) : length,
  ]
}

function isNumber(value: string): boolean {
  return /^-?\d+$/.test(value)
}

function unquoteNumber(option: string): string {
  const value = option.trim()
  const unquoted = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1).trim() : value
  if (!unquoted) return ''
  return isNumber(unquoted) ? String(parseInt(unquoted)) : value
}
