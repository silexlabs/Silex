import { initializeElements } from '../element/store';
import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER } from '../../../__tests__/data-set';
import { getData } from './store';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])
})

test('get data', () => {
  expect(getData().elements[0]).toBe(ELEM_TEXT)
})
