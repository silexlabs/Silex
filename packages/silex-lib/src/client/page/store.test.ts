import { PAGE1, PAGE2, PAGE3 } from '../../../__tests__/data-set';
import { createPages, deletePages, getPages, initializePages, movePage, openPage, updatePages } from './store';
import { PageData } from './types';

beforeEach(() => {
  initializePages([])
})

test('get data', () => {
  initializePages([PAGE1])
  expect(getPages()).toHaveLength(1)
})

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

  movePage({page: PAGE3, idx: 0})

  expect(getPages()[0]).toBe(PAGE3)
  expect(getPages()[1]).toBe(PAGE1)
  expect(getPages()[2]).toBe(PAGE2)
  initializePages(PAGES_1)
})

test('Open a page', () => {
  initializePages(PAGES_2)
  openPage(PAGE2)
  expect(getPages()[0].opened).toBe(false)
  expect(getPages()[1].opened).toBe(true)
})
