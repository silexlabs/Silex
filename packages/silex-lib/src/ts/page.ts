// Page related functions
// This is used on the client and the server
export function getPageSlug(pageName = 'index') {
  return pageName
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    // Collapse whitespace and replace by -
    .replace(/\s+/g, '-')
    // Collapse dashes
    .replace(/-+/g, '-')
}
export function getPageLink(pageName = 'index') {
  return `./${getPageSlug(pageName)}.html`
}
