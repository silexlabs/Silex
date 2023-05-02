function untrim(str) {
  return str ? ` ${str}` : ''
}

module.exports = async function (page, html, js, css, options) {
  const head = html.querySelector('head')
  // New script
  js.length && head.insertAdjacentHTML('beforeend', `
    <script${untrim(options.jsAttributes)} src="${options.jsUrl(page)}"></script>
  `)
  // New style
  css.length && head.insertAdjacentHTML('beforeend', `
    <link rel="stylesheet"${untrim(options.cssAttributes)} href="${options.cssUrl(page)}"/>
  `)
  // Remove old ones
  js.forEach(el => el.remove())
  css.forEach(el => el.remove())
  return html.toString()
}

