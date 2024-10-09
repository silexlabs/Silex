import Backbone from 'backbone'
import { Component, ComponentProperties } from 'grapesjs'

import { SymbolEditor, Symbols } from './Symbols'
import { find, all, children, getCaret, setCaret, closestInstance } from '../utils'
import { uniqueId } from 'underscore'

type SymbolAttributes = {
  id: string,
  model: Component,
  label?: string,
  icon?: string,
  instances?: Map<string, Component>,
}

export const SYMBOL_ID_ATTRIBUTE = 'symbolId'
export const SYMBOL_CHILD_ID_ATTRIBUTE = 'symbolChildId'
export const SYMBOL_SYNC_ATTRIBUTE = 'symbolSync'

/**
 * A Symbol class holds the data about a symbol: label, icon
 * The `model` attribute is a grapesjs Component used to create new instances
 * The `instances` attribute is a Map of grapesjs Components kept in sync with the model
 * The model is kept up to date by calling the apply* methods
 * 
 * @member {string} attributes.label
 * @member {string} attributes.icon
 * @member {Component} attributes.model
 * @member {Map.<string, Component>} attributes.instances
 * 
 * @class
 */
class Symbol extends Backbone.Model {
  /**
   * Default options passed to the constructor
   */
  //defaults: {
  //  label: 'New Symbol',
  //  icon: 'fa-question',
  //},

  /**
   * @param {{ label: ?string, icon: ?string }} attributes
   * @param {Object} model - to be converted to Component and stored in attributes.model
   * Notes:
   * - `attributes.instances` will initially be empty until addInstance is called by the Symbols class (onAdd method)
   * - `attributes.model` may initially be a Component (creation of a Symbol) or JSON data (loaded symbol from storage). It is always converted to a Component in `initialize`
   *
   */
  initialize() {
    // Check required attributes
    if(!this.has('model')) throw new Error('Could not create Symbol: model is required')

    // Init the required instances on the symbol
    if(!this.has('instances')) {
      this.set('instances', new Map())
    }

    if(this.collection) { // This is false during unit tests
      // Get a ref to grapesjs editor
      const editor = (this.collection! as any as Symbols).editor

      // `attributes.model` may initially be a Component (creation of a Symbol) or JSON data (loaded symbol from storage). It is always converted to a Component in `initialize`
      // in which case we convert model to a real component
      // TODO: Needs review
      const model = this.get('model') as Component
      if(!model.cid) { // FIXME: should be typeof model = 'string'
        const [modelComp] = editor.addComponents([model])
        this.set('model', modelComp)
      }

      // Make sure the symbol instances are undoable
      editor.UndoManager.add(this)
    }
  }

  /**
   * Return a shallow copy of the model's attributes for JSON
   * stringification.
   * @return {Object}
   * @private
   */
  toJSON(opts = {}) {
    const obj = Backbone.Model.prototype.toJSON.call(this, opts)
    delete obj.instances
    return obj
  }

  /**
   * Get all instances as an Array, except the `excludeOne` one
   * @param callback which receives the instances
   * @param excludeOne - optionally exclude one component
   * @param addOne - optionally add one component, typically pass the symbol's `model` attribute when needed
   * @returns The symbol instances
   * @private
   */
  getAll(addOne: Component | null = null, excludeOne: Component | null = null) {
    const values = Array.from((this.get('instances') as Map<string, Component>).values())
    return (addOne ? [addOne] : []).concat(excludeOne ? values.filter(inst => inst.cid != excludeOne.cid) : values)
  }

  /**
   * Browse all instances and their children matching the changed component
   * Includes the `model` of this symbol
   * Will not include the provided instance `srcInst` nor `srcChild` as they are the ones which changed
   * @param srcInst - the instance of this symbol containing `child`
   * @param srcChild - the child which has the changes
   */
  browseInstancesAndModel(
    srcInst: Component,
    srcChildren: Component[],
    cbk: (dstChildren: Component[], dstInst: Component) => void
  ) {
    this.getAll(this.get('model') as Component, srcInst)
      .forEach(dstInst => {
        const dstChildren = srcChildren
          .map(srcChild => {
          // Get a child or the root
            return srcChild.has(SYMBOL_ID_ATTRIBUTE)
              ? dstInst // this is the root
              : find(dstInst, srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE))! // this is a child
          })
        cbk(dstChildren, dstInst)
      })
  }

  /**
   * Apply css classes to all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * @param srcInst - the instance of this symbol containing `child`
   * @param srcChild - the child which has the changes
   */
  applyClasses(srcInst: Component, srcChild: Component) {
    if(srcInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
      if(dstChild) {
        dstChild.setClass(srcChild.getClasses())
      } else {
        console.error(`Could not sync classes for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`)
      }
    })
  }

  getIndex(parent: Component, symbolChildId: string) {
    // TODO: Needs review
    return parent.components().toArray()
      .findIndex(c => c.get(SYMBOL_CHILD_ID_ATTRIBUTE) === symbolChildId)
  }

  /**
   * Update attributes of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * @param srcInst - the instance of this symbol containing `child`
   * @param parent - the element whose children have changed
   * @param srcChild - the child which has the changes
   */
  applyChildren(srcInst: Component, parent: Component, srcChild: Component) {
    if(srcInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
    if(!parent) throw new Error(`Could not sync children for symbol ${this.cid}: ${srcChild.cid} has no parent`)

    // Get all instances of this symbol
    const allInst = all(srcInst)
      .filter(inst => inst.get(SYMBOL_SYNC_ATTRIBUTE) !== false)

    // Handle the create/update/remove cases
    if(allInst.includes(srcChild)) {
      // The child is in the instance
      const symbolChildId = srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)
      // Case of a child being duplicated inside the symbol
      const isDuplicate = !!symbolChildId && allInst
        .filter(c => c.get(SYMBOL_CHILD_ID_ATTRIBUTE) === symbolChildId && c.parent() === parent).length > 1
      if(symbolChildId && !isDuplicate) {
        // Case of a moving child inside the instance
        this.browseInstancesAndModel(srcInst, [srcChild, parent], ([dstChild, dstParent], dstInst) => {
          if(dstChild && dstParent) {
            dstParent.append(dstChild, { at: srcChild.index() })
          } else {
            console.error(`Could not sync child for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`, {dstChild, dstParent})
          }
        })
      } else {
        // this is a new child
        all(srcChild)
          // Force new symbolChildId for `srcChild` and its children (excluding symbols)
          //   because `c` might be a duplicate of another child
          //   this happens when we duplicate a component inside a symbol
          .forEach(c => initSymbolChild(c, true))
        this.browseInstancesAndModel(srcInst, [parent], ([dstParent], dstInst) => {
          if(dstParent) {
            const clone = srcChild.clone()
            dstParent.append(clone, { at: srcChild.index() })
          } else {
            console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`)
          }
        })
      }
    } else {
      // Child is not there anymore
      // Beware: srcChild has no parent nor view anymore
      this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
        if(dstChild) {
          dstChild.remove()
        } else {
          console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`)
        }
      })
      // this child is not part of a symbol anymore
      srcChild.set(SYMBOL_CHILD_ID_ATTRIBUTE)
    }
  }

  /**
   * Update attributes of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * @param srcInst - the instance of this symbol containing `child`
   * @param srcChild - the child which has the changes
   */
  applyAttributes(srcInst: Component, srcChild: Component) {
    if(srcInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
      if(dstChild) {
        // doesnt work: dstChild.setAttributes(srcChild.getAttributes())
        dstChild.attributes = srcChild.attributes
      } else {
        console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`)
      }
    })
  }

  /**
   * Update text content of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param srcInst - the instance of this symbol containing `child`
   * @param srcChild - the child which has the changes
   */
  applyContent(srcInst: Component, srcChild: Component) {
    if(srcInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return

    // Store the caret position in the contenteditable container
    const el = srcChild.getCurrentView()!.el
    const caret = getCaret(el)

    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
      if(dstChild) {
        if(dstChild.get('type') === 'text') { // FIXME: sometimes type is ""
          // Sets the new content
          dstChild.components(srcChild.getCurrentView()!.el.innerHTML)
        }
        else { console.error('applyContent, NOT A TEXT', dstChild, dstChild.get('type')) }
      } else {
        console.error(`Could not sync content for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`)
      }
    })
    // Restore the caret position in the contenteditable container
    // TODO: need review
    // FIXME: Why is the caret reset after we change the components which do not have the focus?
    setTimeout(() => {
      // After dom update
      setCaret(el, caret)
    })
  }

  /**
   * Update styles of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param srcInst - the instance of this symbol containing `child`
   * @param srcChild - the child which has the changes
   * @param changed - the changed styles
   * @param removed - the removed styles
   */
  applyStyle(srcInst: Component, srcChild: Component, changed: object, removed: string[]) {
    if(srcInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstInst.get(SYMBOL_SYNC_ATTRIBUTE) === false) return
      if(dstChild) {
        dstChild.setStyle({
          ...dstChild.getStyle(),
          ...changed,
        })
        removed.forEach(styleName => dstChild.removeStyle(styleName))
      } else {
        console.error(`Could not sync content for symbol ${this.cid}: ${srcChild.get(SYMBOL_CHILD_ID_ATTRIBUTE)} not found in ${dstInst.cid}`)
      }
    })
  }

  /**
   * Add a component to this symbol `instances`
   * Called at init when editor triggers a 'components:add' event
   * @param c
   */
  addInstance(c: Component) {
    this.get('instances')!.set(c.cid, c) // here we use cid as `instances` is built and not saved
  }

  /**
   * @return {Component} The created instance, ready to be added to a component
   */
  createInstance() {
    // Clone the model
    const inst = this.get('model')!.clone()
    // Add the component to the symbol instances
    this.addInstance(inst)
    // Let the caller add it to a component
    return inst
  }

  /**
   * @param c - a component
   * @return {Boolean} true if the component is a symbol
   */
  isInstance(c: Component) {
    return !!c.get(SYMBOL_ID_ATTRIBUTE)
      && this.get('instances')!.has(c.cid)
  }

  /**
   * unlink all instances of a symbol
   */
  unlinkAll() {
    this.get('instances')!.forEach((c: Component) => this.unlink(c))
  }

  /**
   * unlink an instance from a symbol
   * - remove the symbol ID from the attributes
   * - remove `symbolChildId` from all the children until they are symbols
   * - remove the reference in instances
   */
  unlink(c: Component) {
    c.set(SYMBOL_ID_ATTRIBUTE)
    this.get('instances')!.delete(c.cid)
    children(c)
      .forEach(child => child.set(SYMBOL_CHILD_ID_ATTRIBUTE))
  }
}

/**
 * @param c - a component, supposedly an instance of a symbol
 * @return the symbol ID if the component is a symbol
 */
export function getSymbolId(c: Component): string {
  return c.get(SYMBOL_ID_ATTRIBUTE)
}

/**
 * remove symbols IDs from an instance
 */
export function cleanup(c: Component) {
  c.set(SYMBOL_ID_ATTRIBUTE)
  c.set(SYMBOL_CHILD_ID_ATTRIBUTE)
}

/**
 * Init a component to be this symbol's `model`
 * Also init the component's children
 * @param {Component} c
 */
export function initModel(c: Component, { icon, label, symbolId }: ComponentProperties) {
  // check that it is not part of a Symbol already
  if(c.has(SYMBOL_ID_ATTRIBUTE)) {
    throw new Error('Could not init Symbol model: the model has already been init')
  }
  // This is the symbol cid
  c.set(SYMBOL_ID_ATTRIBUTE, symbolId)
  // add symbol data
  c.set('icon', `<span class="fa ${ icon }"></span>`)
  // Show that this is a symbol, add an icon to the toolbar UI
  const toolbar = c.get('toolbar')!
  // FIXME: somehow this happens twice => we should not have to do this check
  if(!toolbar.find(t => !!(t as any).isSymbol)) {
    toolbar.push({
      attributes: {
        class: 'fa fa-ban on fa-diamond',
        title: label,
      },
      command: 'do:nothing',
      isSymbol: true, // prevent add 2 buttons
    } as any)
  }
  // init children
  children(c)
    .forEach(child => initSymbolChild(child))
}

/**
 * Init a component to be this symbol's `model`'s child
 * @param {Component} c
 */
export function initSymbolChild(c: Component, force: boolean = false) {
  if(force || !c.has(SYMBOL_CHILD_ID_ATTRIBUTE)) {
    c.set(SYMBOL_CHILD_ID_ATTRIBUTE, c.cid)
  }
}

/**
 * create a new symbol ou of a component
 * the component and its children will be init
 * the component will be cloned and stored as the model
 * @return {Symbol}
 */
export function createSymbol(editor: SymbolEditor, c: Component, attributes: ComponentProperties): Symbol {
  const symbolId = attributes.symbolId ?? `s_${uniqueId()}_${new Date().getTime()}`

  // If the component is in a symbol, we need to update all instances
  const inst = closestInstance(c)

  // Init component with symbolId and children
  initModel(c, {
    ...attributes,
    symbolId,
  })
  // Create a Symbol
  const s = new Symbol({
    ...attributes,
    id: symbolId,
    // Clone the component, store a model
    model: c.clone(),
  })
  // Store a ref
  s.addInstance(c)

  // Handle the case where the new symbol is a child of another symbol
  if(inst) {
    // For all instances containing c, make c an instance of the new symbolId
    const parentSymbolId = getSymbolId(inst)
    const parentSymbol = editor.Symbols.get(parentSymbolId) as Symbol
    // For each child of the new symbol
    all(c)
      // For each instance of the parent symbol (containing a soon to be instance of s)
      .forEach(child => {
      // Here child is a component of the new symbol
        parentSymbol.getAll(null, inst)
          .forEach(otherInst => {
            // For each instance of s and its children
            const otherChild = find(otherInst, child.get(SYMBOL_CHILD_ID_ATTRIBUTE))
            console.log('otherChild', otherChild?.view?.el, otherChild?.get(SYMBOL_ID_ATTRIBUTE), otherChild?.get(SYMBOL_CHILD_ID_ATTRIBUTE))
            otherChild?.set(SYMBOL_ID_ATTRIBUTE, symbolId)
            otherChild?.set(SYMBOL_CHILD_ID_ATTRIBUTE, child.get(SYMBOL_CHILD_ID_ATTRIBUTE))
            // Add the new instance to the symbol
            if(child === c) {
              s.addInstance(otherChild)
            }
          })
      })
  }
  return s
}

export default Symbol
