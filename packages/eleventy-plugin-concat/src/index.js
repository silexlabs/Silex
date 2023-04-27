const { parse } = require('node-html-parser')

function process(content, options) {
  const html = parse(content)
  const js = html.querySelectorAll(options.jsSelector)
  const css = html.querySelectorAll(options.cssSelector)
  return [processHtml(html, js, css, options), processJs(js, options), processCss(css, options)]
}

function untrim(str) {
  return str ? ` ${str}` : ''
}
function processHtml(html, js, css, options) {
  const head = html.querySelector('head')
  // New script
  js.length && head.insertAdjacentHTML('beforeend', `
    <script${untrim(options.jsAttributes)} src="${options.jsUrl}"></script>
  `)
  // New style
  css.length && head.insertAdjacentHTML('beforeend', `
    <link rel="stylesheet"${untrim(options.cssAttributes)} href="${options.cssUrl}"/>
  `)
  // Remove old ones
  js.forEach(el => el.remove())
  css.forEach(el => el.remove())
  return html.toString()
}

function processJs(js, options) {
  return ''
}

function processCss(css, options) {
  return ''
}

module.exports = {
  process,
  processHtml,
  processJs,
  processCss,
}
