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

///////////////////
// API for the outside world
let instance: PropertyTool
export function initPropertyTool() {
  instance = instance || new PropertyTool(getUiElements().propertyTool)
  return instance
}
export function openParamsTab() {
  initPropertyTool()
  return instance.openParamsTab()
}

/**
 * the Silex PropertyTool class handles the panes actually displaying the
 * properties
 *
 * TODO: make this only methods and write tests
 */
class PropertyTool {

  componentEditorElement: any;

  /**
   * base url for relative/absolute urls
   */
  baseUrl = null;

  /**
   * bg editor
   * @see     silex.view.pane.BgPane
   */
  bgPane: BgPane = null;

  /**
   * property editor
   * @see     silex.view.pane.PropertyPane
   */
  propertyPane: PropertyPane = null;

  /**
   * editor
   * @see     silex.view.pane.BorderPane
   */
  borderPane: BorderPane = null;

  /**
   * property editor
   * @see     silex.view.pane.PagePane
   */
  pagePane: PagePane = null;

  /**
   * property editor
   * @see     silex.view.pane.GeneralStylePane
   */
  generalStylePane: GeneralStylePane = null;

  /**
   * property editor
   * @see     silex.view.pane.StylePane
   */
  stylePane: StylePane = null;

  /**
   * style editor
   * @see     silex.view.pane.StyleEditorPane
   */
  styleEditorPane: StyleEditorPane = null;

  constructor(public element: HTMLElement) {}

  /**
   * build the UI
   */
  buildUi() {
    this.bgPane = new BgPane(this.element.querySelector('.background-editor'))
    this.borderPane = new BorderPane(this.element.querySelector('.border-editor'))
    this.propertyPane = new PropertyPane(this.element)
    this.pagePane = new PagePane(this.element.querySelector('.page-editor'))
    this.generalStylePane = new GeneralStylePane(this.element.querySelector('.general-editor'))
    this.stylePane = new StylePane(this.element.querySelector('.style-editor'))

    // Style editor
    const styleEditorMenu = this.element.querySelector('.prodotype-style-editor .prodotype-style-editor-menu') as HTMLElement;
    this.styleEditorPane = new StyleEditorPane(styleEditorMenu)

    // init component editor and style editor
    const styleEditorElement = this.element.querySelector('.prodotype-style-editor .prodotype-container');
    this.componentEditorElement = this.element.querySelector('.prodotype-component-editor');
    this.model.component.init(this.componentEditorElement, styleEditorElement);
    subscribeElements(() => {
      const selectedComponents = getElements().filter((el) => el.selected && el.type === ElementType.COMPONENT)
      if (selectedComponents.length === 1) {
        this.controller.editMenuController.editComponent(selectedComponents[0])
      } else {
        this.controller.editMenuController.editComponent(null)
      }
    })

    // expandables
    const expandables = this.element.querySelectorAll('.expandable legend');
    for (let idx = 0; idx < expandables.length; idx++) {
      const el: HTMLElement = expandables[idx] as HTMLElement;
      const lsKey = 'silex-expand-property-' + idx;
      const isExpand = window.localStorage.getItem(lsKey) === 'true';
      if (isExpand) {
        this.togglePanel(el);
      }
      el.onclick = (e) => {
        this.togglePanel(el);
        window.localStorage.setItem(lsKey, (el.parentElement as HTMLElement).classList.contains('expanded').toString());
      };
    }

    // tabs
    const designTab = this.element.querySelector('.design');
    const paramsTab = this.element.querySelector('.params');
    const styleTab = this.element.querySelector('.style');
    designTab.addEventListener('click', () => this.openDesignTab());
    paramsTab.addEventListener('click', () => this.openParamsTab());
    styleTab.addEventListener('click', () => this.openStyleTab());
  }

  /**
   * toggle a property panel
   */
  togglePanel(el: HTMLElement) {
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
  openDesignTab() {
    const designTab = this.element.querySelector('.design');
    this.selectTab(designTab);
    this.element.classList.remove('params-tab');
    this.element.classList.remove('style-tab');
    this.element.classList.add('design-tab');
  }

  /**
   * open the "params" tab
   */
  openParamsTab() {
    const paramsTab = this.element.querySelector('.params');
    this.selectTab(paramsTab);
    this.element.classList.remove('design-tab');
    this.element.classList.remove('style-tab');
    this.element.classList.add('params-tab');
  }

  /**
   * open the "style" tab
   */
  openStyleTab() {
    const styleTab = this.element.querySelector('.style');
    this.selectTab(styleTab);
    this.element.classList.remove('design-tab');
    this.element.classList.remove('params-tab');
    this.element.classList.add('style-tab');
  }

  selectTab(tab) {
    Array.from(this.element.querySelectorAll('.tab'))
    .forEach((el) => el.classList.remove('on'));
    tab.classList.add('on');
  }
}
