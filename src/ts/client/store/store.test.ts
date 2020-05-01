import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER } from '../../test-utils/data-set';
import { getState } from './index';
import { initializeElements } from '../element-store/index';

beforeEach(() => {
})

test('get state', () => {
  initializeElements([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER])
  expect(getState().elements[0].id).toBe(ELEM_TEXT.id)
})
