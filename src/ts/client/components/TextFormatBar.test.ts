const confirm = jest.fn().mockImplementation((title, text, cbk, ok, cancel) => {
  cbk(true)
})
jest.mock('./Notification', () => ({
  Notification: {
    confirm,
  },
}))
jest.mock('./Menu', () => ({}))
jest.mock('./SiteFrame', () => ({
  getSiteIFrame: () => null,
  getSiteDocument: () => document,
}))

jest.mock('../element-store/dom', () => ({
  getDomElement: () => document.body,
  getContentNode: () => document.body,
}))

import {TextFormatBar} from './TextFormatBar'

// paste unicode chars, answer "ok" to the confirm dialog
// results in the text box to contain only the non-unicod chars
test('paste unicode chars', () => {
  const textFormatBar = new TextFormatBar(document.body)
  // 1 unicode character
  document.body.innerHTML = 'ab\u2028cd'
  textFormatBar.onPaste('ab\u2028cd')
  expect(confirm).toHaveBeenCalledTimes(1)
  expect(document.body.innerHTML).toBe('abcd')
  // 2 unicode characters
  document.body.innerHTML = 'ab\u2028c\u2029d'
  textFormatBar.onPaste('ab\u2028c\u2029d')
  expect(confirm).toHaveBeenCalledTimes(2)
  expect(document.body.innerHTML).toBe('abcd')
})
