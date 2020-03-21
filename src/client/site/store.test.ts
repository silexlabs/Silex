import { getSite, initializeSite } from './store';
import { SITE1 } from '../../../__tests__/data-set';

beforeEach(() => {
  initializeSite(SITE1)
})

test('get data', () => {
  expect(getSite().fonts).not.toBeNull()
})
