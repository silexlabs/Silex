import Backbone from 'backbone'

export default Backbone.Model.extend({
  defaults: {
    label: 'New Symbol',
    icon: 'fa-question',
  },

  initialize(attributes, options) {
    this.set('components', new Map())
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
   * Update according to changes of a component
   */
  update(c) {
    this.data = {
      content: c.get('content'),
      json: c.toJSON(),
    }
    Array.from(this.get('components'))
      .filter(([id, comp]) => comp != c)
      .forEach(([id, comp]) => comp.set('content', this.data.content))
  },
})

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

