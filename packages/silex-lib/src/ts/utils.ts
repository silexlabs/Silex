export function getPageSlug(pageName: string = 'index') {
  return pageName
  .toLowerCase()
  .replace(/[^a-z0-9 -]/g, '')
  // Collapse whitespace and replace by -
  .replace(/\s+/g, '-')
  // Collapse dashes
  .replace(/-+/g, '-')
}
export function getPageLink(pageName: string = 'index') {
  return `./${getPageSlug(pageName)}.html`
}
