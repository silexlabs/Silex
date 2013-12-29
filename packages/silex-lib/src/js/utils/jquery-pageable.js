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
 * @param {string} name
 * @param {string} displayName
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
        $(pageableRootElement).pageable({useDeeplink: false});
        $(pageableRootElement).addClass(silex.utils.JQueryPageable.PAGEABLE_ROOT_CLASS);
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
    pages.push({
      name: this.getAttribute('id')
      displayName: this.getAttribute('data-silex-name')
    });
  });
  return pages;
};


/**
 * get the currently opened page from the dom
 * @param {element} pageableRootElement the pageable root element
 * @return {silex.utils.Page} the currently opened page
 */
silex.utils.JQueryPageable.getCurrentPage = function(pageableRootElement) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var pageName = $(pageableRootElement).data('options').currentPage;
  return silex.utils.JQueryPageable.getPageByName(pageableRootElement, pageName);
};


/**
 * open the page
 * this is a static method, a helper
 * @param {silex.utils.JQueryPageable} page   the page to open
 */
silex.utils.JQueryPageable.setCurrentPage = function(pageableRootElement, page) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  $(pageableRootElement).pageable({currentPage: page.name});
};


/**
 * get a page from the dom by its name
 * @param  {string} pageName  a page name
 * @return {silex.utils.Page} the page corresponding to the given page name
 */
silex.utils.JQueryPageable.getPageByName = function(pageableRootElement, pageName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var page = null;
  $('a[data-silex-type="page"]', pageableRootElement).each(
    function() {
      if (this.getAttribute('id') === pageName) {
        page = {
          name: this.getAttribute('id')
          displayName: this.getAttribute('data-silex-name')
        };
        return;
      }
    }
  );
  return page;
}


/**
 * remove a page from the dom
 */
silex.utils.JQueryPageable.removePage = function(pageableRootElement, page) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // remove the DOM element
  $('a[data-silex-type="page"]', pageableRootElement).each(
      function() {
        if (this.getAttribute('id') === page.name) {
          $(this).remove();
        }
      });
  // remove the links to this page
  $('*[data-silex-href="#!' + page.name + '"]').each(
      function() {
        this.removeAttribute('data-silex-href');
      }
  );
  // check elements which were only visible on this page
  // and make them visible everywhere
  $('.' + page.name).each(
      function() {
        $(this).removeClass(page.name);

        var pagesOfElement = silex.utils.JQueryPageable.getPagesForElement(this);
        if (pagesOfElement.length <= 0)
          $(this).removeClass(silex.utils.JQueryPageable.PAGE_CLASS);
      }
  );
};


/**
 * add a page to the dom
 */
silex.utils.JQueryPageable.createPage = function(pageableRootElement, name, displayName) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', name);
  aTag.setAttribute('data-silex-name', displayName);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = displayName;
  goog.dom.appendChild(pageableRootElement, aTag);

  return {
    name: name,
    displayName: displayName
  };
};


/**
 * rename a page in the dom
 */
silex.utils.JQueryPageable.renamePage = function(pageableRootElement, page, name) {
  if(!silex.utils.JQueryPageable.getPageable(pageableRootElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var that = this;
  // update the DOM element
  $('a[data-silex-type="page"]', pageableRootElement).each(
      function() {
        if (this.getAttribute('id') === page.name) {
          this.setAttribute('id', name);
        }
      });
  // update the links to this page
  $('*[data-silex-href="#!' + page.name + '"]').each(
      function() {
        this.setAttribute('data-silex-href', '#!' + name);
      }
  );
  // update the visibility of the compoents
  $('.' + page.name).each(
      function() {
        $(this).removeClass(page.name);
        $(this).addClass(name);
      }
  );
};


/**
 * set/get a "silex style link" on an element
 */
silex.utils.JQueryPageable.setLink = function(element, page) {
  if (url){
    element.setAttribute(silex.utils.JQueryPageable.LINK_ATTR, '#!' + page.name);
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
  // remove the hash
  if (link.indexOf('#!') === 0){
    link = link.substring(2);
  }
  return link;
};


/**
 * set/get a the visibility of an element in the given page
 */
silex.utils.JQueryPageable.addToPage = function(element, page) {
  goog.dom.classes.add(element, page.name);
};

/**
 * set/get a "silex style link" on an element
 */
silex.utils.JQueryPageable.removeFromPage = function(element, page) {
  goog.dom.classes.remove(element, page.name);
};

