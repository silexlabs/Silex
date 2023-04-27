const assert = require('assert')
const {process} = require('./')
const defaults = require('./defaults')

function getTestHtml(scripts = [], styles = []) {
  scripts = scripts ?? []
  styles = styles ?? []
  return cleanup(`
    <head>
      ${ scripts.map(script => `
      <script ${script.attributes || ''}>${script.content || ''}</script>
      `).join('\n')}
      ${ styles.map(style => style.content ? `
      <link rel="stylesheet" ${style.attributes || ''}>${style.content || ''}</link>
      ` : `
      <link rel="stylesheet" ${style.attributes || ''}>
      `).join('\n')}
    </head>
  `)
}
function cleanup(str) {
  return str
    .split('\n')
    .map(line => line.trim())
    .filter(line => !!line)
    .join('\n')
}
it('test of getTestHtml', () => {
  assert.equal(getTestHtml([
    {attributes: 'data-concat', content: 'script 1'},
  ]), cleanup(`<head>
      <script data-concat>script 1</script>
    </head>`))
  assert.equal(getTestHtml(null, [
    {attributes: 'data-concat', content: 'style 1'},
  ]), cleanup(`<head>
      <link rel="stylesheet" data-concat>style 1</link>
    </head>`))
  assert.equal(getTestHtml(null, [
    {attributes: 'data-concat'},
  ]), cleanup(`<head>
      <link rel="stylesheet" data-concat>
    </head>`))
})

it('should do nothing', () => {
  {
    const [html, js, css] = process('', defaults)
    assert.equal(html, '')
    assert.deepEqual(js, '')
    assert.deepEqual(css, '')
  }
  {
    const init = '<body><script></script><style></style></body>'
    const [html, js, css] = process(init, defaults)
    assert.equal(html, init)
    assert.deepEqual(js, '')
    assert.deepEqual(css, '')
  }
  {
    const init = '<head><script></script><style></style></head>'
    const [html, js, css] = process(init, defaults)
    assert.equal(html, init)
    assert.deepEqual(js, '')
    assert.deepEqual(css, '')
  }
})
it('concat inline scripts', () => {
  {
    const init = getTestHtml([
      {attributes: 'data-concat', content: 'script 1'},
      {attributes: 'data-concat', content: 'script 2'},
    ])
    const [html, js, css] = process(init, defaults)
    assert.deepEqual(cleanup(html), getTestHtml([
      {attributes: `src="${defaults.jsUrl}"`},
    ]))
    assert.deepEqual(js, `script 1\nscript 2`)
  }
})
it('concat inline styles', () => {
  {
    const init = getTestHtml(null, [
      {attributes: 'data-concat', content: 'style 1'},
      {attributes: 'data-concat', content: 'style 2'},
    ])
    const [html, js, css] = process(init, defaults)
    assert.deepEqual(cleanup(html), getTestHtml(null, [
      {attributes: `href="${defaults.cssUrl}"`},
    ]))
    assert.deepEqual(css, `style 1\nstyle 2`)
  }
})
