import { internalLinksPlugin } from './internal-links'
import grapesjs from '../../../../node_modules/grapesjs/dist/grapes.min.js'

let editor
let nextId = 1
function getNewId() {
  return (nextId++).toString()
}
const comp1 = {
  tagName: 'a',
  content: 'link to main',
  attributes: { href: './index.html' },
}
const comp2 = {
  tagName: 'a',
  content: 'link to page 1',
  attributes: { href: './page-1.html' },
}
const comp3 = {
  tagName: 'a',
  content: 'link to page 2',
  attributes: { href: './page-2.html' },
}

const pageMain = {
  id: getNewId(),
  type: 'main',
  component: {
    tagName: 'div',
    components: [comp1, comp2],
  },
}
const page1 = {
  id: getNewId(),
  name: 'Page 1',
  component: {
    tagName: 'div',
    components: [comp3],
  },
}
const page2 = {
  id: getNewId(),
  name: 'Page 2',
  component: {
    tagName: 'div',
    components: [comp1, comp2, comp3],
  },
}
beforeEach(() => {
  editor = grapesjs.init({
    headless: true,
    storageManager: { autoload: 0 },
    pageManager: {
      pages: [pageMain, page1, page2],
    },
    plugins: [internalLinksPlugin],
  })
  expect(editor).not.toBeUndefined()
})
test('init', () => {
  expect(editor.getComponents()).toHaveLength(pageMain.component.components.length)
})
// test('rename page and rewrite links in current page', () => {
//  const page = editor.Pages.getSelected()
//  expect(page.id).toBe(pageMain.id)
//  expect(page.getName()).toBeUndefined()
//  const newName = 'Home page'
//  const newPath = './home-page.html'
//  // Do not work: page.setName(newName)
//  page.set('name', newName)
//  expect(page.getName()).toBe(newName)
//  const comp1Model = page.getMainComponent().components().find(c => c.attributes.content === comp1.content)
//  expect(comp1Model).toBeTruthy()
//  expect(comp1Model.attributes.attributes.href).toBe(newPath)
// })

test('rename page and rewrite links in another page', () => {
  const page = editor.Pages.get(page2.id)
  expect(page.get('name')).toBe(page2.name)
  const newName = 'Page 2 new-name'
  const newPath = './page-2-new-name.html'
  // Do not work: page.setName(newName)
  page.set('name', newName)
  expect(page.get('name')).toBe(newName)
  const comp1Model = page.getMainComponent().components().find(c => c.attributes.content === comp3.content)
  expect(comp1Model).toBeTruthy()
  expect(comp1Model.attributes.attributes.href).toBe(newPath)
})
