/**
 * set editor as dirty
 */
export function setDirty(editor) {
  try {
    const curr = editor.getDirtyCount() || 0
    editor.getModel().set('changesCount', curr + 1)
  } catch(e) {
    // this occures in headless mode and UT
  }
}

/**
 * browse all pages and retrieve all website components
 */
export function getAllComponentsFromEditor(editor) {
  const res = []
  editor.Pages.getAll()
    .forEach(page => {
      page.getMainComponent()
        .onAll(c => res.push(c))
    })
  return res
}

/**
 * Get all the children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component's children
 */
export function children(c) {
  const children = c.components().toArray()
  return children
    .flatMap(child => all(child))
}

/**
 * Get an array of the component + its children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component itself and its children
 */
export function all(c) {
  const children = c.components().toArray()
  return [c]
    .concat(children
      .flatMap(child => {
        if(hasSymbolId(child)) return [child]
        return all(child)
      })
    )
}

/**
 * Find a component in a component's children, with a given symbolChildId or symbolId
 * @param {Component} c - the root component
 * @param {string} cid - the ID we are looking for
 * @returns {(Component|null)} the component itself or one of its children
 */
export function find(c, symbolChildId) {
  if(c.get('symbolChildId') === symbolChildId) {
    return c
  } else {
    // check the children components
    let found = null
    c.components()
      // Does not work properly, why? .find(comp => find(comp, symbolChildId))
      .forEach(comp => {
        if(!found) found = find(comp, symbolChildId)
      })
    return found
  }
}

/**
 * find the first symbol in the parents (or the element itself)
 * exported for unit tests
 * @private
 */
export function closestInstance(c) {
  let ptr = c
  while(ptr && !hasSymbolId(ptr)) {
    ptr = ptr.parent()
  }
  return ptr
}

/**
 * @param {Component} c - a component
 * @return {Boolean} true if the component has a symbol id
 */
export function hasSymbolId(c) {
  return !!c.get('symbolId')
}

export async function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
export function getNodePath(root, node) {
  const path = []
  let pointer = node
  while (pointer && pointer !== root) {
    const parent = pointer.parentNode
    const children = Array.from(parent.childNodes)
    const nodeIndex = children.indexOf(pointer)
    path.push(nodeIndex)
    pointer = parent
  }
  return path
}

/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
export function getNode(root, path) {
  const mutablePath = [...path]
  let result = root
  while (result && mutablePath.length) {
    result = result.childNodes[mutablePath.pop()]
  }
  return result
}

/**
 * Gets the caret position
 */
export function getCaret(el) {
  const win = el.ownerDocument.defaultView
  const sel = win.getSelection()
  const range = sel.rangeCount ? sel.getRangeAt(0) : null
  const pos = range?.startOffset ?? 0
  const caretEl = range?.commonAncestorContainer ?? el
  const path = getNodePath(el, caretEl)
  return { path, pos }
}

/**
 * Sets the caret position
 */
export function setCaret(el, { path, pos }) {
  const textNode = getNode(el, path)
  if(textNode) {
    const win = el.ownerDocument.defaultView
    const sel = win.getSelection()
    sel.removeAllRanges()
    const range = document.createRange()
    range.selectNodeContents(textNode);
    range.collapse(false);
    range.setStart(textNode, pos)
    range.setEnd(textNode, pos)
    sel.addRange(range)
  } else {
    console.error('Could not keep the caret position', {el, path})
  }

}
