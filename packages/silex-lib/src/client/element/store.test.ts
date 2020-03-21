import { initializeElements, getElements } from '../element/store';
import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER } from '../../../__tests__/data-set';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])
})

test('get data', () => {
  expect(getElements()[0]).toBe(ELEM_TEXT)
})
