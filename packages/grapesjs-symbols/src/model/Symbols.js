import Backbone from 'backbone'

import Symbol, { getSymbolId, isSymbol } from './Symbol.js'

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
      //editor.on(name, (...args) => console.log('[SYMBOL] ' + name, ...args, args[0]?.changed))
    }
    logEvent('component:selected')
    logEvent('component:deselected')
    logEvent('component:create')
    logEvent('component:mount')
    logEvent('component:add')
    logEvent('component:remove')
    logEvent('component:clone')
    logEvent('component:update')
    logEvent('component:update-inside')
    logEvent('component:styleUpdate')
    logEvent('component:drag')
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
    const cid = c.get('id')
    const sid = getSymbolId(c)
    const s = editor.Symbols.get(sid)
    if(s) {
      const components = s.get('components')
      if(!components.has(cid)) {
        return components.add(c.attributes)
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
  if(isSymbol(c)) {
    const cid = c.get('id')
    const id = getSymbolId(c)
    const s = editor.Symbols.get(id)
    if(s) {
      const components = s.getComponents()
      if(components.has(cid)) {
        components.remove(cid)
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
