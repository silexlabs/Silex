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
  this.name = '';
  /**
   * @type {string}
   */
  this.displayName = '';
  /**
   * @type {string}
   */
  this.linkName = '';
  /**
   * @type {number}
   */
  this.idx = -1;
};



/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Page = function(model, view) {
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
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
 * constant for the class name of element containing the pages
 * @const
 * @type {string}
 */
silex.model.Page.PAGES_CONTAINER_CLASS_NAME = 'silex-pages';


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
 * @param {Element} element
 * @return {Element} null or the element or one of its parents which has the css class silex.model.Page.PAGED_CLASS_NAME
 */
silex.model.Page.prototype.getParentPage = function(element) {
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  var parent = element.parentNode;
  while (parent && !goog.dom.classlist.contains(/** @type {?Element} */ (parent), silex.model.Page.PAGED_CLASS_NAME)) {
    parent = parent.parentNode;
  }
  return /** @type {?Element} */ (parent);
};


/**
 * get the pages from the dom
 * @return {Array.<string>} an array of the page names I have found in the DOM
 */
silex.model.Page.prototype.getPages = function() {
  // retrieve all page names from the head section
  var pages = [];
  var elements = this.model.body.getBodyElement().querySelectorAll('a[data-silex-type="page"]');
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
  if (goog.isNull(this.model.file.getContentWindow().jQuery)) {
    throw (new Error('JQuery not loaded in the opened website'));
  }
  var bodyElement = this.model.body.getBodyElement();
  var pageName = null;
  try {
    if (this.model.file.getContentWindow().jQuery(bodyElement).pageable) {
      pageName = this.model.file.getContentWindow().jQuery(bodyElement).pageable('option', 'currentPage');
    }
  }
  catch (e) {
    // there was a problem in the pageable plugin, return the first page
    console.error('error, could not retrieve the current page, I will return the first page', e, this.getPages());
    pageName = this.getPages()[0];
  }
  return pageName;
};


/**
 * refresh the view
 */
silex.model.Page.prototype.refreshView = function() {
  var pages = this.getPages();
  var currentPage = this.getCurrentPage();
  this.view.contextMenu.redraw(this.model.body.getSelection(), pages, currentPage);
  this.view.pageTool.redraw(this.model.body.getSelection(), pages, currentPage);
  this.view.propertyTool.redraw(this.model.body.getSelection(), pages, currentPage);
  this.view.stage.redraw(this.model.body.getSelection(), pages, currentPage);
};


/**
 * open the page
 * this is a static method, a helper
 * @param {string} pageName   name of the page to open
 */
silex.model.Page.prototype.setCurrentPage = function(pageName) {
  var bodyElement = this.model.body.getBodyElement();
  if (this.model.file.getContentWindow().jQuery(bodyElement).pageable) {
    this.model.file.getContentWindow().jQuery(bodyElement).pageable({'currentPage': pageName});
  }
  this.refreshView();
};


/**
 * get a page from the dom by its name
 * @param  {string} pageName  a page name
 * @return {string} the page corresponding to the given page name
 */
silex.model.Page.prototype.getDisplayName = function(pageName) {
  var displayName = '';
  var pageElement = this.model.file.getContentDocument().getElementById(pageName);
  if (pageElement) {
    displayName = pageElement.innerHTML;
  }
  return displayName;
};


/**
 * remove a page from the dom
 * elements which are only in this page should be deleted
 * @param {string} pageName
 */
silex.model.Page.prototype.removePage = function(pageName) {
  var pages = this.getPages();
  var pageDisplayName = this.getDisplayName(pageName);
  if (pages.length < 2) {
    silex.utils.Notification.notifyError('I could not delete this page because <strong>it is the only page!</strong>');
  }
  else {
    // remove the DOM element
    var elements = this.model.body.getBodyElement().querySelectorAll('a[data-silex-type="page"]');
    goog.array.forEach(elements, function(element) {
      if (element.getAttribute('id') === pageName) {
        goog.dom.removeNode(element);
      }
    }, this);
    // remove the links to this page
    elements = this.model.body.getBodyElement().querySelectorAll('*[data-silex-href="#!' + pageName + '"]');
    goog.array.forEach(elements, function(element) {
      element.removeAttribute('data-silex-href');
    }, this);
    // check elements which were only visible on this page
    // and returns them in this case
    var elementsOnlyOnThisPage = [];
    elements = goog.dom.getElementsByClass(pageName, this.model.body.getBodyElement());
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
        elementsOnlyOnThisPage.length +
        ' elements were only visible on this page (' +
        pageDisplayName +
        '). <br /><ul><li>Do you want me to <strong>delete these elements?</strong><br /></li><li>or keep them and <strong>make them visible on all pages?</strong></li></ul>',
        goog.bind(function(accept) {
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
 * move a page in the dom
 * @param {string} pageName
 * @param {string} direction up or down
 */
silex.model.Page.prototype.movePage = function(pageName, direction) {
  if(direction !== 'up' && direction !== 'down') throw 'wrong direction ' + direction + ', can not move page';
  const elements = this.model.body.getBodyElement().querySelectorAll('a[data-silex-type="page"]');
  let prevEl = null;
  for(let idx=0; idx<elements.length; idx++) {
    const el = elements[idx];
    if(prevEl &&
      ((el.id === pageName && direction === 'up') ||
      (prevEl.id === pageName && direction === 'down'))) {
      el.parentNode.insertBefore(el, prevEl);
      var pages = this.getPages();
      var currentPage = this.getCurrentPage();
      this.view.pageTool.redraw(this.model.body.getSelection(), pages, currentPage);
      return;
    }
    prevEl = el;
  };
  console.error('page could not be moved', pageName, direction, prevEl);
};


/**
 * add a page to the dom
 * @param {string} name
 * @param {string} displayName
 */
silex.model.Page.prototype.createPage = function(name, displayName) {
  var container = this.model.body.getBodyElement().querySelector('.' + silex.model.Page.PAGES_CONTAINER_CLASS_NAME);
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', name);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = displayName;
  goog.dom.appendChild(container, aTag);
  // for coherence with other silex elements
  goog.dom.classlist.add(aTag, silex.model.Page.PAGE_CLASS_NAME);
  // select this page
  this.setCurrentPage(name);
};


/**
 * rename a page in the dom
 * @param  {string} oldName
 * @param  {string} newName
 * @param  {string} newDisplayName
 */
silex.model.Page.prototype.renamePage = function(oldName, newName, newDisplayName) {
  var bodyElement = this.model.body.getBodyElement();
  // update the DOM element
  var elements = bodyElement.querySelectorAll('a[data-silex-type="page"]');
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('id') === oldName) {
      element.setAttribute('id', newName);
      element.innerHTML = newDisplayName;
    }
  }, this);
  // update the links to this page
  elements = bodyElement.querySelectorAll('*[data-silex-href="#!' + oldName + '"]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('data-silex-href', '#!' + newName);
  }, this);
  // update the visibility of the compoents
  elements = goog.dom.getElementsByClass(oldName, bodyElement);
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
 * remove from all pages if visible in all pages
 * @param {Element} element
 * @param {string} pageName
 */
silex.model.Page.prototype.addToPage = function(element, pageName) {
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  const pages = this.getPagesForElement(element);
  if (pages.length + 1 === this.getPages().length) {
    pages.forEach(page => element.classList.remove(page));
    goog.dom.classlist.remove(element, silex.model.Page.PAGED_CLASS_NAME);
  }
  else {
    goog.dom.classlist.add(element, pageName);
    goog.dom.classlist.add(element, silex.model.Page.PAGED_CLASS_NAME);
  }
  this.refreshView();
};


/**
 * set/get a "silex style link" on an element
 * @param {Element} element
 * @param {string} pageName
 */
silex.model.Page.prototype.removeFromPage = function(element, pageName) {
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  goog.dom.classlist.remove(element, pageName);
  if (this.getPagesForElement(element).length <= 0) {
    goog.dom.classlist.remove(element, silex.model.Page.PAGED_CLASS_NAME);
  }
  this.refreshView();
};


/**
 * set/get a "silex style link" on an element
 * @param {Element} element
 */
silex.model.Page.prototype.removeFromAllPages = function(element) {
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
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
 * @param {Element} element
 * @return {Array.<string>}
 */
silex.model.Page.prototype.getPagesForElement = function(element) {
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
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
 * @param {Element} element
 * @param {?string=} opt_pageName
 * @return {boolean}
 */
silex.model.Page.prototype.isInPage = function(element, opt_pageName) {
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  if (!opt_pageName) {
    opt_pageName = this.getCurrentPage();
  }
  return goog.dom.classlist.contains(element, opt_pageName);
};

