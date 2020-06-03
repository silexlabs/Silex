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

/**
 * @fileoverview This class handles the property panes,
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
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
import { getElements, subscribeElements } from '../element-store/index'
import { getSite } from '../site-store/index'
import { getSiteDocument } from './SiteFrame'
import { getUiElements } from '../ui-store/UiElements'
import {
  isComponent,
  openComponentEditor,
  resetComponentEditor
} from '../element-store/component'
import { openToolbox } from '../ui-store/dispatchers'
import { subscribeUi } from '../ui-store/index'
import { updateElements } from '../element-store/index'

/**
 * @fileoverview the Silex PropertyTool class handles the panes actually displaying the
 * properties
 *
 */


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
  const styleEditorMenu = element.querySelector('.prodotype-style-editor .prodotype-style-editor-menu') as HTMLElement
  const styleEditorPane = new StyleEditorPane(styleEditorMenu)

  // display component when possible
  subscribeElements(() => {
    const selectedComponents = getElements().filter((el) => el.selected && isComponent(el))
    if (selectedComponents.length === 1) {
      editComponent(selectedComponents[0])
    } else {
      resetComponentEditor()
    }
  })

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

  // observer
  subscribeUi((prevState, nextState) => {
    if(prevState.currentToolbox !== nextState.currentToolbox) {
      openTab(nextState.currentToolbox)
    }
  })
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
  // element.classList.remove('params-tab');
  // element.classList.remove('style-tab');
  // element.classList.add('design-tab');
}

// /**
//  * open the "params" tab
//  */
// export function openParamsTab() {
//   const paramsTab = element.querySelector('.params');
//   selectTab(paramsTab);
//   element.classList.remove('design-tab');
//   element.classList.remove('style-tab');
//   element.classList.add('params-tab');
// }
//
// /**
//  * open the "style" tab
//  */
// export function openStyleTab() {
//   const styleTab = element.querySelector('.style');
//   selectTab(styleTab);
//   element.classList.remove('design-tab');
//   element.classList.remove('params-tab');
//   element.classList.add('style-tab');
// }

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
      data: componentData,
      dataSources: getSite().dataSources,
      templateName: componentData.templateName,
      events: {
        onChange: (newData, html) => {
          // undo checkpoint
          // undoCheckPoint()

          const domEl = getDomElement(getSiteDocument(), component)

          // store the component's data for later edition
          updateElements([{
            ...component,
            data: {
              ...component.data,
              component: {
                ...component.data.component,
                ...newData,
              },
            },
            innerHtml: html,
          }])

        },
        onBrowse: (e, url, cbk) => browse(e, cbk),
        onEditLink: (e, linkData, cbk) => editLink(e, linkData, cbk),
      }
    })
  } else {
    resetComponentEditor()
  }
}

