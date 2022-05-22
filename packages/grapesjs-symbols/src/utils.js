import { isInstance } from './model/Symbol.js'

/**
 * set editor as dirty
 */
export function setDirty(editor) {
  const curr = editor.getDirtyCount() || 0
  editor.getModel().set('changesCount', curr + 1)
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
    return c.components()
      .find(comp => find(comp, symbolChildId))
  }
}

/**
 * find the first symbol in the parents (or the element itself)
 * exported for unit tests
 * @private
 */
export function closestInstance(c) {
  let ptr = c
  while(ptr && !isInstance(ptr)) {
    ptr = ptr.parent()
  }
  return ptr
}

