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

  // import elements
  document.body.classList.add('editable-style')
  const elements = getElementsFromDomBC(document)
  expect(elements).not.toBeNull()
  expect(elements).toHaveLength(9)
  expect(elements.filter((el) => el.type === ElementType.SECTION)).toHaveLength(3)
  expect(elements.filter((el) => el.type === ElementType.CONTAINER)).toHaveLength(4)
  expect(elements.filter((el) => el.type === ElementType.TEXT)).toHaveLength(1)
  expect(elements.filter((el) => el.type === ElementType.IMAGE)).toHaveLength(1)
  expect(elements.find((el) => el.id === 'silex-id-1442914737143-3').title).toEqual('test title')
  expect(elements.find((el) => el.id === 'silex-id-1439573539993-24').alt).toEqual('test alt')
  expect(elements.find((el) => el.id === 'body-initial').classList).toEqual([
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

  // data
  const textBox = elements.find((el) => el.type === ElementType.TEXT)
  expect(textBox.style.mobile).toBeNull()
  expect(textBox.style.desktop).toEqual({
    'height': '53px',
    'left': '430px',
    'min-height': null,
    'top': '29px',
    'width': '349px',
  })

  // site
  const site = getSiteFromDom(document)
  expect(site.title).toBe('test title')
  expect(site.description).toBe('test description')
  expect(site.dataSources).toEqual({})
  expect(site.fonts).toHaveLength(1)

  // pages
  const pages = getPagesFromDom(document)
  expect(pages).toHaveLength(1)
  expect(pages[0].id).toBe('page-page-1')
  expect(pages[0].displayName).toBe('Page 1')
})
