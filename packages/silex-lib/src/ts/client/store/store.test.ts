import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER } from '../../test-utils/data-set'
import { getState } from './index'
import { initializeElements, fromElementData } from '../element-store/index'

beforeEach(() => {
})

test('get state', () => {
  initializeElements(fromElementData([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER]))
  expect(getState().elements[0].id).toBe(ELEM_TEXT.id)
})
