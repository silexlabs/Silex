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

import { Constants } from '../../Constants';
import { Controller, Model } from '../types';
import { InvalidationManager } from '../utils/invalidation-manager';
import { BgPane } from './pane/bg-pane';
import { BorderPane } from './pane/border-pane';
import { GeneralStylePane } from './pane/general-style-pane';
import { PagePane } from './pane/page-pane';
import { PropertyPane } from './pane/property-pane';
import { StylePane } from './pane/style-pane';
import { StyleEditorPane } from './pane/StyleEditorPane';
import { SelectableState } from 'stage/src/ts/Types';


//////////////////////////////////////////////////////////////////
// PropertyTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PropertyTool class handles the panes actually displaying the
 * properties
 *
 * @param element   container to render the UI
 * @param model  model class which holds
  * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class PropertyTool {
  /**
   * invalidation mechanism
   */
  invalidationManager: InvalidationManager;

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


  constructor(public element: HTMLElement, public model: Model, public controller: Controller) {
    this.invalidationManager = new InvalidationManager(500);
  }

  /**
   * build the UI
   */
  buildUi() {
    this.bgPane = new BgPane(this.element.querySelector('.background-editor'), this.model, this.controller);
    this.borderPane = new BorderPane(this.element.querySelector('.border-editor'), this.model, this.controller);
    this.propertyPane = new PropertyPane(this.element, this.model, this.controller);
    this.pagePane = new PagePane(this.element.querySelector('.page-editor'), this.model, this.controller);
    this.generalStylePane = new GeneralStylePane(this.element.querySelector('.general-editor'), this.model, this.controller);
    this.stylePane = new StylePane(this.element.querySelector('.style-editor'), this.model, this.controller);

    // Style editor
    const styleEditorMenu = this.element.querySelector('.prodotype-style-editor .prodotype-style-editor-menu') as HTMLElement;
    this.styleEditorPane = new StyleEditorPane(styleEditorMenu, this.model, this.controller);

    // init component editor and style editor
    const styleEditorElement = this.element.querySelector('.prodotype-style-editor .prodotype-container');
    this.componentEditorElement = this.element.querySelector('.prodotype-component-editor');
    this.model.component.init(this.componentEditorElement, styleEditorElement);

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
    const onTabs = this.element.querySelectorAll('.tab');
    for (let idx = 0; idx < onTabs.length; idx++) {
      onTabs[idx].classList.remove('on');
    }
    tab.classList.add('on');
  }

  /**
   * redraw all panes
   * @param states the elements currently selected
   * @param pageNames   the names of the pages which appear in the current HTML file
   * @param  currentPageName   the name of the current page
   */
  redraw(states: SelectableState[], pageNames: string[],currentPageName: string) {
    this.invalidationManager.callWhenReady(() => {
      // refresh panes
      this.borderPane.redraw(states, pageNames, currentPageName);
      this.propertyPane.redraw(states, pageNames, currentPageName);
      this.pagePane.redraw(states, pageNames, currentPageName);
      this.generalStylePane.redraw(states, pageNames, currentPageName);
      this.stylePane.redraw(states, pageNames, currentPageName);
      this.bgPane.redraw(states, pageNames, currentPageName);
      this.styleEditorPane.redraw(states, pageNames, currentPageName);
      if (states.length === 1) {
        this.controller.editMenuController.editComponent(states[0].el);
      } else {
        this.model.component.resetSelection(Constants.COMPONENT_TYPE);
      }
    });
  }
}
