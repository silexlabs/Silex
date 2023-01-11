import Backbone from 'backbone'

import { closestInstance, wait } from '../utils.js'
import Symbol, { getSymbolId, cleanup } from './Symbol.js'

export default Backbone.Collection.extend({
  model: Symbol,
  initialize(models, {editor, options}) {
    this.editor = editor
    this.options = options
    if(!options.headless) {
      this.initEvents()
    }
  },

  initEvents() {
    this.editor.on('component:create', c => this.onAdd(c))
    this.editor.on('component:update:components', (parent, comp) => this.onUpdateChildren(parent, comp))
    this.editor.on('component:update:attributes', c => this.onUpdateAttributes(c))
    this.editor.on('component:update:classes', c => this.onUpdateClasses(c))
    this.editor.on('component:input', c => this.onUpdateContent(c))
  },

  /**
   * Update sybols with existing components
   * This is used on load only
   * TODO: Use `storage:end:load`? But this event is fired after the components are loaded
   * TODO: Needs review
   * @param {Array.<Component>} components
   * @private
   */
  updateComponents(components) {
    components.forEach(c => this.onAdd(c))
  },

  /**
   * Add a component to a symbol
   * This is useful only when loading new HTML content
   * When loading a new component which is a symbol,
   *   add a ref to the component in its symbol.get('instances')
   * Export this method for unit tests
   * TODO: Needs review
   * @private
   */
  onAdd(c) {
    const symbolId = getSymbolId(c)
    if(symbolId) {
      const symbol = this.get(symbolId)
      if(symbol) {
        if(symbol.isInstance(c)) {
          console.warn('Could not add instance', c, `It is already an instance of symbol with id ${symbolId}`)
        } else {
          // This is probably a duplication of a symbol
          // Or we have just loaded the website
          // Make it an instance
          symbol.addInstance(c)
        }
      } else {
        console.warn('Could not add instance', c, `Could not find the symbol with id ${symbolId} (maybe later?)`)
      }
    }
  },

  /**
   * A component's components() has changed
   */
  async onUpdateChildren(parent, component) {
    if(this.updating) return
    const inst = closestInstance(parent)
    if(inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if(s) {
        // wait for the component's children to be changed
        // I couldn't find an event like `component:update:components:after`
        // TODO: need review
        await wait()
        this.updating = true
        s.applyChild(inst, component)
        this.updating = false
      } else {
        console.warn('Could not update instance', component, ': could not find the symbol with id', symbolId)
      }
    }
  },

  /**
   * A component's attributes has changed
   */
  onUpdateAttributes(c) {
    if(this.updating) return
    const inst = closestInstance(c)
    if(inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if(s) {
        this.updating = true
        s.applyAttributes(inst, c)
        this.updating = false
      } else {
        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
      }
    }
  },

  /**
   * A component's css classes have changed
   */
  onUpdateClasses(c) {
    if(this.updating) return
    const inst = closestInstance(c)
    if(inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if(s) {
        this.updating = true
        s.applyClasses(inst, c)
        this.updating = false
      } else {
        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
      }
    }
  },

  /**
   * A component's text content has changed
   */
  onUpdateContent(c) {
    if(this.updating) return
    const inst = closestInstance(c)
    if(inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if(s) {
        this.updating = true
        s.applyContent(inst, c)
        this.updating = false
      } else {
        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
      }
    }
  },
})

