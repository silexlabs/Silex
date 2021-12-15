import { count, once } from './visits'

test('Count visits', () => {
  expect(count()).toBe(1)
  expect(count()).toBe(1)
})
test('local storage', () => {
  window.localStorage.setItem('name', 'done')
  expect(window.localStorage.getItem('name')).toBe('done')

})
test('Do once only, after 1s', (done) => {
  let counter = 0
  const doIt = () => counter++
  once(0, 1, 'test', doIt)
  once(0, 2, 'test', doIt)
  expect(counter).toBe(0)
  setTimeout(() => {
    expect(counter).toBe(1)
    done()
  }, 3000)
})
