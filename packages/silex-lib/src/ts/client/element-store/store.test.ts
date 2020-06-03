import { initializeElements, getElements, fromElementData } from '../element-store/index'
import { ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER } from '../../test-utils/data-set'

beforeEach(() => {
  initializeElements(fromElementData([ELEM_TEXT, ELEM_IMAGE, ELEM_CONTAINER]))
})

test('get data', () => {
  expect(getElements()[0].id).toBe(ELEM_TEXT.id)
})
