import { mockUiElements } from './data-set'
const {siteIFrame} = mockUiElements()

import * as fs from 'fs';
import { getElementsFromDomBC, getPagesFromDom, getSiteFromDom } from '../src/server/utils/BackwardCompatV2.5.60';
import { ElementType } from '../src/client/element/types';

test('convert from 2.5.60', () => {
  const htmlBuffer = fs.readFileSync('./__tests__/editable-v2.5.60.html')
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
  const SECTION_ID = 'silex-id-1478366450713-3'
  const SECTION_CONTAINER_ID = 'silex-id-1478366450713-2'

  // import elements
  siteIFrame.contentDocument.body.classList.add('editable-style')
  const elements = getElementsFromDomBC(siteIFrame.contentDocument)
  expect(elements).not.toBeNull()
  expect(elements).toHaveLength(11)
  expect(elements.filter((el) => el.type === ElementType.SECTION)).toHaveLength(3)
  expect(elements.filter((el) => el.type === ElementType.CONTAINER)).toHaveLength(4)
  expect(elements.filter((el) => el.type === ElementType.TEXT)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.IMAGE)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.COMPONENT)).toHaveLength(2)
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
  expect(elements.find((el) => el.id === TEXT_ELEMENT_ID).innerHtml).toContain('www.silex.me');

  // component data
  const component = elements.find((el) => el.id === COMPONENT_ID)
  expect(component.data.component.templateName).toBe('form')
  expect(component.data.component.data).not.toBeNull()
  expect(component.data.component.data.buttonBackgroundColor).toBe('#000000')

  // data
  const allSections = elements.filter((el) => el.type === ElementType.SECTION)
  allSections.forEach((el) => {
    expect(el.style.desktop.width).toBeUndefined()
    expect(el.style.desktop['min-width']).toBeUndefined()
  })

  const allSectionContainers = elements.filter((el) => el.isSectionContent)
  allSectionContainers.forEach((el) => {
    expect(el.style.desktop.width).toBeUndefined()
  })

  const section = elements.find((el) => el.id === SECTION_ID)
  expect(section.enableDrag).toBe(false)
  expect(section.enableDrop).toBe(true)
  expect(section.enableResize.left).toBe(false)
  expect(section.enableResize.right).toBe(false)
  expect(section.enableResize.top).toBe(false)
  expect(section.enableResize.bottom).toBe(false)
  expect(section.style.desktop).toEqual({
    'background-color': 'transparent',
    'position': 'static',
    'margin-top': '-1px',
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
  const textBox = elements.find((el) => el.type === ElementType.TEXT)
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

  // pages
  const pages = getPagesFromDom(siteIFrame.contentDocument)
  expect(pages).toHaveLength(1)
  expect(pages[0].id).toBe('page-page-1')
  expect(pages[0].displayName).toBe('Page 1')

  const image = elements.find((el) => el.type === ElementType.IMAGE)
  expect(textBox.pageNames).toHaveLength(0)
  expect(image.pageNames).toHaveLength(1)
  expect(image.pageNames).toEqual(['page-page-1'])
})
