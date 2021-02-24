/**
 * @fileoverview This class handles the property panes,
 * which display the selection properties in the property tool box.
 *
 */

import { BgPane } from './pane/BgPane'
import { BorderPane } from './pane/BorderPane'
import { ComponentPane } from './pane/ComponentPane'
import { Dialog } from '../ui-store/types'
import { ElementState } from '../element-store/types'
import { GeneralStylePane } from './pane/GeneralStylePane'
import { PagePane } from './pane/PagePane'
import { PropertyPane } from './pane/PropertyPane'
import { StyleEditorPane } from './pane/StyleEditorPane'
import { StylePane } from './pane/StylePane'
import { TreePane } from './pane/TreePane';
import { browse, editLink } from '../element-store/utils'
import { getSelectedElements } from '../element-store/filters'
import { getSite } from '../site-store/index'
import { getUi, subscribeUi } from '../ui-store/index'
import { getUiElements } from '../ui-store/UiElements'
import { getVisibleDialogs } from '../ui-store/utils';
import {
  isComponent,
  openComponentEditor,
  resetComponentEditor
} from '../element-store/component'
import { openDialog } from '../ui-store/dispatchers'
import { subscribeElements, updateElements } from '../element-store/index'
import { updateUi } from '../ui-store';

// element which contains the UI
const element = getUiElements().propertyTool

// init once to create all panes and attach events to the UI
let initDone = false
export function initPropertyTool() {
  // setTimeout to let simplebar lib initialize
  setTimeout(() => {
    if(!initDone) buildUi()
    initDone = true
  }, 0)
}

/**
 * build the UI
 */
function buildUi() {
  const bgPane = new BgPane(element.querySelector('.background-editor'))
  const borderPane = new BorderPane(element.querySelector('.border-editor'))
  const componentPane = new ComponentPane(element.querySelector('.component-generic-editor'))
  const propertyPane = new PropertyPane(element)
  const pagePane = new PagePane(element.querySelector('.page-editor'))
  const generalStylePane = new GeneralStylePane(element.querySelector('.general-editor'))
  const stylePane = new StylePane(element.querySelector('.style-editor'))

  // Style editor
  const styleEditorMenu = element.querySelector('.prodotype-style-editor') as HTMLElement
  const styleEditorPane = new StyleEditorPane(styleEditorMenu)

  // expandables
  const expandables = element.querySelectorAll('.expandable legend')
  for (let idx = 0; idx < expandables.length; idx++) {
    const el: HTMLElement = expandables[idx] as HTMLElement
    const lsKey = 'silex-expand-property-' + idx
    const isExpand = window.localStorage.getItem(lsKey) === 'true'
    if (isExpand) {
      togglePanel(el)
    }
    el.onclick = (e) => {
      togglePanel(el)
      window.localStorage.setItem(lsKey, (el.parentElement as HTMLElement).classList.contains('expanded').toString())
    }
  }

  // default tabs
  getUi().dialogs.filter(d => d.type === 'properties')
  .forEach(d => addTab(d))

  // display component when possible
  const componentEditorMenu = element.querySelector('.prodotype-component-editor') as HTMLElement
  subscribeElements(() => updateComponentTool(componentEditorMenu))

  subscribeUi((prevState, nextState) => {
    const removed = prevState.dialogs
    .filter(d => d.type === 'properties')
    .filter(d1 => !nextState.dialogs.find(d2 => d2.type === d1.type && d2.id === d1.id))
    removed.forEach((t) => removeTab(t))

    const created = nextState.dialogs
    .filter(d => d.type === 'properties')
    .filter(d1 => !prevState.dialogs.find(d2 => d2.type === d1.type && d2.id === d1.id))
    created.forEach((t) => addTab(t))

    const prevVisible = getVisibleDialogs('properties', prevState)
    const nextVisible = getVisibleDialogs('properties', nextState)
    const opened = nextVisible.filter(d1 => !prevVisible.find(d2 => d2.id === d1.id && d2.type === d1.type))
    // const closed = prevVisible.filter(d1 => !nextVisible.find(d2 => d2.id === d1.id && d2.type === d1.type))
    if(opened.length) {
      // hide or show when click on tabs
      updateComponentTool(componentEditorMenu)

      //  update selected tab
      openTab(opened[0])
    }
  })

  setTimeout(() => {
    // additional panes
    // TODO: all panes should be created like this
    const ui = getUi()
    updateUi({
      ...ui,
      dialogs: ui.dialogs.concat({
        id: 'tree-editor',
        type: 'properties',
        visible: false,
        data: {
          className: 'fa-list',
        },
      })
    })
    const container = document.createElement('section')
    container.classList.add('editor-container', 'tree-editor-container')
    element.querySelector('.main-container').appendChild(container)
    new TreePane(container)
  }, 100)
}

function updateComponentTool(el: HTMLElement) {
  const selectedComponents = getSelectedElements().filter((e) => isComponent(e))
  const [currentToolbox] = getVisibleDialogs('properties')

  if (currentToolbox.id === 'params' && selectedComponents.length === 1) {
    editComponent(selectedComponents[0])
    el.style.display = ''
  } else {
    el.style.display = 'none'
    resetComponentEditor()
  }
}

/**
 * toggle a property panel
 * TODO: use details tag instead of css classes
 */
function togglePanel(el: HTMLElement) {
  (el.parentElement as HTMLElement).classList.toggle('expanded')
  const caret = el.querySelector('.fa-inverse')
  if (caret) {
    caret.classList.toggle('fa-caret-right')
    caret.classList.toggle('fa-caret-down')
  }
}

// ////////////
// helpers to manage tab elements
// ////////////

const cbkBinded = new Map<string, () => void>()

function addTab(dialog: Dialog) {
  const tabEl = getTabElement(dialog.id) || document.createElement('div')
  tabEl.classList.add(dialog.id, 'tab', 'fa', 'fa-lg', dialog.data?.className || 'no-dialog-class')
  tabEl.innerHTML = dialog.data?.displayName || ''

  const tabs = element.querySelector('.tabs .simplebar-content')
  tabs.appendChild(tabEl)

  const openBinded = () => openDialog(dialog)
  tabEl.addEventListener('click', openBinded)
  cbkBinded.set(dialog.id, openBinded)
}

function removeTab(dialog: Dialog) {
  const tabEl = getTabElement(dialog.id)
  if (tabEl) {
    const openBinded = cbkBinded.get(dialog.id)
    cbkBinded.delete(dialog.id)
    tabEl.removeEventListener('click', openBinded)
    tabEl.remove()
  }
}

function getTabElement(dialogId: string): HTMLElement {
  const tabs = element.querySelector('.tabs .simplebar-content')
  return tabs.querySelector('.' + dialogId)
}

function openTab(dialog: Dialog) {
  const tabEl = getTabElement(dialog.id)
  selectTab(tabEl)
}

function selectTab(tabEl: HTMLElement) {
  const tabs = element.querySelector('.tabs .simplebar-content')
  Array.from(tabs.querySelectorAll('.tab'))
  .forEach((el) => el.classList.remove('on'))
  tabEl.classList.add('on')
}

/**
 * @param element, the component to edit
 */
function editComponent(component: ElementState) {
  if (component && component.data.component) {
    const componentData = component.data.component
    openComponentEditor({
      data: componentData.data,
      dataSources: getSite().dataSources,
      templateName: componentData.templateName,
      events: {
        onChange: (newData, html) => {
          // store the component's data for later edition
          updateElements([{
            ...component,
            data: {
              ...component.data,
              component: {
                ...component.data.component,
                data: {
                  ...component.data.component.data,
                  ...newData,
                },
              },
            },
            innerHtml: html,
          }])

        },
        onBrowse: (e, url, cbk) => browse(e, cbk),
        onEditLink: (e, link, cbk) => editLink(e, link, cbk),
      }
    })
  } else {
    resetComponentEditor()
  }
}
