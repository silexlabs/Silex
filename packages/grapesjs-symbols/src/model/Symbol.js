import Backbone from 'backbone'

export default Backbone.Model.extend({
  defaults: {
    label: 'New Symbol',
    icon: 'fa-question',
  },

  initialize(attributes, options) {
    if(!this.has('id')) this.set('id', this.cid)
    this.set('components', new Map()) // this will be initialized with attributes.components when the components are actually created and the components:create is dispatched by editor
  },

  /**
   * Return a shallow copy of the model's attributes for JSON
   * stringification.
   * @return {Object}
   * @private
   */
  toJSON(opts = {}) {
    const obj = Backbone.Model.prototype.toJSON.call(this, opts)
    delete obj.components
    return obj
  },

  /**
   * Browse all symbol instances
   * @param excluded optionally exclude one component
   * @private
   */
  sync(cbk, excluded = null) {
    const arr = Array.from(this.get('components'))
    const filtered = excluded ? arr.filter(([id, comp]) => comp != excluded) : arr
    filtered.forEach(([id, comp]) => cbk(comp))
  },

  /**
   * Update according to changes of a component
   */
  syncAttributes(comp, child) {
    const { changed, _previousAttributes } = child
    this.sync(comp => {
      const newChild = find(comp, child)
      if(newChild) {
        Object.keys(changed).forEach(attr => {
          if(!_previousAttributes || _previousAttributes[attr] !== changed[attr]) {
            newChild.set(attr, changed[attr])
          }
        })
      } else {
        console.error(`Could not sync attributes of component ${child} which was supposed to be a child of ${comp} which is an instance of the symbol ${this}`)
      }
    }, comp)
  },

  getComponents() {
    return this.get('components')
  }
})

export function find(c, child) {
  if(child.has('symbolId') && c.get('symbolId') === child.get('symbolId')) {
    // case of a symbol
    return c
  } else if(child.has('symbolChildId') && c.get('symbolChildId') === child.get('symbolChildId')){
    // case of an element in the current component
    return c
  } else {
    // check the children components
    return c.get('components')
      .find(comp => find(comp, child))
  }
}

/**
 * @param {object} c, a component
 * @return {string} the symbol ID if the component is a symbol
 */
export function isSymbol(c) {
  return !!c.get('symbolId')
}

/**
 * @param {object} c, a component
 * @return {string} the symbol ID if the component is a symbol
 */
export function getSymbolId(c) {
  return c.get('symbolId')
}

/**
 * @param {object} c, a component
 * @param {object} symbolId, a symbol ID
 */
export function setSymbolId(c, symbolId) {
  return c.set('symbolId', symbolId)
}

export function initAsSymbol(c, s) {
  if(!c.has('symbol:init')) {
    c.set('pre-symbol:icon', c.get('icon'))
    c.set('icon', `<span class="fa ${s.get('icon')}"></span>`)
    c.set('symbolId', s.get('id') || s.cid) // optionally take id from attributes in case we specified it (e.g in tests)
    c.set('symbol:init', true)
    c.components()
      .forEach(child => initAsSymbolChild(child))
  }
  // c.get('toolbar').push({ attributes: {class: 'fa fa-ban on fa-diamond'}, command: 'symbols:remove' })
}

export function initAsSymbolChild(c) {
  // FIXME: the key symbolChildId should have the symbolId in it, to avoid conflicts when a symbol is in multiple symbols
  if(!c.has('symbolChildId')) {
    c.set('symbolChildId', c.cid)
  } else {
    console.error(`Could not init the component ${c} as a child of a symbol, it has already a symbolChildId set to ${c.get('symbolChildId')}`)
  }
  c.components()
    .forEach(child => initAsSymbolChild(child))
}

export function removeAsSymbol(c) {
  // no symbol id
  setSymbolId(c)
}

