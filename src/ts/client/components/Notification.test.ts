import {Notification} from './Notification'

test('display non modal dialog without close button', () => {
  document.body.innerHTML = `
    <div class="light-dialog"></div>
  `
  const el = Notification.lightDialog('<p>test content</p>')
  const closeBtn: HTMLElement = el.querySelector('.light-dialog__close')
  expect(closeBtn).toBeNull()
})

test('display non modal dialog and close it', () => {
  document.body.innerHTML = `
    <div class="light-dialog"></div>
  `
  let clicked = false
  const el = Notification.lightDialog('<p>test content</p>', () => {
    clicked = true
  })
  const closeBtn: HTMLElement = el.querySelector('.light-dialog__close')
  expect(closeBtn).not.toBeNull()
  expect(document.body.querySelector('.light-dialog__content')).not.toBeNull()
  closeBtn.click()
  expect(clicked)
  expect(document.body.querySelector('.light-dialog__content')).toBeNull()
})
