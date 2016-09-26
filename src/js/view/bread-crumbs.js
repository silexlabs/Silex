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
 * @fileoverview
 * the Silex bread crumbs, which displays the selection's containers
 *
 */


goog.provide('silex.view.BreadCrumbs');


/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.BreadCrumbs = function(element, model, controller) {
  // store references
  /**
   * @type {Element}
   */
  this.element = element;
  /**
   * @type {!silex.types.Model}
   */
  this.model = model;
  /**
   * @type {!silex.types.Controller}
   */
  this.controller = controller;


  /**
   * invalidation mechanism
   * @type {InvalidationManager}
   */
  this.invalidationManager = new InvalidationManager(500);

};

silex.view.BreadCrumbs.EDITABLE_STYLE_HOVER_CLASS = 'editable-style-hover';

/**
 * to be consistent with views
 * called by the app constructor
 */
silex.view.BreadCrumbs.prototype.buildUi = function() {
};


/**
 * the selection has changed
 * called by silex.model.Body
 * @param   {?Array.<HTMLElement>=} opt_selectedElements the selected elements
 * @param   {?Array.<string>=} opt_pageNames   the names of the pages
 * @param   {?string=}  opt_currentPageName   the name of the current page
 */
silex.view.BreadCrumbs.prototype.redraw = function(opt_selectedElements, opt_pageNames, opt_currentPageName) {
  this.invalidationManager.callWhenReady(() => {
    // get the selection if not provided
    opt_selectedElements = opt_selectedElements ? opt_selectedElements : this.model.body.getSelection();
    // clone the selection array in order to avoid side effects after manipulating the array
    let selectedElements = [];
    opt_selectedElements.forEach((element) => selectedElements.push(element));
    // get the common ancesters to all selected elements
    function getParents(elem) {
      let parents = [];
      while(elem && elem.tagName !== 'HTML') {
        parents.unshift(elem);
        elem = elem.parentNode;
      }
      return parents;
    }
    // find the selected element which is the "deepest" in the dom, i.e. has the greater number of parent nodes
    selectedElements.sort((elem1, elem2) => getParents(elem2).length - getParents(elem1).length);
    let deepest = selectedElements.shift();
    // for this "deepest" element, find the common ancestors with all others
    let ancestors = getParents(deepest);
    selectedElements.forEach((element) => {
      let parents = getParents(element);
      let newAncestors = [];
      let idx = 0;
      while(idx < ancestors.length && idx < parents.length && ancestors[idx] === parents[idx]) {
        newAncestors.push(ancestors[idx++]);
      }
      ancestors = newAncestors;
    });
    // empty current bread crumbs
    while(this.element.childNodes.length) this.removeCrumb(this.element.childNodes[0]);
    // create a button for each ancester
    ancestors.forEach((ancestor) => this.addCrumb(ancestor));
  });
};


/**
 * add a button in the bread crumb container
 * @param {HTMLElement} ancestor
 */
silex.view.BreadCrumbs.prototype.addCrumb = function(ancestor) {
  let crumb = document.createElement('DIV');
  let cssClasses = this.model.element.getClassName(ancestor);
  if(cssClasses !== '') cssClasses = '.' + cssClasses.split(' ').join('.');
  crumb.classList.add('crumb');
  crumb.innerHTML = ancestor.tagName + '.' + ancestor.getAttribute('data-silex-type') + '-element' + cssClasses;
  crumb.style.zIndex = 100 - this.element.childNodes.length;
  this.element.appendChild(crumb);
  crumb.onclick = () => this.controller.stageController.select(ancestor);
  if(ancestor.tagName.toUpperCase() !== 'BODY') {
      crumb.onmouseover = () => ancestor.classList.add(silex.view.BreadCrumbs.EDITABLE_STYLE_HOVER_CLASS);
      crumb.onmouseout = () => ancestor.classList.remove(silex.view.BreadCrumbs.EDITABLE_STYLE_HOVER_CLASS);
  }
  const svg = '<svg class="svg" viewBox="0 0 7 28" height="28" width="7"><path d="M.5 0l6 14-6 14H7V0z" fill="currentColor"></path><path d="M1 0H0l6 14-6 14h1l6-14z" fill="#858585"></path></svg>';
  const sep = document.createElement('DIV');
  sep.classList.add('sep');
  sep.innerHTML = svg;
  this.element.appendChild(sep);
};


/**
 * remove events and deletes a bread crumb
 * @param {HTMLElement} crumb
 */
silex.view.BreadCrumbs.prototype.removeCrumb = function(crumb) {
  this.element.removeChild(crumb);
};
