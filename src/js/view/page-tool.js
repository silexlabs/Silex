//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview The Silex PageTool class displays the list of pages
 *     and let the user interact with them.
 * @see silex.model.Page
 *
 */

goog.require('silex.view.ViewBase');
goog.provide('silex.view.PageTool');

/**
 * @constructor
 * @extend silex.view.ViewBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.PageTool = function(element, bodyElement, headElement) {
  // call super
  silex.view.ViewBase.call(this, element, headElement, bodyElement);

  // init the tool
  this.initEvents();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.PageTool, silex.view.ViewBase);


/**
 * reference to the element to render to
 * @type element
 */
silex.view.PageTool.prototype.element;


/**
 * add listeners on the tool container
 */
silex.view.PageTool.prototype.initEvents = function(pages) {
  // listen for the click on a page
  goog.events.listen(this.element, goog.events.EventType.CLICK, function(e) {
    if (goog.dom.classes.has(e.target, 'delete')){
      // remove the page
      this.removePageAtIndex(this.getCellIndex(e.target.parentNode));
    }
    else if (goog.dom.classes.has(e.target, 'label')){
      // rename the page
      this.renamePageAtIndex(this.getCellIndex(e.target.parentNode));
    }
    else{
      // select page
      this.setSelectedIndex(this.getCellIndex(e.target), true);
    }
  }, false, this);
}

/**
 * refresh the pages
 * find all pages in the dom and call setPages
 */
silex.view.PageTool.prototype.redraw = function() {
  var pages = silex.view.JQueryPageable.getPages();

  // refresh the list with new pages
  var container = goog.dom.getElementByClass('page-tool-container', this.element);
  var templateHtml = goog.dom.getElementByClass('page-tool-template', this.element).innerHTML;
  container.innerHTML = silex.utils.Dom.resolveTemplate(templateHtml, pages);
};


/**
 * ask to remove a page
 */
silex.view.PageTool.prototype.removePageAtIndex = function(idx) {
  if (this.onStatus) this.onStatus('delete', this.pages[idx]);
  this.redraw();
};


/**
 * ask to rename a page
 */
silex.view.PageTool.prototype.renamePageAtIndex = function(idx) {
  if (this.onStatus) this.onStatus('rename', this.pages[idx]);
  this.redraw();
};


/**
 * set the selection of pages
 * @param     notify    if true, then notify by calling the onChanged callback
 */
silex.view.PageTool.prototype.setSelectedIndex = function(index, opt_notify) {
  // mark selection
  var items = goog.dom.getElementsByClass('page-container', this.element);
  goog.array.forEach(items, function(item) {
    var idx = this.getCellIndex(item);
    if (index === idx) {
      goog.dom.classes.add(item, 'ui-selected');
    }
    else {
      goog.dom.classes.remove(item, 'ui-selected');
    }
  }, this);
  // notify the controller
  if (opt_notify && this.onStatus) this.onStatus('changed', page);
};


silex.view.PageTool.prototype.getCellIndex = function(element) {

  var items = goog.dom.getElementsByClass('page-container', this.element);
  var idx=0;
  while (idx<items.length && items[idx] != element){
    idx++;
  }
  if (idx >= items.length){
    idx = -1;
    console.error('Page not found for element ', element);
  }
  return idx;
};
