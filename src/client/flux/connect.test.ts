import { connect } from './connect';
import { SilexStore, store as theStore } from './store';

test('connect', () => {
  expect(connect).not.toBeNull()
  const calledWith: any = {}
  const connected = connect<string>(
    (store: SilexStore, arg: string) => Object.assign(calledWith, { store, arg })
  )
  connected('param1')
  expect(calledWith.store).not.toBeNull()
  expect(calledWith.store).toBe(theStore)
  expect(calledWith.arg).toBe('param1')
})
