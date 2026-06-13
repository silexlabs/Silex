const { parse } = require('node-html-parser')
const processHtml = require('./processHtml')
const processJs = require('./processJs')
const processCss = require('./processCss')

async function process(page, content, options) {
  const html = parse(content)
  const js = html.querySelectorAll(options.jsSelector)
  const css = html.querySelectorAll(options.cssSelector)
  if (!options.quiet) {
    console.log(`[11ty][Concat Plugin] Concat ${js.length} JS files and ${css.length} CSS files`)
  }
  return Promise.all([processHtml(page, html, js, css, options), processJs(js, options), processCss(css, options)])
}

module.exports = {
  process,
  processHtml,
  processJs,
  processCss,
}
