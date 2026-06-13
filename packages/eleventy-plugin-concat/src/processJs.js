const extract = require('./extract')

module.exports = async function (js, options) {
  // Add a ";" to avoid problems when scripts ends with a line without a ";"
  // Add a "\n" to avoid problems when scripts end with a comment
  return extract(js, 'src', options, ';\n')
}
