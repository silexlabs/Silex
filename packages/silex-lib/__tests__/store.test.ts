import { getPages, subscribePages, initializePages, createPage, deletePage, updatePage, movePage, openPage } from '../src/client/api'
import { PageData } from '../src/client/store/page-store'

const PAGES_1: PageData[] = [
  {
    name: 'page-1',
    displayName: 'Page 1',
    element: document.createElement('a'),
    previewLink: '#!page-page-1',
    idx: 0,
    isOpen: false,
    canDelete: true,
    canProperties: true,
    canMove: true,
    canRename: true,
  },
]
const PAGES_2: PageData[] = PAGES_1.concat([
  {
    name: 'page-2',
    displayName: 'Page 2',
    element: document.createElement('a'),
    previewLink: '#!page-page-2',
    idx: 1,
    isOpen: false,
    canDelete: true,
    canProperties: true,
    canMove: true,
    canRename: true,
  },
])
const PAGES_3: PageData[] = PAGES_2.concat([
  {
    name: 'page-3',
    displayName: 'Page 3',
    element: document.createElement('a'),
    previewLink: '#!page-page-3',
    idx: 2,
    isOpen: false,
    canDelete: true,
    canProperties: true,
    canMove: true,
    canRename: true,
  },
])

test('Initialize page store', () => {
  expect(getPages()).toHaveLength(0)
  initializePages(PAGES_1)
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].element).not.toBeNull()
  expect(getPages()[0]).toBe(PAGES_1[0])
  initializePages(PAGES_2)
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGES_1[0])
  expect(getPages()[1]).toBe(PAGES_2[1])
  getPages().forEach(page => expect(page.isOpen).toBe(false))
})

test('Add a page', () => {
  initializePages(PAGES_1)
  createPage(PAGES_2[1])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGES_1[0])
  expect(getPages()[1]).toBe(PAGES_2[1])
})

test('Delete a page', () => {
  initializePages(PAGES_2)
  deletePage(PAGES_2[1])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].name).toBe(PAGES_1[0].name)
  initializePages(PAGES_2)
  deletePage(PAGES_1[0])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].name).toBe(PAGES_2[1].name)
})

test('Move a page', () => {
  initializePages(PAGES_3)
  movePage(PAGES_3[1], 0)
  expect(getPages()).toHaveLength(3)
  expect(getPages()[0].name).toBe(PAGES_3[1].name)
  expect(getPages()[1].name).toBe(PAGES_3[0].name)
  expect(getPages()[2]).toBe(PAGES_3[2])
  movePage(PAGES_3[2], 2)
  expect(getPages()[2]).toBe(PAGES_3[2])
  movePage(PAGES_3[2], 10)
  expect(getPages()[2]).toEqual(PAGES_3[2])
})

test('Update a page', () => {
  initializePages(PAGES_2)
  updatePage(PAGES_2[1], PAGES_2[1])
  expect(getPages()[1]).toBe(PAGES_2[1])
  updatePage(PAGES_3[2], PAGES_3[2])
  expect(getPages()).toHaveLength(2)
  updatePage(PAGES_2[1], PAGES_3[2])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[1]).not.toBe(PAGES_3[1])
  expect(getPages()[1]).not.toBe(PAGES_3[2])
  expect(getPages()[1].name).toBe(PAGES_3[2].name)
})

test('Open a page', () => {
  initializePages(PAGES_2)
  openPage(PAGES_2[1])
  expect(getPages()[0].isOpen).toBe(false)
  expect(getPages()[1].isOpen).toBe(true)
})

test('Subscribe to pages', () => {
  const test = {
    cbk: (prev, next) => {},
  }
  jest.spyOn(test, 'cbk')
  subscribePages(test.cbk)
  initializePages(PAGES_1)
  expect(test.cbk).toHaveBeenCalled()
})
