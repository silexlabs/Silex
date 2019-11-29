import { initializePages, getPages, openPage, subscribePages } from '../src/client/api'
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

test('Open a page', () => {
  initializePages(PAGES_2)
  openPage(PAGE2)
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

