import Backbone from 'backbone'

import { closestInstance } from '../utils.js';
import Symbol, { getSymbolId, isInstance } from './Symbol.js'

export default Backbone.Collection.extend({
  model: Symbol,
  initialize(models, {editor, options}) {
    this.editor = editor
    this.options = options
    if(!options.headless) {
      this.initEvents()
    }
  },

  logEvent(name) {
    this.editor.on(name, component => {
      const { changed, _changing, _previousAttributes, attributes } = component
      //console.log('[SYMBOL] ' + name, { changed, _changing, _previousAttributes, attributes }, component.toHTML())
    })
  },

  initEvents() {
    this.logEvent('component:create')
    this.logEvent('component:remove')
    this.logEvent('component:update')
    this.editor.on('component:create', c => this.onAdd(c))
    this.editor.on('component:remove', c => this.onRemove(getSymbolId(c), c))
    this.editor.on('component:update', c => this.onUpdate(c))
    this.on('remove', console.log('FIXME: cleanup all instances'))
    // this.editor.on('component:change:content', (...args) => console.log('ALL COMP', ...args))
    // this.editor.on('all', (...args) => console.log('ALL', ...args))
    
    //this.logEvent('component:selected')
    //this.logEvent('component:deselected')
    //this.logEvent('component:create')
    //this.logEvent('component:mount')
    //this.logEvent('component:add')
    //this.logEvent('component:remove')
    //this.logEvent('component:remove:before')
    //this.logEvent('component:clone')
    //this.logEvent('component:update')
    //this.logEvent('component:update-inside')
    //this.logEvent('component:styleUpdate')
    //this.logEvent('component:drag')

    // this.editor.on('component:create', c => updateCreate(c))
    // this.editor.on('component:remove:before', c => updateRemove(c))
  },

  /**
   * update sybols with existing components
   * this is used on load because the `storage:end:load` event is fired after the components are loaded
   * @param {Array.<Component>} components
   */
  updateComponents(components) {
    components.forEach(c => this.onAdd(c))
  },
  /**
   * A component attributes have changed
   */
  onUpdate(c) {
    if(this.updating) return
    const inst = closestInstance(c)
    if(inst) {
      if(inst === c) { // && c.getChangedProps().hasOwnProperty('symbolId')) {
        // case of an instance
        // handle unlinking
        if(!c.get('symbolId') && c._previousAttributes.symbolId) {
          this.onRemove(c._previousAttributes.symbolId, c)
        }
      }
      // call apply method on the instance
      const s = this.get(getSymbolId(inst))
      if(s) {
        this.updating = true
        s.applyAttributes(inst, c)
        this.updating = false
      } else {
        console.warn('could not update the symbol', s, 'for the instance', c)
      }
    }
  },

  /**
   * remove a component from its symbol
   * Export this method for unit tests
   * @private
   */
  onAdd(c) {
    if(isInstance(c)) {
      const symbolId = getSymbolId(c)
      if(this.has(symbolId)) {
        this.get(symbolId).addInstance(c)
      } else {
        console.warn(`Could not add instance ${c}: could not find the symbol with id ${symbolId} (maybe later?)`)
      }
    }
  },

  /**
   * Remove an instance from a symbol
   * This happens when an instance is deleted or when it is unlinked
   * Exported for tests
   * @private
   */
  onRemove(symbolId, c) {
    if(symbolId) {
      if(this.has(symbolId)) {
        this.get(symbolId).removeInstance(c)
      } else {
        console.warn(`Could not remove instance ${c}: could not find the symbol with id ${symbolId}`)
      }
    }
  },
})
