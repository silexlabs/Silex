import Backbone from 'backbone'

import { allowDrop, closestInstance, wait } from '../utils'
import Symbol, { getSymbolId } from './Symbol'
import { Editor, Component, CssRule } from 'grapesjs'

// Editor with the symbols plugin
export type SymbolEditor = Editor & { Symbols: Symbols }

export class Symbols extends Backbone.Collection<Symbol>  {
  editor: Editor
  options: any
  updating: boolean = false

  constructor(models: Symbol[], { editor, options, ...opts }: any) {
    super(models, opts)
    this.editor = editor
    this.options = options
    if (!options.headless) {
      this.initEvents()
    }
    // Make sure the symbol CRUD operations are undoable
    this.editor.UndoManager.add(this)
  }

  disableUndo(disable: boolean) {
    if(disable) this.editor.UndoManager.stop()
    else this.editor.UndoManager.start()
  }

  async preventUndo(cbk: () => void) {
    this.editor.UndoManager.stop()
    await cbk()
    this.editor.UndoManager.start()
  }

  initEvents() {
    this.editor.on('component:create', c => this.onAdd(c))
    this.editor.on('component:update:components', (parent, comp) => this.onUpdateChildren(parent, comp))
    this.editor.on('component:update:attributes', c => this.onUpdateAttributes(c))
    this.editor.on('component:update:classes', c => this.onUpdateClasses(c))
    this.editor.on('component:input', c => this.onUpdateContent(c))
    this.editor.on('styleable:change', cssRule => {
      // Sometimes the event is fired with a Component instead of a CssRule
      if (!cssRule.getComponent) return
      if (!cssRule.changed) return
      this.onStyleChanged(cssRule)
    })
    this.editor.on('component:drag', ({target, parent}) => this.onDrag({target, parent}))
    //this.editor.on('undo', () => {
    //  this.updating = true
    //  setTimeout(() => {
    //    this.updating = false
    //  }, 1000)
    //})
  }

  /**
   * Update sybols with existing components
   * This is used on load only
   * TODO: Use `storage:end:load`? But this event is fired after the components are loaded
   * TODO: Needs review
   * @private
   */
  updateComponents(components: Component[]) {
    components.forEach(c => this.onAdd(c))
  }

  /**
   * Prevent drop on a symbol into itself or things similar
   */
  onDrag({target, parent}: {target: Component, parent: Component}) {
    if(parent?.get('droppable') && !allowDrop({target, parent})) {
      // Prevent drop
      parent.set('droppable', false)
      // Reset after drop
      this.editor.once('component:drag:end', () => {
        parent.set('droppable', true)
      })
    }
  }

  /**
   * Add a component to a symbol
   * This is useful only when loading new HTML content
   * When loading a new component which is a symbol,
   *   add a ref to the component in its symbol.get('instances')
   * Export this method for unit tests
   * TODO: Needs review
   * @private
   */
  onAdd(c: Component) {
    const symbolId = getSymbolId(c)
    if (symbolId) {
      const symbol = this.get(symbolId)
      if (symbol) {
        if (symbol.isInstance(c)) {
          console.warn('Could not add instance', c, `It is already an instance of symbol with id ${symbolId}`)
        } else {
          // This is probably a duplication of a symbol
          // Or we have just loaded the website
          // Make it an instance
          symbol.addInstance(c)
        }
      } else {
        // The symbol is not yet loaded
        setTimeout(() => {
          // Check again
          if(this.get(symbolId)) {
            // Allright in the end, it was just during loading
          } else {
            console.error(`Could not make component with id \`${c.getId()}\` an instance of symbol with id \`${symbolId}\`: symbol not found`)
            this.editor.runCommand('notifications:add', {
              type: 'error',
              group: 'Symbols errors',
              message: `There is a problem with this component: it is supposed to be an instance of a symbol, but the symbol is not found. Symbol id: ${symbolId}`,
              componentId: c.getId(),
            })
          }
        })
      }
    }
  }

  /**
   * A component's components() has changed
   */
  async onUpdateChildren(parent: Component, component: Component) {
    if (this.updating) return
    const inst = closestInstance(parent)
    if (inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if (s) {
        // wait for the component's children to be changed
        // I couldn't find an event like `component:update:components:after`
        // TODO: need review
        await wait()
        this.updating = true
        await this.preventUndo(async () => {
          s.applyChildren(inst, parent, component)
        })
        this.updating = false
      } else {
        console.warn('Could not update instance', component, ': could not find the symbol with id', symbolId)
      }
    }
  }

  /**
   * A component's attributes has changed
   */
  onUpdateAttributes(c: Component) {
    if (this.updating) return
    const inst = closestInstance(c)
    if (inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if (s) {
        this.updating = true
        s.applyAttributes(inst, c)
        this.updating = false
      } else {
        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
      }
    }
  }

  /**
   * A component's css classes have changed
   */
  async onUpdateClasses(c: Component) {
    if (this.updating) return
    const inst = closestInstance(c)
    if (inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if (s) {
        await wait() // Needed for undo to work
        this.updating = true
        this.preventUndo(() => {
          s.applyClasses(inst, c)
        })
        this.updating = false
      } else {
        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
      }
    }
  }

  /**
   * A component's text content has changed
   */
  onUpdateContent(c: Component) {
    if (this.updating) return
    const inst = closestInstance(c)
    if (inst) {
      const symbolId = getSymbolId(inst)
      const s = this.get(symbolId)
      if (s) {
        this.updating = true
        this.preventUndo(() => {
          s.applyContent(inst, c)
        })
        this.updating = false
      } else {
        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
      }
    }
  }

  /**
   * A component's style has changed
   * TODO: Needs review: isn't the style supposed to be just an attribute => we should not need to sync it, just attributes?
   */
  onStyleChanged(cssRule: CssRule) {
    if (this.updating) return
    const c = cssRule.getComponent()
    const { style } = cssRule.changed
    if (c && style) {
      const inst = closestInstance(c)
      if (inst) {
        const symbolId = getSymbolId(inst)
        const s = this.get(symbolId)
        if (s) {
          // Keep only changed values
          // TODO: Needs review - isn't cssRule.changed supposed to be only what changed?
          const changed: object = Object.entries(style)
            .filter(([key, value]) => cssRule.previousAttributes().style![key] !== value || !cssRule.previousAttributes().style![key])
            .reduce((result, [key, value]) => {
              return {
                ...result,
                [key]: value,
              }
            }, {} as object)
          // Removed keys
          const removed = Object.keys(cssRule.previousAttributes().style!)
            .filter(key => !style[key])
          if (Object.values(changed).length > 0 || removed.length > 0) {
            this.updating = true
            s.applyStyle(inst, c, changed, removed)
            this.updating = false
          }
        } else {
          console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId)
        }
      }
    }
  }
}

// From https://stackoverflow.com/questions/19673089/how-to-properly-define-backbone-collection-using-typescript
Symbols.prototype.model = Symbol
