function untrim(str) {
  return str ? ` ${str}` : ''
}

module.exports = async function (html, js, css, options) {
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

