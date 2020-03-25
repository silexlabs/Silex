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

import { ElementType } from '../element/types';
import { getElements, subscribeElements } from '../element/store';
import { BgPane } from './pane/BgPane';
import { BorderPane } from './pane/BorderPane';
import { GeneralStylePane } from './pane/GeneralStylePane';
import { PagePane } from './pane/PagePane';
import { PropertyPane } from './pane/PropertyPane';
import { StyleEditorPane } from './pane/StyleEditorPane';
import { StylePane } from './pane/StylePane';
import { getUiElements } from '../ui/UiElements'
import { editComponent } from '../api/element'
import { resetComponentEditor } from '../element/component'

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
  const styleEditorMenu = element.querySelector('.prodotype-style-editor .prodotype-style-editor-menu') as HTMLElement;
  const styleEditorPane = new StyleEditorPane(styleEditorMenu)

  // display component when possible
  subscribeElements(() => {
    const selectedComponents = getElements().filter((el) => el.selected && el.type === ElementType.COMPONENT)
    if (selectedComponents.length === 1) {
      editComponent(selectedComponents[0])
    } else {
      resetComponentEditor()
    }
  })

  // expandables
  const expandables = element.querySelectorAll('.expandable legend');
  for (let idx = 0; idx < expandables.length; idx++) {
    const el: HTMLElement = expandables[idx] as HTMLElement;
    const lsKey = 'silex-expand-property-' + idx;
    const isExpand = window.localStorage.getItem(lsKey) === 'true';
    if (isExpand) {
      togglePanel(el);
    }
    el.onclick = (e) => {
      togglePanel(el);
      window.localStorage.setItem(lsKey, (el.parentElement as HTMLElement).classList.contains('expanded').toString());
    };
  }

  // tabs
  const designTab = element.querySelector('.design');
  const paramsTab = element.querySelector('.params');
  const styleTab = element.querySelector('.style');
  designTab.addEventListener('click', () => openDesignTab());
  paramsTab.addEventListener('click', () => openParamsTab());
  styleTab.addEventListener('click', () => openStyleTab());
}

/**
 * toggle a property panel
 */
function togglePanel(el: HTMLElement) {
  (el.parentElement as HTMLElement).classList.toggle('expanded');
  const caret = el.querySelector('.fa-inverse');
  if (caret) {
    caret.classList.toggle('fa-caret-right');
    caret.classList.toggle('fa-caret-down');
  }
}

/**
 * open the "design" tab
 */
export function openDesignTab() {
  const designTab = element.querySelector('.design');
  selectTab(designTab);
  element.classList.remove('params-tab');
  element.classList.remove('style-tab');
  element.classList.add('design-tab');
}

/**
 * open the "params" tab
 */
export function openParamsTab() {
  const paramsTab = element.querySelector('.params');
  selectTab(paramsTab);
  element.classList.remove('design-tab');
  element.classList.remove('style-tab');
  element.classList.add('params-tab');
}

/**
 * open the "style" tab
 */
export function openStyleTab() {
  const styleTab = element.querySelector('.style');
  selectTab(styleTab);
  element.classList.remove('design-tab');
  element.classList.remove('params-tab');
  element.classList.add('style-tab');
}

function selectTab(tab) {
  Array.from(element.querySelectorAll('.tab'))
  .forEach((el) => el.classList.remove('on'));
  tab.classList.add('on');
}
