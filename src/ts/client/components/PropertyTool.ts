/**
 * @fileoverview This class handles the property panes,
 * which display the selection properties in the property tool box.
 *
 */

import { BgPane } from './pane/BgPane'
import { BorderPane } from './pane/BorderPane'
import { ElementState } from '../element-store/types'
import { GeneralStylePane } from './pane/GeneralStylePane'
import { PagePane } from './pane/PagePane'
import { PropertyPane } from './pane/PropertyPane'
import { StyleEditorPane } from './pane/StyleEditorPane'
import { StylePane } from './pane/StylePane'
import { Toolboxes } from '../ui-store/types'
import { browse, editLink } from '../element-store/utils'
import { getDomElement } from '../element-store/dom'
import { getSelectedElements } from '../element-store/filters'
import { getSite } from '../site-store/index'
import { getSiteDocument } from './SiteFrame'
import { getUi, subscribeUi } from '../ui-store/index'
import { getUiElements } from '../ui-store/UiElements'
import {
  isComponent,
  openComponentEditor,
  resetComponentEditor
} from '../element-store/component'
import { openToolbox } from '../ui-store/dispatchers'
import { subscribeElements, updateElements } from '../element-store/index'

// element which contains the UI
const element = getUiElements().propertyTool

// init once to create all panes and attach events to the UI
let initDone = false
export function initPropertyTool() {
  if(!initDone) buildUi()
  initDone = true
}

/**
 * build the UI
 */
function buildUi() {
  const bgPane = new BgPane(element.querySelector('.background-editor'))
  const borderPane = new BorderPane(element.querySelector('.border-editor'))
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

  // tabs
  const designTab = element.querySelector('.design')
  const paramsTab = element.querySelector('.params')
  const styleTab = element.querySelector('.style')
  designTab.addEventListener('click', () => openToolbox(Toolboxes.PROPERTIES))
  paramsTab.addEventListener('click', () => openToolbox(Toolboxes.PARAMS))
  styleTab.addEventListener('click', () => openToolbox(Toolboxes.STYLES))

  // display component when possible
  const componentEditorMenu = element.querySelector('.prodotype-component-editor') as HTMLElement
  subscribeElements(() => updateComponentTool(componentEditorMenu))

  subscribeUi((prevState, nextState) => {
    if(prevState.currentToolbox !== nextState.currentToolbox) {
      // hide or show when click on tabs
      updateComponentTool(componentEditorMenu)

      //  update selected tab
      openTab(nextState.currentToolbox)
    }
  })
}

function updateComponentTool(el: HTMLElement) {
  const selectedComponents = getSelectedElements().filter((e) => isComponent(e))
  const { currentToolbox } = getUi()

  if (currentToolbox === Toolboxes.PARAMS && selectedComponents.length === 1) {
    editComponent(selectedComponents[0])
    el.style.display = ''
  } else {
    el.style.display = 'none'
    resetComponentEditor()
  }
}

/**
 * toggle a property panel
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
 * open the desired tab
 */
function openTab(cssClass) {
  const tab = element.querySelector('.' + cssClass)
  selectTab(tab)
}

function selectTab(tab) {
  Array.from(element.querySelectorAll('.tab'))
  .forEach((el) => el.classList.remove('on'))
  tab.classList.add('on')
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
