import { JSDOM } from 'jsdom'
import { URL } from 'url'

import { ELEM_TEXT } from '../../test-utils/data-set'
import { ElementState, LinkType } from '../../client/element-store/types'
import { prepareWebsite, unprepareWebsite } from './WebsiteRouter'

const ELEM_TEXT_STATE = ELEM_TEXT as ElementState

describe('open website (prepareWebsite)', () => {
  test('empty website', () => {
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
    }, new URL('http://test.com')))
    expect(Array.from(emptyDom.window.document.body.classList)).toEqual(['silex-editor'])

    const domWithRuntimeClass = new JSDOM(`
      <html class="silex-runtime"><body>
      </body></html>
    `)
    prepareWebsite(domWithRuntimeClass, 'root url', {
      site: null,
      elements: [],
      pages: [],
    }, new URL('http://test.com'))
    expect(domWithRuntimeClass.window.document.querySelector('html').classList).toHaveLength(0)
    expect(Array.from(domWithRuntimeClass.window.document.body.classList)).toEqual(['silex-editor'])
  })
  test('links from relative to absolute', () => {
    const dom = new JSDOM(`
      <html class="silex-runtime"><body>
        <a class="editable-element" href="./a/b.html"></a>
        <a class="link-in-text" href="./a/b.html"></a>
        <style class="stylesheet" href="./a/b.html"></a>
      </body></html>
    `)
    const transformedData = prepareWebsite(dom, 'http://test.com/dest/', {
      site: null,
      elements: [{
        ...ELEM_TEXT_STATE,
        link: {linkType: LinkType.URL, href: './a/b.html'},
      }],
      pages: [],
    }, new URL('http://test.com/source/'))

    // no change for links
    expect(dom.window.document.querySelector('.editable-element').getAttribute('href')).toBe('./a/b.html')
    expect(dom.window.document.querySelector('.link-in-text').getAttribute('href')).toBe('./a/b.html')
    expect(transformedData.elements[0].link.href).toBe('./a/b.html')
    // change stylesheets
    expect(dom.window.document.querySelector('.stylesheet').getAttribute('href')).toBe('http://test.com/source/a/b.html')
  })
})

describe('save website (unprepareWebsite)', () => {
  test('1 image with abs path', () => {
    const dom = new JSDOM(`
      <html class="silex-runtime"><body>
        <div class="editable-element">
          <img src="/ce/dropbox/get/assets/test.png" />
        </div>
      </body></html>
    `)
    const transformedData = unprepareWebsite(dom, {
      site: null,
      elements: [{
        ...ELEM_TEXT_STATE,
        link: {linkType: LinkType.URL, href: './a/b.html'},
      }],
      pages: [],
    },
    'https://editor.silex.me/', new URL('https://editor.silex.me/ce/dropbox/get/tmp/'))

    expect(dom.window.document.querySelector('.editable-element img').getAttribute('src')).toBe('../assets/test.png')
  })
  test('1 image with abs URL', () => {
    const dom = new JSDOM(`
      <html class="silex-runtime"><body>
        <div class="editable-element">
          <img src="https://editor.silex.me/ce/dropbox/get/assets/test.png" />
        </div>
      </body></html>
    `)
    const transformedData = unprepareWebsite(dom, {
      site: null,
      elements: [{
        ...ELEM_TEXT_STATE,
        link: {linkType: LinkType.URL, href: './a/b.html'},
      }],
      pages: [],
    },
    'https://editor.silex.me/', new URL('https://editor.silex.me/ce/dropbox/get/tmp/'))

    expect(dom.window.document.querySelector('.editable-element img').getAttribute('src')).toBe('../assets/test.png')
  })
})
