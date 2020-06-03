import { getUiElements } from '../ui-store/UiElements'
import { getSiteIFrame } from './SiteFrame'

/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

interface Dialog {
  set(optoins: any)
  close()
  destroy()
  setContent(el: HTMLElement|DocumentFragment)
}

interface Options {
  labelOk?: string
  labelCancel?: string
  defaultValue?: string
  cancel?: () => {}
  title: string
  content: string
  placeholder?: string
}

/**
 * @fileoverview Helper class for common tasks
 *
 */
export class SilexNotification {

  static get isActive(): boolean {
    return !!SilexNotification.currentDialog && !document.querySelector('.alerts').classList.contains('closed')
  }

  /**
   * flag to indicate wether a modal dialog is opened
   */
  private static get currentDialog(): HTMLElement {
    return document.querySelector(`.${SilexNotification.NOTIFICATION_CSS_CLASS}`)
  }

  /**
   * close (cancel) the current notification
   */
  static close(isOk= false) {
    if (SilexNotification.currentDialog) {
      // hide dialogs
      const container: HTMLElement = document.querySelector('.alerts')
      container.classList.add('closed')

      // cleanup
      const cbk = isOk ? SilexNotification.cbkOk : SilexNotification.cbkCancel
      SilexNotification.currentDialog.remove()
      SilexNotification.cbkCancel = null
      SilexNotification.cbkOk = null

      // all done, we can open another one or do something
      cbk()
    }
  }

  /**
   * display a message
   */
  static alert(title: string, content: string, ok: () => any, labelOk: string = 'ok') {
    SilexNotification.close()
    SilexNotification.create(SilexNotification.getMarkup({
      labelOk,
      title,
      content,
    }))
    SilexNotification.cbkCancel = SilexNotification.cbkOk = () => ok();
    (SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_ok`) as HTMLElement).onclick = (e) => SilexNotification.close()
  }

  /**
   * ask for a text
   */
  static prompt(title: string, content: string, defaultValue: string, placeholder: string, cbk: (isOk: boolean, value: string) => any, labelOk: string = 'ok', labelCancel: string = 'cancel') {
    SilexNotification.close()
    SilexNotification.create(SilexNotification.getMarkup({
      labelOk,
      labelCancel,
      defaultValue,
      title,
      content,
      placeholder,
    }))
    const input: HTMLInputElement = SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_value`)
    SilexNotification.cbkOk = () => {
      cbk(true, input.value)
    }
    SilexNotification.cbkCancel = () => {
      cbk(false, null)
    }
    (SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_ok`) as HTMLElement).onclick = (e) => SilexNotification.close(true);
    (SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_cancel`) as HTMLElement).onclick = (e) => SilexNotification.close(false)
  }

  /**
   * ask for confirmation
   */
  static confirm(title: string, content: string, cbk: (isOk: boolean) => any, labelOk: string = 'ok', labelCancel: string = 'cancel') {
    SilexNotification.close()
    SilexNotification.create(SilexNotification.getMarkup({
      labelOk,
      labelCancel,
      title,
      content,
    }))
    SilexNotification.cbkOk = () => cbk(true)
    SilexNotification.cbkCancel = () => cbk(false);

    (SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_ok`) as HTMLElement).onclick = (e) => SilexNotification.close(true);
    (SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_cancel`) as HTMLElement).onclick = (e) => SilexNotification.close(false)
  }

  /**
   * notify the user with success formatting
   */
  static notifySuccess(message: string) {
    const container: HTMLElement = document.querySelector('.alerts-notify')
    const el = document.createElement('p')
    el.innerHTML = message
    container.appendChild(el)
    const id = setTimeout(() => {
      el.remove()
    }, SilexNotification.NOTIFICATION_DURATION_MS)
    el.onclick = (e) => {
      clearTimeout(id)
      el.remove()
    }
  }

  /**
   * notify the user with success formatting
   */
  static notifyError(message: string) {
    console.error(message)
    SilexNotification.notifySuccess(message)
  }

  /**
   * change the text of the current notification
   */
  static setContent(el: HTMLElement|DocumentFragment, keepExisiting= false) {
    if (SilexNotification.currentDialog) {
      const container = SilexNotification.currentDialog.querySelector(`.${SilexNotification.NOTIFICATION_CSS_CLASS}_content`)
      if (!keepExisiting) { container.innerHTML = '' }
      container.appendChild(el)
      SilexNotification.updateFocus()
    }
  }

  /**
   * change the text of the current notification
   */
  static setText(text: string) {
    if (SilexNotification.currentDialog) {
      const el = document.createElement('div')
      el.insertAdjacentHTML('afterbegin', `<p>${text}</p>`)
      SilexNotification.setContent(el)
    }
  }

  /**
   * add a button to the button bar
   */
  static addButton(el: HTMLElement|DocumentFragment) {
    if (SilexNotification.currentDialog) {
      const buttonBar = SilexNotification.currentDialog.querySelector(`.${SilexNotification.NOTIFICATION_CSS_CLASS}_buttons`)
      buttonBar.appendChild(el)
      SilexNotification.updateFocus()
    }
  }

  /**
   * add an HTML panel with info of type "while you wait, here is an info"
   */
  static setInfoPanel(element: HTMLElement) {
    if (SilexNotification.currentDialog) {
      let infoPanel = SilexNotification.currentDialog.querySelector(`#${SilexNotification.NOTIFICATION_CSS_CLASS}_info`) as HTMLElement
      if (!infoPanel) {
        infoPanel = document.createElement('div')
        infoPanel.insertAdjacentHTML('afterbegin', `<p class="${SilexNotification.NOTIFICATION_CSS_CLASS}_info"></p>`)
        SilexNotification.setContent(infoPanel, true)
      }

      // limit height so that small screens still see the close button
      infoPanel.style.maxHeight = Math.round(window.innerHeight * 2 / 3) + 'px'
      SilexNotification.currentDialog.insertBefore(infoPanel, SilexNotification.currentDialog.childNodes[SilexNotification.currentDialog.childNodes.length - 1])
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
      <section class="${SilexNotification.NOTIFICATION_CSS_CLASS}">
        <h2>${options.title}</h2>
        <p class="${SilexNotification.NOTIFICATION_CSS_CLASS}_content">
          ${options.content}
          ${
            typeof options.defaultValue !== 'undefined' ? `
              <input
                autofocus
                id="${SilexNotification.NOTIFICATION_CSS_CLASS}_value"
                ${options.placeholder ? `placeholder="${options.placeholder}"` : ''}
                class="block-dialog" type="text" value="${options.defaultValue}"
              >`
              : ''
          }
        </p>
        <div class="${SilexNotification.NOTIFICATION_CSS_CLASS}_buttons">
          ${options.labelCancel ? `<input id="${SilexNotification.NOTIFICATION_CSS_CLASS}_cancel" type="button" value="${options.labelCancel}">` : ''}
          ${options.labelOk ? `<input id="${SilexNotification.NOTIFICATION_CSS_CLASS}_ok" type="button" value="${options.labelOk}">` : ''}
        </div>
      </section>
    `
  }

  private static create(markup: string) {
    const container: HTMLElement = document.querySelector('.alerts')
    container.insertAdjacentHTML('afterbegin', markup)
    container.classList.remove('closed')
    SilexNotification.updateFocus()
  }
  private static updateFocus() {
    const input = (SilexNotification.currentDialog.querySelector('[autofocus]') as HTMLElement)
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
