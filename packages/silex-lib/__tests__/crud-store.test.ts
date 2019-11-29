import { getPages, initializePages, createPage, deletePage, updatePage } from '../src/client/api'
import { PageData } from '../src/client/flux/page-store'

const PAGE1 = {
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
}
const PAGE2 = {
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
}
const PAGE3 = {
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
}
const PAGES_1: PageData[] = [PAGE1]
const PAGES_2: PageData[] = PAGES_1.concat([PAGE2])
const PAGES_3: PageData[] = PAGES_2.concat([PAGE3])

test('Initialize page store', () => {
  expect(getPages()).toHaveLength(0)
  initializePages(PAGES_1)
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].element).not.toBeNull()
  expect(getPages()[0]).toBe(PAGE1)
  initializePages(PAGES_2)
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGE1)
  expect(getPages()[1]).toBe(PAGE2)
  getPages().forEach(page => expect(page.isOpen).toBe(false))
})

test('Add a page', () => {
  initializePages(PAGES_1)
  createPage(PAGE2)
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGE1)
  expect(getPages()[1]).toBe(PAGE2)
})

test('Delete a page', () => {
  initializePages(PAGES_2)
  deletePage(PAGE2)
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].name).toBe(PAGE1.name)
  initializePages(PAGES_2)
  deletePage(PAGE1)
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].name).toBe(PAGE2.name)
})

test('Update a page', () => {
  initializePages(PAGES_2)
  updatePage(PAGE2, PAGE2)
  expect(getPages()[1]).toBe(PAGE2)
  updatePage(PAGE3, PAGE3)
  expect(getPages()).toHaveLength(2)
  updatePage(PAGE2, PAGE3)
  expect(getPages()).toHaveLength(2)
  expect(getPages()[1]).not.toBe(PAGE3)
  expect(getPages()[1].name).toBe(PAGE3.name)
})

test('Move a page', () => {
  initializePages(PAGES_3)
  const newOrder = Object.assign({}, PAGE3, {idx: 0})
  updatePage(PAGE3, newOrder)
  expect(getPages()[0]).toBe(newOrder)
  expect(getPages()[2]).not.toBe(PAGE2)
  expect(getPages()[2].name).toBe(PAGE2.name)
})

