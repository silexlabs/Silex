/**
 * This is a mechanism for all tabbed UI
 * For example the properties pane has tabs (style, components...)
 * Each tab is an element in getUi().dialogs list which has type === 'properties'
 * @see ui-store/types.ts
 */

import { Dialog } from '../ui-store/types'
import { getUi, subscribeUi } from '../ui-store'
import { getVisibleDialogs } from '../ui-store/utils'
import { openDialog } from '../ui-store/dispatchers'

export function tabbed(container: HTMLElement, type: string) {
  if(!container) {
    console.error('Incorrect input', {container, type})
    throw new Error('Incorrect input, missing container')
  }
  // initial tabs
  getUi().dialogs
  .filter(d => d.type === type)
  .forEach(d => addTab(container, d))

  // update tabs
  subscribeUi((prevState, nextState) => {
    const removed = prevState.dialogs
    .filter(d => d.type === type)
    .filter(d1 => !nextState.dialogs.find(d2 => d2.type === d1.type && d2.id === d1.id))
    removed.forEach((t) => removeTab(container, t))

    const created = nextState.dialogs
    .filter(d => d.type === type)
    .filter(d1 => !prevState.dialogs.find(d2 => d2.type === d1.type && d2.id === d1.id))
    created.forEach((t) => addTab(container, t))

    const prevVisible = getVisibleDialogs(type, prevState)
    const nextVisible = getVisibleDialogs(type, nextState)
    const opened = nextVisible.filter(d1 => !prevVisible.find(d2 => d2.id === d1.id && d2.type === d1.type))
    // const closed = prevVisible.filter(d1 => !nextVisible.find(d2 => d2.id === d1.id && d2.type === d1.type))
    if(opened.length) {
      //  update selected tab
      openTab(container, opened[0])
    }
  })
}

// ////////////
// helpers to manage tab elements
// ////////////

const cbkBinded = new Map<string, () => void>()

function addTab(container: HTMLElement, dialog: Dialog) {
  // create tab element
  const tabEl = getTabElement(container, dialog) || createTabElement(container, dialog)

  // open event
  const openBinded = () => openDialog(dialog)
  tabEl.addEventListener('click', openBinded)
  cbkBinded.set(dialog.id, openBinded)

  // mark as opened
  if(dialog.visible) openTab(container, dialog)
}

function removeTab(container: HTMLElement, dialog: Dialog) {
  const tabEl = getTabElement(container, dialog)
  if (tabEl) {
    const openBinded = cbkBinded.get(dialog.id)
    cbkBinded.delete(dialog.id)
    tabEl.removeEventListener('click', openBinded)
    tabEl.remove()
  }
}

function openTab(container: HTMLElement, dialog: Dialog) {
  const tabEl = getTabElement(container, dialog)
  Array.from(container.querySelectorAll('.tab'))
  .forEach((el) => el.classList.remove('on'))
  tabEl.classList.add('on')
}

function createTabElement(container: HTMLElement, dialog: Dialog): HTMLElement {
  const tabEl = document.createElement(dialog.data?.tag || 'div')
  tabEl.classList.add(dialog.id, 'tab')
  tabEl.classList.add(...dialog.data?.className?.split(' ') || 'no-dialog-class')
  tabEl.innerHTML = dialog.data?.displayName || ''
  container.appendChild(tabEl)

  return tabEl
}

function getTabElement(container: HTMLElement, dialog: Dialog): HTMLElement {
  return container.querySelector('.' + dialog.id)
}
