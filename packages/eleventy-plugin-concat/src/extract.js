const {resolve} = require('path')
const {readFile} = require('fs/promises')
const fetch = require('node-fetch')

module.exports = async function (node, attribute, options) {
  const result = await Promise.all(
    node
      .map(async script => {
        if(script.hasAttribute(attribute)) {
          const src = script.getAttribute(attribute)
          if(isExternal(src, options)) {
            const response = await fetch(src)
            return response.text()
          } else {
            const localPath = getLocalPath(src, options)
            const content = await readFile(localPath)
            return content.toString()
          }
        } else {
          return script.innerText
        }
      })
  )
  // Add a ";" to avoid problems when scripts ends with a line without a ";"
  // Add a "\n" to avoid problems when scripts end with a comment
  return result.join(';\n')
}

function isExternal(src, options) {
  if(!src) return false
  if(src.startsWith(options.baseUrl)) return false
  if(src.startsWith('http://')) return true
  if(src.startsWith('https://')) return true
  return false
}

function getLocalPath(src, options) {
  const urlPath = (() => {
    if(src.startsWith(options.baseUrl)) {
      return src.substring(options.baseUrl.length + 1)
    }
    // Remove leading slash if any
    // This is because urls like /a/b.js => ./js/b.js
    return src.replace(/^\//, '')
  })()
  // Use output here to get files after Passthrough Copy
  return resolve(options.output, urlPath)
}

