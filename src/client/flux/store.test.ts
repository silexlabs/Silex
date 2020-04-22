import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER } from '../../../__tests__/data-set';
import { getState } from './store';
import { initializeElements } from '../element/store';

beforeEach(() => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])
})

test('get state', () => {
  expect(getState().elements[0].id).toBe(ELEM_TEXT.id)
})
