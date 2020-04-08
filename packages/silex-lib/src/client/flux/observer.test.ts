import { PAGE1, PAGE2, PAGE3 } from '../../../__tests__/data-set';
import { PageData } from '../page/types';
import {
  initializePages,
  movePage,
  subscribePages,
  updatePages
} from '../page/store';
import { onCrudChange } from '../flux/crud-store';

beforeEach(() => {
  initializePages([])
})

const PAGES_1: PageData[] = [PAGE1]
const PAGES_2: PageData[] = PAGES_1.concat([PAGE2])
const PAGES_3: PageData[] = PAGES_2.concat([PAGE3])

test('Move a page', () => {
  initializePages(PAGES_3)
  const test = {
    cbk: (prev, next) => {},
  }
  jest.spyOn(test, 'cbk')
  subscribePages(test.cbk)

  movePage({page: PAGE3, idx: 0})

  expect(test.cbk).toHaveBeenCalled()
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

  initializePages(PAGES_2)
  expect(test.onUpdatePages).toHaveBeenCalledTimes(0)
  updatePages([{
    from: PAGE1,
    to: {
      ...PAGE1,
      id: 'newId',
    },
  }])
  expect(test.onUpdatePages).toHaveBeenCalledTimes(1)
  expect(test.onAddPages).toHaveBeenCalledTimes(1)
  expect(test.onDeletePages).toHaveBeenCalledTimes(1)
})
