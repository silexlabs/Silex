
import { JSDOM } from 'jsdom'
import { prepareWebsite } from './WebsiteRouter'

test('open website', () => {
  // const router = WebsiteRouter({port: 0, rootUrl: ''}, null)
  // expect(router).not.toBeNull()
  document.body.innerHTML = 'some content'

  // empty website
  const emptyDom = new JSDOM(`
    <html><body>
    </body></html>
  `)
  expect(prepareWebsite(emptyDom, 'root url', {
    site: null,
    elements: [],
    pages: [],
  }, (path, el) => {
    return ''
  })).not.toBeNull()
  expect(Array.from(emptyDom.window.document.body.classList)).toEqual(['silex-editor'])

  // non empty website
  const domWithRuntimeClass = new JSDOM(`
    <html class="silex-runtime"><body>
    </body></html>
  `)
  prepareWebsite(domWithRuntimeClass, 'root url', {
    site: null,
    elements: [],
    pages: [],
  }, (path, el) => {
    return ''
  })
  expect(domWithRuntimeClass.window.document.querySelector('html').classList).toHaveLength(0)
  expect(Array.from(domWithRuntimeClass.window.document.body.classList)).toEqual(['silex-editor'])
})
