import { setTagName } from './dom'

const get = (q) => document.querySelector(q)

test('set div tag name', () => {
  document.body.innerHTML = `
    <div id="el" data-test="test attr">test content</div>
  `
  const res = setTagName(get('#el'), 'section')
  expect(res).not.toBeFalsy()
  expect(res.id).toBe('el')
  expect(res.parentElement).toBe(document.body)
  expect(res.tagName).toBe('SECTION')
  expect(res.getAttribute('data-test')).toBe('test attr')
  expect(res.innerHTML).toBe('test content')
})

test('change body tag name', () => {
  const res = get('body')
  expect(() => setTagName(res, 'section'))
  .toThrow()
  expect(res).toBe(document.body)
  expect(res.tagName).toBe('BODY')
})

