const extract = require('./extract')

module.exports = async function (js, options) {
  return extract(js, 'src', options)
}
