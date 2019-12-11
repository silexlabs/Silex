import * as fs from 'fs';
import { getElementsFromDomBC, getPagesFromDom, getSiteFromDom } from '../src/server/utils/BackwardCompatV2.5.60';
import { ElementType } from '../src/types';

test('convert from 2.5.60', () => {
  const htmlBuffer = fs.readFileSync('./__tests__/editable-v2.5.60.html')
  expect(htmlBuffer).not.toBeNull()
  const htmlString = htmlBuffer.toString()
  expect(htmlString).not.toBeNull()
  expect(htmlString).toMatch(/^<!DOCTYPE html>/)
  document.write(htmlString)
  expect(document.body).not.toBeNull()

  const TEXT_ELEMENT_ID = 'silex-id-1442914737143-3'
  const IMAGE_ELEMENT_ID = 'silex-id-1439573539993-24'
  const BODY_ID = 'body-initial'
  const COMPONENT_ID = 'silex-id-1526234059780-5'

  // import elements
  document.body.classList.add('editable-style')
  const elements = getElementsFromDomBC(document)
  expect(elements).not.toBeNull()
  expect(elements).toHaveLength(10)
  expect(elements.filter((el) => el.type === ElementType.SECTION)).toHaveLength(3)
  expect(elements.filter((el) => el.type === ElementType.CONTAINER)).toHaveLength(4)
  expect(elements.filter((el) => el.type === ElementType.TEXT)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.IMAGE)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.COMPONENT)).toHaveLength(1)
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
  const textBox = elements.find((el) => el.type === ElementType.TEXT)
  expect(textBox.style.mobile).toEqual({})
  expect(textBox.style.desktop).toEqual({
    position: 'absolute',
    height: '53px',
    left: '430px',
    top: '29px',
    width: '349px',
  })

  // site
  const site = getSiteFromDom(document)
  expect(site.title).toBe('test title')
  expect(site.description).toBe('test description')
  expect(site.dataSources).toEqual({})
  expect(site.fonts).toHaveLength(1)
  expect(site.headStyle).toBe(`.test {
  color: red;
}`)
  expect(site.headScript).toBe(`
    // alert('this is js');
  `)
  expect(site.headTag).toBe(`<!-- this is head -->`)

  // pages
  const pages = getPagesFromDom(document)
  expect(pages).toHaveLength(1)
  expect(pages[0].id).toBe('page-page-1')
  expect(pages[0].displayName).toBe('Page 1')
})
