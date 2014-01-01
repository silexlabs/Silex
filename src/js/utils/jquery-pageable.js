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
 * @fileoverview Helper class for common tasks
 *
 */


goog.provide('silex.utils.JQueryPageable');

/**
 * @constructor
 * @struct
 */
silex.utils.JQueryPageable = function() {
  throw('this is a static class and it canot be instanciated');
}


/**
 * constant for the attribute name of the links
 * @const
 * @type {string}
 */
silex.utils.JQueryPageable.LINK_ATTR = 'data-silex-href';


/**
 * constant for the class name
 * @const
 * @type {string}
 */
silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS = 'pageable-root-class';


/**
 * constant for the class name
 * @const
 * @type {string}
 */
silex.utils.JQueryPageable.PAGE_CLASS = 'silex-page';


/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.utils.JQueryPageable.PAGE_CLASS
 */
silex.utils.JQueryPageable.getParentPage = function(element) {
  var parent = element.parentNode;
  while (parent && !goog.dom.classes.has(parent, silex.utils.JQueryPageable.PAGE_CLASS)) {
    parent = parent.parentNode;
  }
  return parent;
};


/**
 * retrieve the first parent which is visible only on some pages
 * @return true if the pageableRootElement has the css class silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS
 */
silex.utils.JQueryPageable.getPageable = function(pageableRootElement) {
  return pageableRootElement && $(pageableRootElement).hasClass(silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS);
};


/**
 * retrieve the first parent which is visible only on some pages
 * @param {element} pageableRootElement which has the css class silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS
 */
silex.utils.JQueryPageable.setPageable = function(pageableRootElement, isPageable) {
    if (isPageable){
      // add the class, to validate this is a root pageable element in other methods
      $(pageableRootElement).addClass(silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS);
      // find default first page
      var pages = silex.utils.JQueryPageable.getPages(pageableRootElement);
      // enable jquery plugin
      $(pageableRootElement).pageable(
        {
          currentPage: pages[0],
          useDeeplink: false
        });
    }
    else{
        $(pageableRootElement).pageable('destroy');
        $(pageableRootElement).removeClass(silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS);
    }
};


/**
 * get the pages from the dom
 * @param {element} pageableRootElement the pageable root element
 * @return {array} an array of the page names I have found in the DOM
 */
silex.utils.JQueryPageable.getPages = function(pageableRootElement) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // retrieve all page names from the head section
  var pages = [];
  $('a[data-silex-type="page"]', pageableRootElement).each(function() {
    pages.push(this.getAttribute('id'));
  });
  return pages;
};


/**
 * get the currently opened page from the dom
 * @param {element} pageableRootElement the pageable root element
 * @return {string} name of the page currently opened
 */
silex.utils.JQueryPageable.getCurrentPageName = function(pageableRootElement) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var pageName = $(pageableRootElement).pageable('option', 'currentPage');
  return pageName;
};


/**
 * open the page
 * this is a static method, a helper
 * @param {string} pageName   name of the page to open
 */
silex.utils.JQueryPageable.setCurrentPage = function(pageableRootElement, pageName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  $(pageableRootElement).pageable({currentPage: pageName});
};


/**
 * get a page from the dom by its name
 * @param  {string} pageName  a page name
 * @return {silex.utils.Page} the page corresponding to the given page name
 */
silex.utils.JQueryPageable.getDisplayName = function(pageableRootElement, pageName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var displayName = '';
  $('a[data-silex-type="page"]', pageableRootElement).each(
    function() {
      if (this.getAttribute('id') === pageName) {
        displayName = this.innerHTML;
        return;
      }
    }
  );
  return displayName;
}


/**
 * remove a page from the dom
 */
silex.utils.JQueryPageable.removePage = function(pageableRootElement, pageName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // remove the DOM element
  $('a[data-silex-type="page"]', pageableRootElement).each(
      function() {
        if (this.getAttribute('id') === pageName) {
          $(this).remove();
        }
      });
  // remove the links to this page
  $('*[data-silex-href="#!' + pageName + '"]').each(
      function() {
        this.removeAttribute('data-silex-href');
      }
  );
  // check elements which were only visible on this page
  // and make them visible everywhere
  $('.' + pageName).each(
      function() {
        $(this).removeClass(pageName);

        var pagesOfElement = silex.utils.JQueryPageable.getPagesForElement(pageableRootElement, this);

        if (pagesOfElement.length <= 0)
          $(this).removeClass(silex.utils.JQueryPageable.PAGE_CLASS);
      }
  );
};


/**
 * add a page to the dom
 * @param {string} name
 * @param {string} displayName
 */
silex.utils.JQueryPageable.createPage = function(pageableRootElement, name, displayName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', name);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = displayName;
  goog.dom.appendChild(pageableRootElement, aTag);
};


/**
 * rename a page in the dom
 */
silex.utils.JQueryPageable.renamePage = function(pageableRootElement, oldName, newName, newDisplayName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var that = this;
  // update the DOM element
  $('a[data-silex-type="page"]', pageableRootElement).each(
      function() {
        if (this.getAttribute('id') === oldName) {
          this.setAttribute('id', newName);
          this.innerHTML = newDisplayName;
        }
      });
  // update the links to this page
  $('*[data-silex-href="#!' + oldName + '"]').each(
      function() {
        this.setAttribute('data-silex-href', '#!' + newName);
      }
  );
  // update the visibility of the compoents
  $('.' + oldName).each(
      function() {
        $(this).removeClass(oldName);
        $(this).addClass(newName);
      }
  );
};


/**
 * set/get a "silex style link" on an element
 * @param  {string} link  a link (absolute or relative)
 *         or an internal link (beginning with #!)
 *         or null to remove the link
 */
silex.utils.JQueryPageable.setLink = function(element, link) {
  if (link){
    element.setAttribute(silex.utils.JQueryPageable.LINK_ATTR, link);
  }
  else{
    element.removeAttribute(silex.utils.JQueryPageable.LINK_ATTR);
  }
};

/**
 * set/get a "silex style link" on an element
 */
silex.utils.JQueryPageable.getLink = function(element) {
  var link = element.getAttribute('data-silex-href');
  return link;
};


/**
 * set/get a the visibility of an element in the given page
 */
silex.utils.JQueryPageable.addToPage = function(pageableRootElement, element, pageName) {
  goog.dom.classes.add(element, pageName);
  goog.dom.classes.add(element, silex.utils.JQueryPageable.PAGE_CLASS);
};

/**
 * set/get a "silex style link" on an element
 */
silex.utils.JQueryPageable.removeFromPage = function(pageableRootElement, element, pageName) {
  goog.dom.classes.remove(element, pageName);
  if (!silex.utils.JQueryPageable.getPagesForElement(pageableRootElement, element).length>0){
    goog.dom.classes.remove(element, silex.utils.JQueryPageable.PAGE_CLASS);
  }
};


/**
 * set/get a "silex style link" on an element
 */
silex.utils.JQueryPageable.getPagesForElement = function(pageableRootElement, element) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var res = [];
  // get all the pages
  var pages = silex.utils.JQueryPageable.getPages(pageableRootElement);
  for (idx in pages) {
    var pageName = pages[idx];
    // remove the component from the page
    if (goog.dom.classes.has(element, pageName)){
      res.push(pageName);
    }
  }
  return res;
};

/**
 * check if an element is in the given page (current page by default)
 */
silex.utils.JQueryPageable.isInPage = function(pageableRootElement, element, opt_pageName) {
  if (!opt_pageName){
    opt_pageName = silex.utils.JQueryPageable.getCurrentPageName(pageableRootElement);
  }
  return goog.dom.classes.has(element, opt_pageName);
}
