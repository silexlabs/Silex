import { PAGE1, PAGE2, PAGE3 } from '../../test-utils/data-set'
import { PageState } from './types'
import { subscribePages, fromPageData, createPages, deletePages, getPages, initializePages, movePage, updatePages } from './index'

beforeEach(() => {
  initializePages([])
})

const [PAGE1_STATE, PAGE2_STATE, PAGE3_STATE] = fromPageData([PAGE1, PAGE2, PAGE3])
const PAGES_1: PageState[] = [PAGE1_STATE]
const PAGES_2: PageState[] = PAGES_1.concat([PAGE2_STATE])
const PAGES_3: PageState[] = PAGES_2.concat([PAGE3_STATE])

test('get data', () => {
  initializePages([PAGE1_STATE])
  expect(getPages()).toHaveLength(1)
})

test('Initialize page store', () => {
  initializePages(PAGES_1)
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE1.id)
  initializePages(PAGES_2)
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(getPages()[1].id).toBe(PAGE2.id)
})

test('Add a page', () => {
  initializePages(PAGES_1)
  const listener = jest.fn()
  subscribePages(listener)
  createPages([PAGE2_STATE])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(getPages()[1].id).toBe(PAGE2.id)
  expect(listener).toHaveBeenCalledTimes(1)
})

test('Delete a page', () => {
  initializePages(PAGES_2)
  const listener = jest.fn()
  subscribePages(listener)
  expect(getPages()[1].id).toBe(PAGE2.id)
  deletePages([getPages()[1]])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(listener).toHaveBeenCalledTimes(1)
  initializePages(PAGES_2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(listener).toHaveBeenCalledTimes(2) // is this expected? (initialize => listeners)
  deletePages([getPages()[0]])
  expect(getPages()).toHaveLength(1)
  expect(getPages()[0].id).toBe(PAGE2.id)
  expect(listener).toHaveBeenCalledTimes(3)
})

test('Update a page', () => {
  initializePages(PAGES_2)
  const listener = jest.fn()
  subscribePages(listener)
  updatePages([])
  expect(getPages()).toHaveLength(2)
  expect(getPages()[0].id).toBe(PAGE1.id)
  expect(getPages()[1].id).toBe(PAGE2.id)
  expect(listener).toHaveBeenCalledTimes(0)
  updatePages([getPages()[1]])
  expect(getPages()).toHaveLength(2)
  expect(listener).toHaveBeenCalledTimes(1) // same page => should not be called?
  updatePages([{
    ...PAGE1_STATE,
    displayName: 'test other displayName',
  }])
  expect(listener).toHaveBeenCalledTimes(2)
})

test('Move a page', () => {
  initializePages(PAGES_3)
  expect (getPages()[2].id).toBe(PAGE3.id)

  const listener = jest.fn()
  subscribePages(listener)

  movePage({page: getPages()[2], idx: 0})

  expect(getPages()[0].id).toBe(PAGE3.id)
  expect(getPages()[1].id).toBe(PAGE1.id)
  expect(getPages()[2].id).toBe(PAGE2.id)
  expect(listener).toHaveBeenCalledTimes(1)
})
