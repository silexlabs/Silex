import Backbone from 'backbone'

import { find } from '../utils.js'

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
      console.log('CONVERT DATA TO COMPONENT', {model})
      const { editor } = this.collection
      const [modelComp] = editor.addComponents([model])
      this.set('model', modelComp)
    }
    if(!this.get('model').has('symbolId')) {
      console.log('?NEED TO CALL INIT MODEL?')
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
   * Update all symbol instances and their children according to changes of a component
   * Also update the `model` attribute of this symbol
   * Will not update the provided instance `inst` as it is the one which changed
   * @param {Component} inst - the instance of this symbol containing `child`
   * @param {Component} child - the child which has the changes, with `_previousAttributes` and `getChangedProps` props
   */
  applyAttributes(srcInst, srcChild) {
    const { _previousAttributes } = srcChild
    const symbolChildId = srcChild.get('symbolChildId')
    const changed = srcChild.getChangedProps()
    this.getAll(this.get('model'), srcInst)
      .forEach(dstInst => {
        // update a child or the root
        const dstChild = srcChild.has('symbolId') ? dstInst : find(dstInst, symbolChildId)
        // check that we found a component to update
        if(dstChild) {
          console.log(srcChild.get('test'), '-', srcInst.get('test'), '-', dstChild.get('test'), '-', dstInst.get('test'))
          // update each attribute
          Object.keys(changed).forEach(attr => {
            if(!_previousAttributes || _previousAttributes[attr] !== changed[attr]) {
              dstChild.set(attr, changed[attr])
            }
          })
        } else {
          throw new Error(`Could not sync attributes for symbol ${this.cid}: ${srcChild.get('symbolChildId')} not found in ${dstInst.cid}`)
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
   * remove a component to this symbol `instances`
   */
  removeInstance(c) {
    this.get('instances').delete(c.cid)
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
    c.components()
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
   * Also init the component's children
   * @param {Component} c
   */
  initSymbolChild(c) {
    // store this symbol's ID
    if(!c.has('symbolChildId')) c.set('symbolChildId', c.cid)

    // if this component is not a symbol's instance
    if(!isInstance(c)) {
      // handle the component's children
      c.components()
        .forEach(child => this.initAsSymbolChild(child))
    } else {
      console.info('the symbol', this, 'has a symbol instance in it', c)
    }
  },
})

/**
 * @param {Component} c - a component
 * @return {string} the symbol cid if the component is a symbol
 */
export function isInstance(c) {
  return !!c.get('symbolId')
}

/**
 * @param {Component} c - a component, supposedly an instance of a symbol
 * @return {string} the symbol ID if the component is a symbol
 */
export function getSymbolId(c) {
  return c.get('symbolId')
}

/**
 * unlink an instance from a symbol
 * this just removes the symbol ID from the attributes
 * which in turn will trigger a component:change and remove it from the `instances`
 */
export function unlink(c) {
  c.set('symbolId')
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
