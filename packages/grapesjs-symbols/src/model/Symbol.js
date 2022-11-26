import Backbone from 'backbone'

import { find, instanceComponents, instanceChildren } from '../utils.js'

/**
 * A Symbol class holds the data about a symbol: label, icon
 * The `model` attribute is a grapesjs Component used to create new instances
 * The `instances` attribute is a Map of grapesjs Components kept in sync with the model
 * The model is kept up to date by calling the apply* methods
 * 
 * @member {string} attributes.symbolId
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
   * @param {{ symbolId: ?string, label: ?string, icon: ?string }} attributes
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
    // Check the required symbolId on the symbol
    if(!this.has('symbolId')) {
      // Case of a symbol creation with `createSymbol`
      this.set('symbolId', this.cid)
    } else {
      // Otherwise take the symbolId as cid
      // This is useful to get the symbol out of a symbolId in the Symbols collection
      this.cid = this.get('symbolId')
    }
    // check the required symbolId and symbolChildId on the model
    if(!this.has('model')) throw new Error('Could not create Symbol: model is required')
    // convert model to a real component
    const model = this.get('model')
    if(!model.cid) {
      const { editor } = this.collection
      const [modelComp] = editor.addComponents([model])
      this.set('model', modelComp)
    }
    if(!this.get('model').has('symbolId')) {
      //console.log('?WHY NEED TO CALL INIT MODEL? it shoudld be done by backbone?', this)
      // FIXME: ?WHY NEED TO CALL INIT MODEL? it shoudld be done by backbone?
      // case of a symbol creation with `createSymbol`
      this.initModel(this.get('model'))
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
    return (addOne ? [addOne] : []).concat(excludeOne ? values.filter(inst => inst != excludeOne) : values)
  },

  /**
   * Apply css classes to all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param {Component} inst - the instance of this symbol containing `child`
   * @param {Component} child - the child which has the changes
   */
  applyClasses(srcInst, srcChild) {
    const symbolChildId = srcChild.get('symbolChildId')
    this.getAll(this.get('model'), srcInst)
      .forEach(dstInst => {
        // update a child or the root
        const dstChild = srcChild.has('symbolId') ? dstInst : find(dstInst, symbolChildId)
        // check that we found a component to update
        if(dstChild) {
          // update css classes
          dstChild.setClass(srcChild.getClasses())
        } else {
          console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
        }
      })
  },

  /**
   * Update attributes of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param {Component} inst - the instance of this symbol containing `child`
   * @param {Component} child - the child which has the changes, with `_previousAttributes` and `getChangedProps` props
   */
  applyAttributes(srcInst, srcChild) {
    const symbolChildId = srcChild.get('symbolChildId')
    this.getAll(this.get('model'), srcInst)
      .forEach(dstInst => {
        // update a child or the root
        const dstChild = srcChild.has('symbolId') ? dstInst : find(dstInst, symbolChildId)
        // check that we found a component to update
        if(dstChild) {
          dstChild.setAttributes(srcChild.getAttributes())
        } else {
          console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
        }
      })
  },


  /**
   * Update text content of all instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param {Component} inst - the instance of this symbol containing `child`
   * @param {Component} child - the child which has the changes, with `_previousAttributes` and `getChangedProps` props
   */
  applyContent(srcInst, srcChild) {
    const symbolChildId = srcChild.get('symbolChildId')
    this.getAll(this.get('model'), srcInst)
      .forEach(dstInst => {
        // update a child or the root
        const dstChild = srcChild.has('symbolId') ? dstInst : find(dstInst, symbolChildId)
        // check that we found a component to update
        if(dstChild) {
          if(dstChild.attributes.type === 'text') {
            console.log('applyContent', {srcInst, srcChild, dstInst, dstChild})
            dstChild.components(srcChild.toHTML())
          }
        } else {
          console.error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
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
   * Init a component to be this symbol's `model`
   * Also init the component's children
   * @param {Component} c
   */
  initModel(c) {
    // check that it is not part of a Symbol already
    if(c.has('symbolId')) throw new Error('Could not init Symbol model: the model has already been init')
    // add symbol data
    c.set('icon', `<span class="fa ${this.get('icon')}"></span>`)
    c.set('symbolId', this.get('symbolId'))
    // show that this is a symbol
    c.get('toolbar').push({ attributes: {class: 'fa fa-ban on fa-diamond'}, command: 'do:nothing' })
    // init children
    instanceChildren(c)
      .forEach(child => this.initSymbolChild(child))
  },

  /**
   * Init a component to be this symbol's `model`
   * Also init the component's children
   * @param {Component} c
   */
  initSymbolInstance(c) {
    this.initModel(c)
    this.get('instances').set(c.cid, c)
  },

  /**
   * Init a component to be this symbol's `model`'s child
   * @param {Component} c
   */
  initSymbolChild(c) {
    // store this symbol's ID
    if(!c.has('symbolChildId')) c.set('symbolChildId', c.cid)
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
    instanceComponents(c)
      .forEach(cc => {
        if(cc === c) {
          c.set('symbolId')
          this.get('instances').delete(c.cid)
        } else {
          c.set('symbolChildId')
        }
      })
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
 * create a new symbol ou of a component
 * the component and its children will be init
 * the component will be cloned and stored as the model
 * @return {SymbolModel}
 */
export function createSymbol(c, attributes) {
  const s = new SymbolModel({
    ...attributes,
    model: c.clone(),
  })
  s.initSymbolInstance(c)
  return s
}

export default SymbolModel
