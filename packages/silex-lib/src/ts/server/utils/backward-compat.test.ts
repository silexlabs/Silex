import { LinkType } from '../../client/element-store/types'
import { cleanupBefore } from './BackwardCompatV2.5.60'
import { mockUiElements } from '../../test-utils/data-set'

const {siteIFrame} = mockUiElements()

import * as fs from 'fs'
import { getElementsFromDomBC, getPagesFromDom, getSiteFromDom } from './BackwardCompatV2.5.60'
import { ElementType } from '../../client/element-store/types'
import BackwardCompat from './BackwardCompat'

test('remove useless elements', () => {
  const bc = new BackwardCompat('root url', __dirname + '/../../../..')
  siteIFrame.contentDocument.body.innerHTML = '<div class="test-class"></div>'
  expect(siteIFrame.contentDocument.body.children).toHaveLength(1)
  bc.removeIfExist(siteIFrame.contentDocument, '.test-class')
  expect(siteIFrame.contentDocument.body.children).toHaveLength(0)
})

test('convert from 2.5.60', () => {
  const htmlBuffer = fs.readFileSync(__dirname + '/../../test-utils/editable-v2.5.60.html')
  expect(htmlBuffer).not.toBeNull()
  const htmlString = htmlBuffer.toString()
  expect(htmlString).not.toBeNull()
  expect(htmlString).toMatch(/^<!DOCTYPE html>/)
  siteIFrame.contentDocument.write(htmlString)
  expect(siteIFrame.contentDocument.body).not.toBeNull()

  const TEXT_ELEMENT_ID = 'silex-id-1442914737143-3'
  const IMAGE_ELEMENT_ID = 'silex-id-1439573539993-24'
  const BODY_ID = 'body-initial'
  const COMPONENT_ID = 'silex-id-1526234059780-5'
  const COMPONENT2_ID = 'silex-id-1585068099307-0'
  const SECTION_ID = 'silex-id-1478366450713-3'
  const SECTION_CONTAINER_ID = 'silex-id-1478366450713-2'

  // import elements
  siteIFrame.contentDocument.body.classList.add('editable-style')
  cleanupBefore(siteIFrame.contentDocument)
  const elements = getElementsFromDomBC(siteIFrame.contentDocument)
  expect(elements).not.toBeNull()
  expect(elements).toHaveLength(11)
  expect(elements.filter((el) => el.type === ElementType.SECTION)).toHaveLength(3)
  expect(elements.filter((el) => el.type === ElementType.CONTAINER)).toHaveLength(4)
  expect(elements.filter((el) => el.type === ElementType.TEXT)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.IMAGE)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.HTML)).toHaveLength(2) // the 2 components are based on HTML Box
  expect(elements.find((el) => el.id === TEXT_ELEMENT_ID).title).toEqual('test title')
  expect(elements.find((el) => el.id === IMAGE_ELEMENT_ID).alt).toEqual('test alt')
  expect(elements.find((el) => el.id === BODY_ID).classList).toEqual([
    // 'body-initial',
    // 'all-style',
    // 'enable-mobile',
    // 'prevent-draggable',
    // 'prevent-resizable',
    // 'prevent-selectable',
    // 'silex-runtime',
    // 'editable-style',
    'test-custom-class',
  ])
  expect(elements.find((el) => el.id === TEXT_ELEMENT_ID).innerHtml).toContain('www.silex.me')

  // links
  expect(elements.filter((el) => el.type === ElementType.HTML)[0].link).toBeNull()
  expect(elements.filter((el) => el.type === ElementType.IMAGE)[0].link).not.toBeNull()
  expect(elements.filter((el) => el.type === ElementType.IMAGE)[0].link).toEqual({
    linkType: LinkType.PAGE,
    href: '#!page-page-1',
  })
  expect(elements.filter((el) => el.type === ElementType.TEXT)[0].link).not.toBeNull()
  expect(elements.filter((el) => el.type === ElementType.TEXT)[0].link).toEqual({
    linkType: LinkType.URL,
    href: 'https://www.silex.me',
  })

  // body
  const body = elements.find((el) => el.id === BODY_ID)
  expect(body.innerHtml).toBe('')

  // component data
  const component = elements.find((el) => el.id === COMPONENT_ID)
  expect(component.type).toBe(ElementType.HTML)
  expect(component.data.component.templateName).toBe('form')
  expect(component.data.component.data).not.toBeNull()
  expect(component.data.component.data.buttonBackgroundColor).toBe('#FF0000')

  const component2 = elements.find((el) => el.id === COMPONENT2_ID)
  expect(component2.type).toBe(ElementType.HTML)
  expect(component2.data.component.templateName).toBe('slideshow')
  expect(component2.data.component.data).not.toBeNull()
  expect(component2.data.component.data.slides).toHaveLength(1)

  // data
  const allSections = elements.filter((el) => el.type === ElementType.SECTION)
  allSections.forEach((el) => {
    expect(el.style.desktop.width).toBeUndefined()
    expect(el.style.desktop['min-width']).toBeUndefined()
  })

  const allSectionContainers = elements.filter((el) => el.isSectionContent)
  allSectionContainers.forEach((el) => {
    expect(el.style.desktop.width).toBeUndefined()
    expect(el.style.desktop.height).not.toBeUndefined()
  })

  const section = elements.find((el) => el.id === SECTION_ID)
  expect(section.enableDrag).toBe(true)
  expect(section.enableDrop).toBe(true)
  expect(section.enableResize.left).toBe(false)
  expect(section.enableResize.right).toBe(false)
  expect(section.enableResize.top).toBe(false)
  expect(section.enableResize.bottom).toBe(false)
  expect(section.style.desktop).toEqual({
    'background-color': 'transparent',
    'position': 'static',
  })
  expect(section.style.mobile).toEqual({
    'background-color': 'red',
  })
  expect(section.children).toHaveLength(1)

  const sectionContainer = elements.find((el) => el.id === SECTION_CONTAINER_ID)
  expect(sectionContainer.enableDrag).toBe(false)
  expect(sectionContainer.enableDrop).toBe(true)
  expect(sectionContainer.enableResize.left).toBe(true)
  expect(sectionContainer.enableResize.right).toBe(true)
  expect(sectionContainer.enableResize.top).toBe(true)
  expect(sectionContainer.enableResize.bottom).toBe(true)
  expect(sectionContainer.style.mobile).toEqual({})
  expect(sectionContainer.children).toHaveLength(2)
  expect(sectionContainer.style.desktop).toEqual({
    'height': '100px',
    'position': 'relative',
    'margin-left': 'auto',
    'margin-right': 'auto',
    'background-color': 'transparent',
  })
  expect(JSON.stringify(sectionContainer.style.mobile)).toBe('{}')

  const htmlBox = elements.find((el) => el.type === ElementType.HTML)
  expect(htmlBox.useMinHeight).toBe(false) // this is because there is the class name 'silex-use-height-not-minheight' on the element

  const textBox = elements.find((el) => el.type === ElementType.TEXT)
  expect(textBox.useMinHeight).toBe(true)
  expect(textBox.enableDrag).toBe(true)
  expect(textBox.enableDrop).toBe(false)
  expect(textBox.enableResize.left).toBe(true)
  expect(textBox.enableResize.left).toBe(true)
  expect(textBox.enableResize.right).toBe(true)
  expect(textBox.enableResize.top).toBe(true)
  expect(textBox.enableResize.bottom).toBe(true)
  expect(textBox.children).toHaveLength(0)
  expect(textBox.style.desktop).toEqual({
    position: 'absolute',
    height: '53px',
    left: '430px',
    top: '29px',
    width: '349px',
  })

  // site
  const site = getSiteFromDom(siteIFrame.contentDocument)
  expect(site.title).toBe('test title')
  expect(site.description).toBe('test description')
  expect(site.dataSources).toEqual({})
  expect(site.fonts).toHaveLength(1)
  expect(site.headStyle).toBe(`.test {
  color: red;
}`)
  expect(site.headScript.trim()).toBe(`// alert('this is js');`)
  expect(site.headUser.trim()).toBe(`<!-- this is head -->`)
  expect(site.headStyle).toContain('.test')
  expect(site.width).toBe(1200)

  expect(site.prodotypeDependencies).toEqual({
    'silex-id-1585068099307-0':
      [{
        'script': [{
          'data-silex-static': '',
          'src': '/static/2.7/unslider/unslider-min.js'
        }],
        'link': [{
          'data-silex-static': '',
          'rel': 'stylesheet',
          'href': '/static/2.7/unslider/unslider.css'
        }]
      }]
    }
  )

  // image elements
  const image = elements.find((el) => el.type === ElementType.IMAGE)
  expect(image.innerHtml.trim()).toBe('<img src="assets/feed-icon-14x14.png" class="" alt="test alt">')
  expect(image.pageNames).toHaveLength(1)
  expect(image.pageNames).toEqual(['page-page-1'])
  expect(image.classList).not.toEqual(['page-page-1'])
	expect(image.useMinHeight).toBe(false)

  // pages
  const pages = getPagesFromDom(siteIFrame.contentDocument)
  expect(pages).toHaveLength(1)
  expect(pages[0].id).toBe('page-page-1')
  expect(pages[0].displayName).toBe('Page 1')

  expect(textBox.pageNames).toHaveLength(0)
  expect(siteIFrame.contentDocument.querySelector('.page-page-1')).not.toBeNull()
  expect(siteIFrame.contentDocument.querySelector('.page-page-1').getAttribute('data-silex-id')).toBe(image.id)
})
