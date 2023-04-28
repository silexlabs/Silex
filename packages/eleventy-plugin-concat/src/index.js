const { parse } = require('node-html-parser')
const processHtml = require('./processHtml')
const processJs = require('./processJs')
const processCss = require('./processCss')

async function process(content, options) {
  const html = parse(content)
  const js = html.querySelectorAll(options.jsSelector)
  const css = html.querySelectorAll(options.cssSelector)
  return Promise.all([processHtml(html, js, css, options), processJs(js, options), processCss(css, options)])
}

module.exports = {
  process,
  processHtml,
  processJs,
  processCss,
}
