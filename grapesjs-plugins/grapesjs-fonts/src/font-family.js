/**
 * Case-insensitive font family matching, shared by fonts:install and fonts:remove.
 */

export function sameFontFamily(a, b) {
  return String(a).toLowerCase() === String(b).toLowerCase()
}

export function findFontIndex(fonts, family) {
  return fonts.findIndex(f => sameFontFamily(f.family, family))
}

export function formatFontList(fonts) {
  const names = fonts.map(f => f.family).filter(Boolean)
  return names.length ? names.join(', ') : '(none)'
}

export function removeInstalledFont(fonts, family) {
  const idx = findFontIndex(fonts, family)
  if (idx === -1) {
    throw new Error(`Font "${family}" not installed. Installed fonts: ${formatFontList(fonts)}. Use fonts:installed to list installed fonts.`)
  }
  const next = fonts.slice()
  const [removed] = next.splice(idx, 1)
  return { fonts: next, removed }
}
