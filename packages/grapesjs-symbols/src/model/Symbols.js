import Backbone from 'backbone'

import Symbol, { getSymbolId, isSymbol, initAsSymbol, removeAsSymbol } from './Symbol.js'

/**
 * parse all pages and retrieve all website components
 */
function getAllComponentsFromEditor(editor) {
  const res = []
  editor.Pages.getAll()
    .forEach(page => {
      page.getMainComponent()
        .onAll(c => res.push(c))
    })
  return res
}

/**
 * parse all pages and retrieve all website components
 */
function getParentSymbols(editor, c) {
  const res = []
  let p = c
  do {
    if(isSymbol(p)) res.push(p)
    p = p.parent()
  } while(p)

  return res
}

export default Backbone.Collection.extend({
  model: Symbol,
  initialize(models, {editor, options}) {
    this.editor = editor
    this.options = options
    editor.on('component:create', c => onAdd(this.editor, c))
    editor.on('component:remove', c => onRemove(this.editor, c))
    editor.on('component:update', c => onUpdate(this.editor, c))
    // editor.on('component:change:content', (...args) => console.log('ALL COMP', ...args))
    // editor.on('all', (...args) => console.log('ALL', ...args))
    function logEvent(name) {
      editor.on(name, component => console.log('[SYMBOL] ' + name, component.changed, component._changing, component._previousAttributes, component.attributes, component.toHTML()))
    }
    logEvent('component:selected')
    logEvent('component:deselected')
    logEvent('component:create')
    logEvent('component:mount')
    logEvent('component:add')
    logEvent('component:remove')
    logEvent('component:remove:before')
    logEvent('component:clone')
    logEvent('component:update')
    logEvent('component:update-inside')
    logEvent('component:styleUpdate')
    logEvent('component:drag')
    // editor.on('component:create', c => updateCreate(c))
    // editor.on('component:remove:before', c => updateRemove(c))
  },
  /**
   * update sybols with existing components
   * this is used on load because the `storage:end:load` event is fired after the components are loaded
   */
  updateComponents() {
    getAllComponentsFromEditor(this.editor)
      .forEach(c => onAdd(this.editor, c))
  },
})

// utils
/**
 * remove a component from its symbol
 * Export this method for unit tests
 * @private
 */
export function onAdd(editor, c) {
  if(isSymbol(c)) {
    const cid = c.cid
    const sid = getSymbolId(c)
    const s = editor.Symbols.get(sid)
    if(s) {
      const components = s.get('components')
      if(!components.has(cid)) {
        components.set(cid, c)
        initAsSymbol(c, s)
      } else {
        console.info(`Can not add component ${cid} to symbol ${sid}: this element is already in symbol`)
      }
    } else {
      console.log(`Can not add component ${cid} to symbol ${sid}: this symbol does not exist (yet?)`)
    }
  }
  return null
}

/**
 * remove a component from its symbol
 * @private
 */
function onRemove(editor, c) {
  if(isSymbol(c) || !!c._previousAttributes.symbolId) {
    const cid = c.cid
    const id = getSymbolId(c)
    const s = editor.Symbols.get(id)
    if(s) {
      const components = s.getComponents()
      if(components.has(cid)) {
        components.delete(cid)
      } else {
        console.info(`Can not remove component ${cid} from symbol ${id}: this element is not in symbol`)
      }
    } else {
      console.info(`Can not remove component ${cid} from symbol ${id}: this symbol does not exist`)
    }
  }
}

let updating = false
/**
 * remove a component from its symbol
 * @private
 */
function onUpdate(editor, c) {
  if(!c.get('symbolId') && c._previousAttributes.symbolId) {
    onRemove(editor, c)
  } else {
    if(updating) return
    if(isSymbol(c)) {
      const cid = c.get('id')
      const id = getSymbolId(c)
      const s = editor.Symbols.get(id)
      if(s) {
        const components = s.getComponents()
        if(components.has(cid)) {
          // apply change to all other symbols
          updating = true
          s.update(c)
          updating = false
        } else {
          console.info(`Can not update component ${cid} from symbol ${id}: this element is not in symbol`)
        }
      } else {
        console.info(`Can not update component ${cid} from symbol ${id}: this symbol does not exist`)
      }
    }
  }
}

