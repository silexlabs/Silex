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
 *   This class represents a the page model of the html file being edited
 *   It has methods to manipulate the pages
 *
 *   All model classes are singletons
 *
 */


goog.provide('silex.model.Page');
goog.provide('silex.model.PageData');


goog.require('silex.Config');
goog.require('silex.types.Model');



/**
 * structure to store all of a page data
 * @struct
 * @constructor
 */
silex.model.PageData = function() {
  /**
   * @type {string}
   */
  this.name;
  /**
   * @type {string}
   */
  this.displayName;
  /**
   * @type {string}
   */
  this.linkName;
  /**
   * @type {number}
   */
  this.idx;
};



/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Page = function(model, view) {
  this.model = model;
  this.view = view;
  // retrieve the element which will hold the body of the opened file
  this.iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
};


/**
 * constant for the class name of the pages
 * @const
 * @type {string}
 */
silex.model.Page.PAGE_CLASS_NAME = 'page-element';


/**
 * constant for the class name of elements visible only on some pages
 * @const
 * @type {string}
 */
silex.model.Page.PAGED_CLASS_NAME = 'paged-element';


/**
 * constant for the class name set on the body when the pageable plugin is initialized
 * @const
 * @type {string}
 */
silex.model.Page.PAGEABLE_PLUGIN_READY_CLASS_NAME = 'pageable-plugin-created';


/**
 * constant for the class name of elements visible only on some pages
 * @const
 * @type {string}
 */
silex.model.Page.PAGED_HIDDEN_CLASS_NAME = 'paged-element-hidden';


/**
 * constant for the class name of elements when it is in a visible page
 * this css class is set in pageable.js
 * @const
 * @type {string}
 */
silex.model.Page.PAGED_VISIBLE_CLASS_NAME = 'paged-element-visible';


/**
 * constant for the class name of links when it links to a visible page
 * this css class is set in pageable.js
 * @const
 * @type {string}
 */
silex.model.Page.PAGE_LINK_ACTIVE_CLASS_NAME = 'page-link-active';


/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.model.Page.PAGED_CLASS_NAME
 */
silex.model.Page.prototype.getParentPage = function(element) {
  var parent = element.parentNode;
  while (parent && !goog.dom.classlist.contains(parent, silex.model.Page.PAGED_CLASS_NAME)) {
    parent = parent.parentNode;
  }
  return parent;
};


/**
 * get the pages from the dom
 * @return {Array.<string>} an array of the page names I have found in the DOM
 */
silex.model.Page.prototype.getPages = function() {
  // retrieve all page names from the head section
  var pages = [];
  var elements = this.view.workspace.getWindow().document.body.querySelectorAll('a[data-silex-type="page"]');
  goog.array.forEach(elements, function(element) {
    pages.push(element.getAttribute('id'));
  }, this);
  return pages;
};


/**
 * get the currently opened page from the dom
 * @return {string} name of the page currently opened
 */
silex.model.Page.prototype.getCurrentPage = function() {
  var bodyElement = this.view.workspace.getWindow().document.body;
  var pageName = this.view.workspace.getWindow().jQuery(bodyElement).pageable('option', 'currentPage');
  return pageName;
};


/**
 * refresh the view
 */
silex.model.Page.prototype.refreshView = function() {
  var pages = this.getPages();
  var currentPage = this.getCurrentPage();
  this.view.pageTool.redraw(this.model.body.getSelection(), this.view.workspace.getWindow().document, pages, currentPage);
  this.view.propertyTool.redraw(this.model.body.getSelection(), this.view.workspace.getWindow().document, pages, currentPage);
  this.view.stage.redraw(this.model.body.getSelection(), this.view.workspace.getWindow().document, pages, currentPage);
};


/**
 * open the page
 * this is a static method, a helper
 * @param {string} pageName   name of the page to open
 */
silex.model.Page.prototype.setCurrentPage = function(pageName) {
  var bodyElement = this.view.workspace.getWindow().document.body;
  this.view.workspace.getWindow().jQuery(bodyElement).pageable({'currentPage': pageName});
  this.refreshView();
};


/**
 * get a page from the dom by its name
 * @param  {string} pageName  a page name
 * @return {string} the page corresponding to the given page name
 */
silex.model.Page.prototype.getDisplayName = function(pageName) {
  var displayName = '';
  var pageElement = this.view.workspace.getWindow().document.getElementById(pageName);
  if (pageElement) {
    displayName = pageElement.innerHTML;
  }
  return displayName;
};


/**
 * remove a page from the dom
 * elements which are only in this page should be deleted
 */
silex.model.Page.prototype.removePage = function(pageName) {
  var pages = this.getPages();
  var pageDisplayName = this.getDisplayName(pageName);
  if (pages.length < 2) {
    silex.utils.Notification.notifyError('I could not delete this page because <strong>it is the only page!</strong>');
  }
  else {
    // remove the DOM element
    var elements = this.view.workspace.getWindow().document.body.querySelectorAll('a[data-silex-type="page"]');
    goog.array.forEach(elements, function(element) {
      if (element.getAttribute('id') === pageName) {
        goog.dom.removeNode(element);
      }
    }, this);
    // remove the links to this page
    elements = this.view.workspace.getWindow().document.body.querySelectorAll('*[data-silex-href="#!' + pageName + '"]');
    goog.array.forEach(elements, function(element) {
      element.removeAttribute('data-silex-href');
    }, this);
    // check elements which were only visible on this page
    // and returns them in this case
    var elementsOnlyOnThisPage = [];
    elements = goog.dom.getElementsByClass(pageName, this.view.workspace.getWindow().document.body);
    goog.array.forEach(elements, function(element) {
      goog.dom.classlist.remove(element, pageName);
      var pagesOfElement = this.getPagesForElement(element);
      if (pagesOfElement.length <= 0) {
        elementsOnlyOnThisPage.push(element);
      }
    }, this);
    // update the page list
    pages = this.getPages();
    // open default/first page
    this.setCurrentPage(pages[0]);

    // handle elements which should be deleted
    if (elementsOnlyOnThisPage.length > 0) {
      silex.utils.Notification.confirm(
          elementsOnlyOnThisPage.length + ' elements were only visible on this page (' +
          pageDisplayName + '). <br /><ul><li>Do you want me to <strong>delete these elements?</strong><br /></li><li>or keep them and <strong>make them visible on all pages?</strong></li></ul>', goog.bind(function(accept) {
            goog.array.forEach(elementsOnlyOnThisPage, function(element) {
              if (accept) {
                // remove these elements
                this.model.element.removeElement(element);
              }
              else {
                // remove from this page
                this.model.page.removeFromAllPages(element);
              }
            }, this);
          }, this), 'delete', 'keep');
    }
  }

};


/**
 * add a page to the dom
 * @param {string} name
 * @param {string} displayName
 */
silex.model.Page.prototype.createPage = function(name, displayName) {
  var bodyElement = this.view.workspace.getWindow().document.body;
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', name);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = displayName;
  goog.dom.appendChild(bodyElement, aTag);
  // for coherence with other silex elements
  goog.dom.classlist.add(aTag, silex.model.Page.PAGE_CLASS_NAME);
  // select this page
  this.setCurrentPage(name);
};


/**
 * rename a page in the dom
 */
silex.model.Page.prototype.renamePage = function(oldName, newName, newDisplayName) {
  var bodyElement = this.view.workspace.getWindow().document.body;
  // update the DOM element
  var elements = this.view.workspace.getWindow().document.body.querySelectorAll('a[data-silex-type="page"]');
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('id') === oldName) {
      element.setAttribute('id', newName);
      element.innerHTML = newDisplayName;
    }
  }, this);
  // update the links to this page
  elements = this.view.workspace.getWindow().document.body.querySelectorAll('*[data-silex-href="#!' + oldName + '"]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('data-silex-href', '#!' + newName);
  }, this);
  // update the visibility of the compoents
  elements = goog.dom.getElementsByClass(oldName, this.view.workspace.getWindow().document.body);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.swap(element, oldName, newName);
  }, this);
  // wait until the dom reflects the changes
  setTimeout(goog.bind(function() {
    // select this page
    this.setCurrentPage(newName);
  }, this), 100);
};


/**
 * set/get a the visibility of an element in the given page
 */
silex.model.Page.prototype.addToPage = function(element, pageName) {
  goog.dom.classlist.add(element, pageName);
  goog.dom.classlist.add(element, silex.model.Page.PAGED_CLASS_NAME);
  this.refreshView();
};


/**
 * set/get a "silex style link" on an element
 */
silex.model.Page.prototype.removeFromPage = function(element, pageName) {
  goog.dom.classlist.remove(element, pageName);
  if (!this.getPagesForElement(element).length > 0) {
    goog.dom.classlist.remove(element, silex.model.Page.PAGED_CLASS_NAME);
  }
  this.refreshView();
};


/**
 * set/get a "silex style link" on an element
 */
silex.model.Page.prototype.removeFromAllPages = function(element) {
  var pages = this.getPagesForElement(element);
  goog.array.forEach(pages, function(pageName) {
    goog.dom.classlist.remove(element, pageName);
  }, this);
  // the element is not "paged" anymore
  goog.dom.classlist.remove(element, silex.model.Page.PAGED_CLASS_NAME);

  this.refreshView();
};


/**
 * set/get a "silex style link" on an element
 */
silex.model.Page.prototype.getPagesForElement = function(element) {
  var res = [];
  // get all the pages
  var pages = this.getPages();
  for (let idx in pages) {
    var pageName = pages[idx];
    // remove the component from the page
    if (goog.dom.classlist.contains(element, pageName)) {
      res.push(pageName);
    }
  }
  return res;
};


/**
 * check if an element is in the given page (current page by default)
 */
silex.model.Page.prototype.isInPage = function(element, opt_pageName) {
  var bodyElement = this.view.workspace.getWindow().document.body;
  if (!opt_pageName) {
    opt_pageName = this.getCurrentPage();
  }
  return goog.dom.classlist.contains(element, opt_pageName);
};
