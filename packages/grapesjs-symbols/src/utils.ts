import { Component } from 'grapesjs'
import { SymbolEditor } from './model/Symbols'
import { getSymbolId } from './model/Symbol'

/**
 * set editor as dirty
 */
export function setDirty(editor: SymbolEditor) {
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
export function getAllComponentsFromEditor(editor: SymbolEditor): Component[] {
  const res: Component[] = []
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
export function children(c: Component): Component[] {
  const children = c.components().toArray()
  return children
    .flatMap(child => all(child))
}

/**
 * Get an array of the component + its children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component itself and its children
 */
export function all(c: Component): Component[] {
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
export function find(c: Component, symbolChildId: string): Component | null {
  if(c.get('symbolChildId') === symbolChildId) {
    return c
  } else {
    // check the children components
    let found: Component | null = null
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
 * @private
 */
export function closestInstance(c: Component): Component | undefined {
  let ptr: Component | undefined = c
  while(ptr && !hasSymbolId(ptr)) {
    ptr = ptr.parent()
  }
  return ptr
}

/**
 * @param {Component} c - a component
 * @return {Boolean} true if the component has a symbol id
 */
export function hasSymbolId(c: Component): boolean {
  return !!c.get('symbolId')
}

export async function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
export function getNodePath(root: Node, node: Node) {
  const path = []
  let pointer: Node | undefined = node
  while (pointer && pointer !== root) {
    const parent: Node = pointer.parentNode! as any as Node
    const children = Array.from(parent!.childNodes)
    const nodeIndex = children.indexOf(pointer as any) // any because it should be a ChildNode but eslint does not know ChildNode
    path.push(nodeIndex)
    pointer = parent
  }
  return path
}

/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
export function getNode(root: Node, path: number[]): Node | null {
  const mutablePath = [...path]
  let result = root
  while (result && mutablePath.length) {
    result = result.childNodes[mutablePath.pop()!]
  }
  return result
}

/**
 * Gets the caret position
 */
export function getCaret(el: HTMLElement): { path: number[], pos: number } {
  const win = el.ownerDocument.defaultView!
  const sel = win.getSelection()!
  const range = sel.rangeCount ? sel.getRangeAt(0) : null
  const pos = range?.startOffset ?? 0
  const caretEl = range?.commonAncestorContainer ?? el
  const path = getNodePath(el, caretEl as Node)
  return { path, pos }
}

/**
 * Sets the caret position
 */
export function setCaret(el: HTMLElement, { path, pos }: { path: number[], pos: number }): void {
  const textNode = getNode(el, path)
  if(textNode) {
    const win = el.ownerDocument.defaultView!
    const sel = win.getSelection()!
    sel.removeAllRanges()
    const range = document.createRange()
    range.selectNodeContents(textNode)
    range.collapse(false)
    range.setStart(textNode, pos)
    range.setEnd(textNode, pos)
    sel.addRange(range)
  } else {
    console.error('Could not keep the caret position', {el, path})
  }
}

/**
 * find the all the symbols in the parents (or the element itself)
 * @private
 */
function allParentInstances(c: Component, includeSelf: boolean): Component[] {
  const result = []
  let ptr: Component | undefined = includeSelf ? c : c.parent()
  while(ptr) {
    if(hasSymbolId(ptr)) result.push(ptr)
    ptr = ptr.parent()
  }
  return result
}

/**
 * find the all the symbols in the children (or the element itself)
 */
function allChildrenInstances(c: Component, includeSelf: boolean): Component[] {
  const children = c.components().toArray()
  const result = []
  if(includeSelf && hasSymbolId(c)) result.push(c)
  return [c]
    .concat(children
      .flatMap(child => allChildrenInstances(child, true)) // include self only for the subsequent levels
    )
}

/**
 * Find if a parent is also a child of the symbol
 */
export function allowDrop({target, parent}: { target: Component, parent: Component }): boolean {
  const allParents = allParentInstances(parent, true)
  const allChildren = allChildrenInstances(target, false)
  return !allParents.find(p => allChildren.find(c => getSymbolId(c) === getSymbolId(p)))
}
