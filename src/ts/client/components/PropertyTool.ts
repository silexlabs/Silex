/**
 * @fileoverview This class handles the property panes,
 * which display the selection properties in the property tool box.
 *
 */

import { BgPane } from './pane/BgPane'
import { BorderPane } from './pane/BorderPane'
import { ComponentPane } from './pane/ComponentPane'
import { ElementState } from '../element-store/types'
import { GeneralStylePane } from './pane/GeneralStylePane'
import { PagePane } from './pane/PagePane'
import { PropertyPane } from './pane/PropertyPane'
import { StyleEditorPane } from './pane/StyleEditorPane'
import { StylePane } from './pane/StylePane'
import { TreePane } from './pane/TreePane'
import { browse, editLink } from '../element-store/utils'
import { getSelectedElements } from '../element-store/filters'
import { getSite } from '../site-store/index'
import { getUi, subscribeUi } from '../ui-store/index'
import { getUiElements } from '../ui-store/UiElements'
import { getVisibleDialogs } from '../ui-store/utils'
import {
  isComponent,
  openComponentEditor,
  resetComponentEditor
} from '../element-store/component'
import { subscribeElements, updateElements } from '../element-store/index'
import { tabbed } from './tabbed'
import { updateUi } from '../ui-store'

// element which contains the UI
const element = getUiElements().propertyTool

// init once to create all panes and attach events to the UI
let initDone = false
export function initPropertyTool() {
  // setTimeout to let simplebar lib initialize
  setTimeout(() => {
    if(!initDone) buildUi()
    initDone = true
  }, 2000) // Workaround https://github.com/silexlabs/Silex/issues/1194
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

  const tabContainer: HTMLElement = element.querySelector('.tabs .simplebar-content')
  tabbed(tabContainer, 'properties')

  // display component when possible
  subscribeElements(() => updateComponentTool())
  subscribeUi(() => updateComponentTool())

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
          className: 'fa fa-lg fa-list',
        },
      })
    })
    const container = document.createElement('section')
    container.classList.add('editor-container', 'tree-editor-container')
    element.querySelector('.main-container').appendChild(container)
    new TreePane(container)
  }, 100)
}

function updateComponentTool() {
  const componentEditorMenu = element.querySelector('.prodotype-component-editor') as HTMLElement
  const selectedComponents = getSelectedElements().filter((e) => isComponent(e))
  const [currentToolbox] = getVisibleDialogs('properties')

  if (currentToolbox?.id === 'params' && selectedComponents.length === 1) {
    editComponent(selectedComponents[0])
    componentEditorMenu.style.display = ''
  } else {
    componentEditorMenu.style.display = 'none'
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
