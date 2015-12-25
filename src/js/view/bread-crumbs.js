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
    if (!opt_selectedElements) opt_selectedElements = this.model.body.getSelection();
    // get the common ancesters to all selected elements
    let ancestors = [this.model.file.getContentDocument().body];
    opt_selectedElements.forEach((element) => {
      console.log(element);
    });
  });
};
