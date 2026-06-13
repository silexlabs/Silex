const extract = require('./extract')

module.exports = async function (css, options) {
  return extract(css, 'href', options)
}
