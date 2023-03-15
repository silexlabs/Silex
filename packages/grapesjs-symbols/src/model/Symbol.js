import Backbone from 'backbone'

import { find, all, children } from '../utils.js'
import { uniqueId } from 'underscore'

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
const SymbolModel = Backbone.Model.extend({
  /**
   * Default options passed to the constructor
   */
  defaults: {
    label: 'New Symbol',
    icon: 'fa-question',
  },

  /**
   * @param {{ label: ?string, icon: ?string }} attributes
   * @param {Object} model - to be converted to Component and stored in attributes.model
   * Notes:
   * - `attributes.instances` will initially be empty until addInstance is called by the Symbols class (onAdd method)
   * - `attributes.model` may initially be a Component (creation of a Symbol) or JSON data (loaded symbol from storage). It is always converted to a Component in `initialize`
   *
   */
  initialize(attributes) {
    // Check the required instances on the symbol
    if(!this.has('instances')) {
      this.set('instances', new Map())
    }
    if(!this.has('model')) throw new Error('Could not create Symbol: model is required')
    // `attributes.model` may initially be a Component (creation of a Symbol) or JSON data (loaded symbol from storage). It is always converted to a Component in `initialize`
    // TODO: Needs review
    // convert model to a real component
    const model = this.get('model')
    if(!model.cid) { // FIXME: should be typeof model = 'string'
      const { editor } = this.collection
      const [modelComp] = editor.addComponents([model])
      this.set('model', modelComp)
    }
  },

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
  },

  /**
   * Get all instances as an Array, except the `excludeOne` one
   * @param {(Component) => void} callback which receives the instances
   * @param {Component} excludeOne - optionally exclude one component
   * @param {Component} addOne - optionally add one component, typically pass the symbol's `model` attribute when needed
   * @returns {Array.<Component>}
   * @private
   */
  getAll(addOne = null, excludeOne = null) {
    const values = Array.from(this.get('instances').values())
    return (addOne ? [addOne] : []).concat(excludeOne ? values.filter(inst => inst.cid != excludeOne.cid) : values)
  },

  /**
   * Browse all instances and their children matching the changed component
   * Includes the `model` of this symbol
   * Will not include the provided instance `srcInst` nor `srcChild` as they are the ones which changed
   * @param {Component} srcInst - the instance of this symbol containing `child`
   * @param {Component} srcChild - the child which has the changes
   */
  browseInstancesAndModel(srcInst, srcChildren, cbk, err) {
    this.getAll(this.get('model'), srcInst)
      .forEach(dstInst => {
        const dstChildren = srcChildren
          .map(srcChild => {
          // Get a child or the root
            return srcChild.has('symbolId')
              ? dstInst // this is the root
              : find(dstInst, srcChild.get('symbolChildId')) // this is a child
          })
        cbk(dstChildren, dstInst)
      })
  },

  /**
   * Apply css classes to all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * @param {Component} srcInst - the instance of this symbol containing `child`
   * @param {Component} srcChild - the child which has the changes
   */
  applyClasses(srcInst, srcChild) {
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstChild) {
        dstChild.setClass(srcChild.getClasses())
      } else {
        console.error(`Could not sync classes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
      }
    })
  },

  getIndex(parent, symbolChildId) {
    // TODO: Needs review
    return parent.components().toArray()
      .findIndex(c => c.get('symbolChildId') === symbolChildId)
  },

  /**
   * Update attributes of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * @param {Component} srcInst - the instance of this symbol containing `child`
   * @param {Component} srcChild - the child which has the changes
   */
  applyChildren(srcInst, srcChild) {
    const parent = srcChild.parent()
    const allInst = all(srcInst)
    if(allInst.includes(parent)) {
      // the child is in the instance
      const symbolChildId = srcChild.get('symbolChildId')
      // Case of a child being duplicated inside the symbol
      const isDuplicate = !!symbolChildId && allInst
        .filter(c => c.get('symbolChildId') === symbolChildId && c.parent() === parent).length > 1
      if(symbolChildId && !isDuplicate) {
        // Case of a moving child inside the instance
        this.browseInstancesAndModel(srcInst, [srcChild, parent], ([dstChild, dstParent], dstInst) => {
          if(dstChild && dstParent) {
            dstParent.append(dstChild, { at: srcChild.index() })
          } else {
            console.error(`Could not sync child for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`, {dstChild, dstParent})
          }
        })
      } else {
        // this is a new child
        all(srcChild)
          .forEach(c => initSymbolChild(c))
        this.browseInstancesAndModel(srcInst, [parent], ([dstParent], dstInst) => {
          if(dstParent) {
            const clone = srcChild.clone()
            dstParent.append(clone, { at: srcChild.index() })
          } else {
            console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
          }
        })
      }
    } else {
      // Child is not there anymore
      this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
        if(dstChild) {
          dstChild.remove()
        } else {
          console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
        }
      })
      // this child is not part of a symbol anymore
      srcChild.set('symbolChildId')
    }
  },

  /**
   * Update attributes of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * @param {Component} srcInst - the instance of this symbol containing `child`
   * @param {Component} srcChild - the child which has the changes
   */
  applyAttributes(srcInst, srcChild) {
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstChild) {
        // doesnt work: dstChild.setAttributes(srcChild.getAttributes())
        dstChild.attributes = srcChild.attributes
      } else {
        console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
      }
    })
  },

  /**
   * Update text content of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param {Component} srcInst - the instance of this symbol containing `child`
   * @param {Component} srcChild - the child which has the changes
   */
  applyContent(srcInst, srcChild) {
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstChild) {
        if(dstChild.get('type') === 'text') { // FIXME: sometimes type is ""
          //dstChild.components(srcChild.toHTML())
          dstChild.components(srcChild.getCurrentView().getContent())
        }
        else { console.error('applyContent, NOT A TEXT', dstChild, dstChild.get('type')) }
      } else {
        console.error(`Could not sync content for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
      }
    })
  },

  /**
   * Update styles of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param {Component} srcInst - the instance of this symbol containing `child`
   * @param {Component} srcChild - the child which has the changes
   * @param {Object} changed - the changed styles
   * @param {Array.string} removed - the removed styles
   */
  applyStyle(srcInst, srcChild, changed, removed) {
    this.browseInstancesAndModel(srcInst, [srcChild], ([dstChild], dstInst) => {
      if(dstChild) {
        dstChild.setStyle({
          ...dstChild.getStyle(),
          ...changed,
        })
        removed.forEach(styleName => dstChild.removeStyle(styleName))
      } else {
        console.error(`Could not sync content for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
      }
    })
  },

  /**
   * Add a component to this symbol `instances`
   * Called at init when editor triggers a 'components:add' event
   * @param {Component} c
   */
  addInstance(c) {
    this.get('instances').set(c.cid, c) // here we use cid as `instances` is built and not saved
  },

  /**
   * @return {Component} The created instance, ready to be added to a component
   */
  createInstance() {
    // Clone the model
    const inst = this.get('model').clone()
    // Add the component to the symbol instances
    this.addInstance(inst)
    // Let the caller add it to a component
    return inst
  },

  /**
   * @param {Component} c - a component
   * @return {Boolean} true if the component is a symbol
   */
  isInstance(c) {
    return !!c.get('symbolId')
      && this.get('instances').has(c.cid)
  },

  /**
   * unlink all instances of a symbol
   */
  unlinkAll() {
    this.get('instances').forEach(c => this.unlink(c))
  },

  /**
   * unlink an instance from a symbol
   * - remove the symbol ID from the attributes
   * - remove `symbolChildId` from all the children until they are symbols
   * - remove the reference in instances
   */
  unlink(c) {
    c.set('symbolId')
    this.get('instances').delete(c.cid)
    children(c)
      .forEach(child => child.set('symbolChildId'))
  },
})

/**
 * @param {Component} c - a component, supposedly an instance of a symbol
 * @return {string} the symbol ID if the component is a symbol
 */
export function getSymbolId(c) {
  return c.get('symbolId')
}

/**
 * remove symbols IDs from an instance
 */
export function cleanup(c) {
  c.set('symbolId')
  c.set('symbolChildId')
}

/**
 * Init a component to be this symbol's `model`
 * Also init the component's children
 * @param {Component} c
 */
export function initModel(c, { icon, label, symbolId }) {
  // check that it is not part of a Symbol already
  if(c.has('symbolId')) {
    throw new Error('Could not init Symbol model: the model has already been init')
  }
  // This is the symbol cid
  c.set('symbolId', symbolId)
  // add symbol data
  c.set('icon', `<span class="fa ${ icon }"></span>`)
  // Show that this is a symbol, add an icon to the toolbar UI
  const toolbar = c.get('toolbar')
  // FIXME: somehow this happens twice => we should not have to do this check
  if(!toolbar.find(t => !!t.isSymbol)) {
    toolbar.push({
      attributes: {
        class: 'fa fa-ban on fa-diamond',
        title: label,
      },
      command: 'do:nothing',
      isSymbol: true, // prevent add 2 buttons
    })
  }
  // init children
  children(c)
    .forEach(child => initSymbolChild(child))
}

/**
 * Init a component to be this symbol's `model`'s child
 * @param {Component} c
 */
export function initSymbolChild(c) {
  if(!c.has('symbolChildId')) {
    c.set('symbolChildId', c.cid)
  }
}

/**
 * create a new symbol ou of a component
 * the component and its children will be init
 * the component will be cloned and stored as the model
 * @return {SymbolModel}
 */
export function createSymbol(c, attributes) {
  const symbolId = attributes.symbolId ?? uniqueId()
  // Init component with symbolId and children
  initModel(c, {
    ...attributes,
    symbolId,
  })
  // Create a Symbol
  const s = new SymbolModel({
    ...attributes,
    id: symbolId,
    // Clone the component, store a model
    model: c.clone(),
  })
  // Store a ref
  s.addInstance(c)
  return s
}

export default SymbolModel

