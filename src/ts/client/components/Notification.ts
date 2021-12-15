/**
 * @fileoverview Helper class for common tasks
 *
 */

interface Options {
  labelOk?: string
  labelCancel?: string
  defaultValue?: string
  cancel?: () => {}
  title: string
  content: string
  placeholder?: string
}

export class Notification {

  static get isActive(): boolean {
    return !!Notification.currentDialog && !document.querySelector('.alerts').classList.contains('closed')
  }

  /**
   * flag to indicate wether a modal dialog is opened
   */
  private static get currentDialog(): HTMLElement {
    return document.querySelector(`.${Notification.NOTIFICATION_CSS_CLASS}`)
  }

  /**
   * close (cancel) the current notification
   */
  static close(isOk = false, e: Event = null): boolean {
    if (Notification.currentDialog) {
      // hide dialogs
      const container: HTMLElement = document.querySelector('.alerts')
      container.classList.add('closed')

      // cleanup
      const cbk = isOk ? Notification.cbkOk : Notification.cbkCancel
      Notification.currentDialog.remove()
      Notification.cbkCancel = null
      Notification.cbkOk = null

      // all done, we can open another one or do something
      cbk()

      // prevent propagation of the event
      if (e) e.preventDefault()
      if (e) e.stopPropagation()
      return false
    }
  }

  /**
   * display a message
   */
  static alert(title: string, content: string, ok: () => any, labelOk: string = 'ok') {
    Notification.close()
    Notification.create(Notification.getMarkup({
      labelOk,
      title,
      content,
    }))
    Notification.cbkCancel = Notification.cbkOk = () => ok();
    (Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_ok`) as HTMLElement).onclick = (e) => Notification.close(false, e)
  }

  /**
   * ask for a text
   */
  static prompt(title: string, content: string, defaultValue: string, placeholder: string, cbk: (isOk: boolean, value: string) => any, labelOk: string = 'ok', labelCancel: string = 'cancel') {
    Notification.close()
    Notification.create(Notification.getMarkup({
      labelOk,
      labelCancel,
      defaultValue,
      title,
      content,
      placeholder,
    }))
    const input: HTMLInputElement = Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_value`)
    Notification.cbkOk = () => {
      cbk(true, input.value)
    }
    Notification.cbkCancel = () => {
      cbk(false, null)
    }
    (Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_ok`) as HTMLElement).onclick = (e) => Notification.close(true, e);
    (Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_cancel`) as HTMLElement).onclick = (e) => Notification.close(false, e)
  }

  /**
   * ask for confirmation
   */
  static confirm(title: string, content: string, cbk: (isOk: boolean) => any, labelOk: string = 'ok', labelCancel: string = 'cancel') {
    Notification.close()
    Notification.create(Notification.getMarkup({
      labelOk,
      labelCancel,
      title,
      content,
    }))
    Notification.cbkOk = () => cbk(true)
    Notification.cbkCancel = () => cbk(false);

    (Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_ok`) as HTMLElement).onclick = (e) => Notification.close(true, e);
    (Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_cancel`) as HTMLElement).onclick = (e) => Notification.close(false, e)
  }

  /**
   * notify the user with success formatting
   * this is non-modal
   * @param opt_close callback for close button, defaults to "no close button"
   * @return the created element
   */
  static lightDialog(content: string, opt_close?: () => any) {
    const container: HTMLElement = document.querySelector('.light-dialog')
    const el = document.createElement('p')
    el.classList.add('light-dialog__content')
    el.innerHTML = `
      ${opt_close ? `<div class="light-dialog__close">X</div>` : ''}
      ${content}
    `
    container.appendChild(el)
    setTimeout(() => el.classList.add('light-dialog__content--open'), 100)
    if(opt_close) {
      const closeBtn: HTMLElement = el.querySelector('.light-dialog__close')
      closeBtn.onclick = (e) => {
        opt_close()
        el.remove()
      }
    }
    return el
  }

  /**
   * notify the user with success formatting
   * this is non-modal
   */
  static notifySuccess(message: string) {
    const container: HTMLElement = document.querySelector('.alerts-notify')
    const el = document.createElement('p')
    el.innerHTML = message
    container.appendChild(el)
    const id = setTimeout(() => {
      el.remove()
    }, Notification.NOTIFICATION_DURATION_MS)
    el.onclick = (e) => {
      clearTimeout(id)
      el.remove()
    }
  }

  /**
   * notify the user with success formatting
   * this is non-modal
   */
  static notifyError(message: string) {
    console.error(message)
    Notification.notifySuccess(message)
  }

  /**
   * change the text of the current notification
   */
  static setContent(el: HTMLElement|DocumentFragment, keepExisiting= false) {
    if (Notification.currentDialog) {
      const container = Notification.currentDialog.querySelector(`.${Notification.NOTIFICATION_CSS_CLASS}_content`)
      if (!keepExisiting) { container.innerHTML = '' }
      container.appendChild(el)
      Notification.updateFocus()
    }
  }

  /**
   * change the text of the current notification
   */
  static setText(text: string) {
    if (Notification.currentDialog) {
      const el = document.createElement('div')
      el.insertAdjacentHTML('afterbegin', `<p>${text}</p>`)
      Notification.setContent(el)
    }
  }

  /**
   * add a button to the button bar
   */
  static addButton(el: HTMLElement|DocumentFragment) {
    if (Notification.currentDialog) {
      const buttonBar = Notification.currentDialog.querySelector(`.${Notification.NOTIFICATION_CSS_CLASS}_buttons`)
      buttonBar.appendChild(el)
      Notification.updateFocus()
    }
  }

  /**
   * add an HTML panel with info of type "while you wait, here is an info"
   */
  static setInfoPanel(element: HTMLElement) {
    if (Notification.currentDialog) {
      let infoPanel = Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_info`) as HTMLElement
      if (!infoPanel) {
        infoPanel = document.createElement('div')
        infoPanel.insertAdjacentHTML('afterbegin', `<p class="${Notification.NOTIFICATION_CSS_CLASS}_info"></p>`)
        Notification.setContent(infoPanel, true)
      }

      // limit height so that small screens still see the close button
      infoPanel.style.maxHeight = Math.round(window.innerHeight * 2 / 3) + 'px'
      Notification.currentDialog.insertBefore(infoPanel, Notification.currentDialog.childNodes[Notification.currentDialog.childNodes.length - 1])
      infoPanel.innerHTML = ''
      infoPanel.appendChild(element)
    }
  }
  private static NOTIFICATION_DURATION_MS = 30000
  private static NOTIFICATION_CSS_CLASS = 'notification-dialog'

  private static cbkOk: () => void
  private static cbkCancel: () => void
  private static getMarkup(options: Options) {
    return `
      <section class="${Notification.NOTIFICATION_CSS_CLASS}">
        <h2>${options.title}</h2>
        <p class="${Notification.NOTIFICATION_CSS_CLASS}_content">
          ${options.content}
          ${
            typeof options.defaultValue !== 'undefined' ? `
              <input
                autofocus
                id="${Notification.NOTIFICATION_CSS_CLASS}_value"
                ${options.placeholder ? `placeholder="${options.placeholder}"` : ''}
                class="block-dialog" type="text" value="${options.defaultValue}"
              >`
              : ''
          }
        </p>
        <div class="${Notification.NOTIFICATION_CSS_CLASS}_buttons">
          ${options.labelCancel ? `<input id="${Notification.NOTIFICATION_CSS_CLASS}_cancel" type="button" value="${options.labelCancel}">` : ''}
          ${options.labelOk ? `<input id="${Notification.NOTIFICATION_CSS_CLASS}_ok" type="button" value="${options.labelOk}">` : ''}
        </div>
      </section>
    `
  }

  private static create(markup: string) {
    const container: HTMLElement = document.querySelector('.alerts')
    container.insertAdjacentHTML('afterbegin', markup)
    container.classList.remove('closed')
    Notification.updateFocus()
  }
  private static updateFocus() {
    const input = (Notification.currentDialog.querySelector('[autofocus]') as HTMLElement)
    if (input) {
      input.focus()
    }
  }

  constructor() {
    throw new Error('this is a static class and it canot be instanciated')
  }
}

// else {
// Notifications are not supported or denied
// }

// Desktop notifications disabled because it disturbs more than it serves
// FIXME: remove all calls to nativeNotification since it is not useful anymore
// Notification.activateNative();

// :facepalm:
