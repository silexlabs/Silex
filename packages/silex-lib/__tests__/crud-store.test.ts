import { createPages, deletePages, getPages, initializePages, movePage, openPage, subscribePages, updatePages } from '../src/client/api';
import { crudIdKey, onCrudChange } from '../src/client/flux/crud-store';
import { LinkType, PageData } from '../src/types';

const PAGE1 = {
  [crudIdKey]: Symbol(),
  id: 'page-1',
  displayName: 'Page 1',
  element: document.createElement('a'),
  link: {
    type: LinkType.PAGE,
    value: '#!page-page-1',
  },
  idx: 0,
  opened: false,
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}
const PAGE2 = {
  [crudIdKey]: Symbol(),
  id: 'page-2',
  displayName: 'Page 2',
  element: document.createElement('a'),
  link: {
    type: LinkType.PAGE,
    value: '#!page-page-2',
  },
  idx: 1,
  opened: false,
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}
const PAGE3 = {
  [crudIdKey]: Symbol(),
  id: 'page-3',
  displayName: 'Page 3',
  element: document.createElement('a'),
  link: {
    type: LinkType.PAGE,
    value: '#!page-page-3',
  },
  idx: 2,
  opened: false,
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
  expect(getPages()[0]).toBe(PAGE1)
  initializePages(PAGES_2)
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGE1)
  expect(getPages()[1]).toBe(PAGE2)
  getPages().forEach((page) => expect(page.opened).toBe(false))
})

test('Add a page', () => {
  initializePages(PAGES_1)
  createPages([PAGE2])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGE1)
  expect(getPages()[1]).toBe(PAGE2)
})

test('Delete a page', () => {
  initializePages(PAGES_2)
  deletePages([PAGE2])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE1.id)
  initializePages(PAGES_2)
  deletePages([PAGE1])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE2.id)
})

test('Update a page', () => {
  initializePages(PAGES_2)
  updatePages([])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0]).toBe(PAGE1)
  expect(getPages()[1]).toBe(PAGE2)
  updatePages([{from: PAGE2, to: PAGE2}])
  expect(getPages()[1]).toBe(PAGE2)
  updatePages([{from: PAGE3, to: PAGE3}])
  expect(getPages()).toHaveLength(2)
  updatePages([{from: PAGE2, to: PAGE3}])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[1]).toBe(PAGE3)
})

test('Move a page', () => {
  initializePages(PAGES_3)
  const test = {
    cbk: (prev, next) => {},
  }
  jest.spyOn(test, 'cbk')
  subscribePages(test.cbk)

  movePage(PAGE3, 0)

  expect(test.cbk).toHaveBeenCalled()

  expect(getPages()[0]).toBe(PAGE3)
  expect(getPages()[1]).toBe(PAGE1)
  expect(getPages()[2]).toBe(PAGE2)
  initializePages(PAGES_1)
})

test('Subscribe to pages', () => {
  const test = {
    cbk: (prev, next) => {},
  }
  jest.spyOn(test, 'cbk')
  subscribePages(test.cbk)
  initializePages([])
  expect(test.cbk).toHaveBeenCalled()
})

test('Open a page', () => {
  initializePages(PAGES_2)
  openPage(PAGE2)
  expect(getPages()[0].opened).toBe(false)
  expect(getPages()[1].opened).toBe(true)
})

test('Subscribe to pages', () => {
  const test1 = { cbk: (prev, next) => {} }
  const test2 = { cbk: (prev, next) => {} }
  jest.spyOn(test1, 'cbk')
  jest.spyOn(test2, 'cbk')

  // notify 1 listener
  subscribePages(test1.cbk)
  initializePages(PAGES_1)
  expect(test1.cbk).toHaveBeenCalledTimes(1)

  // notify 2 listeners
  subscribePages(test2.cbk)
  initializePages([])
  expect(test1.cbk).toHaveBeenCalledTimes(2)
  expect(test2.cbk).toHaveBeenCalledTimes(1)

  // do not notify when there is no change
  updatePages([])
  expect(test1.cbk).toHaveBeenCalledTimes(2)
  expect(test2.cbk).toHaveBeenCalledTimes(1)
})

test('Subscribe CRUD', () => {
  const test = {
    onAddPages: (items) => {}, // console.log('onAddPages', items),
    onDeletePages: (items) => {}, // console.log('onDeletePages', items),
    onUpdatePages: (changes) => {}, // console.log('onUpdatePages', changes),
  }
  jest.spyOn(test, 'onAddPages')
  jest.spyOn(test, 'onDeletePages')
  jest.spyOn(test, 'onUpdatePages')

  initializePages(PAGES_2)
  subscribePages(onCrudChange<PageData>({
    onAdd: test.onAddPages,
    onDelete: test.onDeletePages,
    onUpdate: test.onUpdatePages,
  }))

  initializePages(PAGES_3)
  expect(test.onAddPages).toHaveBeenCalledTimes(1)
  expect(test.onDeletePages).toHaveBeenCalledTimes(0)
  expect(test.onUpdatePages).toHaveBeenCalledTimes(0)

  initializePages(PAGES_2)
  expect(test.onAddPages).toHaveBeenCalledTimes(1)
  expect(test.onDeletePages).toHaveBeenCalledTimes(1)
  expect(test.onUpdatePages).toHaveBeenCalledTimes(0)

  openPage(PAGE2)
  expect(test.onAddPages).toHaveBeenCalledTimes(1)
  expect(test.onDeletePages).toHaveBeenCalledTimes(1)
  expect(test.onUpdatePages).toHaveBeenCalledTimes(1)

  updatePages([{
    from: PAGE1,
    to: {
      ...PAGE1,
      id: 'newId',
    },
  }])
  expect(test.onUpdatePages).toHaveBeenCalledTimes(2)
  expect(test.onAddPages).toHaveBeenCalledTimes(1)
  expect(test.onDeletePages).toHaveBeenCalledTimes(1)
})
