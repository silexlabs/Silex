import { PAGE1, PAGE2, PAGE3 } from '../../test-utils/data-set';
import { fromPageData, createPages, deletePages, getPages, initializePages, movePage, updatePages } from './index';
import { PageData } from './types';

beforeEach(() => {
  initializePages([])
})

test('get data', () => {
  initializePages(fromPageData([PAGE1]))
  expect(getPages()).toHaveLength(1)
})

const PAGES_1: PageData[] = [PAGE1]
const PAGES_2: PageData[] = PAGES_1.concat([PAGE2])
const PAGES_3: PageData[] = PAGES_2.concat([PAGE3])

test('Initialize page store', () => {
  expect(getPages()).toHaveLength(0)
  initializePages(fromPageData(PAGES_1))
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE1.id)
  initializePages(fromPageData(PAGES_2))
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(getPages()[1].id).toBe(PAGE2.id)
})

test('Add a page', () => {
  initializePages(fromPageData(PAGES_1))
  createPages(fromPageData([PAGE2]))
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(getPages()[1].id).toBe(PAGE2.id)
})

test('Delete a page', () => {
  initializePages(fromPageData(PAGES_2))
  expect(getPages()[1].id).toBe(PAGE2.id)
  deletePages([getPages()[1]])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE1.id)
  initializePages(fromPageData(PAGES_2))
  expect(getPages()[0].id).toBe(PAGE1.id)
  deletePages([getPages()[0]])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE2.id)
})

test('Update a page', () => {
  initializePages(fromPageData(PAGES_2))
  updatePages([])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(getPages()[1].id).toBe(PAGE2.id)
  updatePages([getPages()[1]])
  expect(getPages()).toHaveLength(2)
})

test('Move a page', () => {
  initializePages(fromPageData(PAGES_3))
  expect (getPages()[2].id).toBe(PAGE3.id)

  movePage({page: getPages()[2], idx: 0})

  expect(getPages()[0].id).toBe(PAGE3.id)
  expect(getPages()[1].id).toBe(PAGE1.id)
  expect(getPages()[2].id).toBe(PAGE2.id)
})

