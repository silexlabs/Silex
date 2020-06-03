import { getSite, initializeSite } from './index'
import { SITE1 } from '../../test-utils/data-set'

beforeEach(() => {
  initializeSite(SITE1)
})

test('get data', () => {
  expect(getSite().fonts).not.toBeNull()
})
