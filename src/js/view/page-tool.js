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

goog.provide('silex.view.PageTool');

/**
 * @constructor
 */
silex.view.PageTool = function(element) {
  // store the tool container
  this.element = element;
  // init the tool
  this.initEvents();
};


/**
 * reference to the element to render to
 * @type element
 */
silex.view.PageTool.prototype.element;


/**
 * callback for the events, passed by the controller
 */
silex.view.PageTool.prototype.onStatus;


/**
 * add listeners on the tool container
 */
silex.view.PageTool.prototype.initEvents = function(pages) {
  // listen for the click on a page
  goog.events.listen(this.element, goog.events.EventType.CLICK, function(e) {
    if (goog.dom.classes.has(e.target, 'delete')){
      // remove the page
      this.removePageAtIndex(this.getCellIndex(this.parentNode));
    }
    else if (goog.dom.classes.has(e.target, 'label')){
      // rename the page
      this.renamePageAtIndex(this.getCellIndex(this.parentNode));
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
silex.view.PageTool.prototype.refresh = function() {
  var pages = silex.view.JQueryPageable.getPages();

  // refresh the list with new pages
  var container = goog.dom.getElementByClass('page-tool-container', this.element);
  var templateHtml = goog.dom.getElementByClass('page-tool-template', this.element).innerHTML;
  container.innerHTML = silex.utils.dom.resolveTemplate(templateHtml, pages);
};


/**
 * ask to remove a page
 */
silex.view.PageTool.prototype.removePageAtIndex = function(idx) {
  if (this.onStatus) this.onStatus({
    type: 'delete',
    page: this.pages[idx]
  });
  this.refresh();
};


/**
 * ask to rename a page
 */
silex.view.PageTool.prototype.renamePageAtIndex = function(idx) {
  if (this.onStatus) this.onStatus({
    type: 'rename',
    page: this.pages[idx]
  });
  this.refresh();
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
  if (opt_notify && this.onStatus) this.onStatus({
    type: 'changed',
    page: page
  });
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
