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
 * @fileoverview Helper class for common tasks of the pageable jquery plugin
 *
 */


goog.provide('silex.utils.PageablePlugin');


/**
 * @constructor
 * @struct
 */
silex.utils.PageablePlugin = function() {
  throw('this is a static class and it canot be instanciated');
}


/**
 * reference to the stage / body of the edited website
 * @type element
 */
silex.utils.PageablePlugin.bodyElement;


/**
 * get/set the stage
 */
silex.utils.PageablePlugin.getBodyElement = function() {
  return silex.utils.PageablePlugin.bodyElement;
}


/**
 * get/set the stage
 */
silex.utils.PageablePlugin.setBodyElement = function(bodyElement) {
  silex.utils.PageablePlugin.bodyElement = bodyElement;
}


/**
 * constant for the attribute name of the links
 * @const
 * @type {string}
 */
silex.utils.PageablePlugin.LINK_ATTR = 'data-silex-href';


/**
 * constant for the class name
 * @const
 * @type {string}
 */
silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME = 'pageable-root-class';


/**
 * constant for the class name of the pages
 * @const
 * @type {string}
 */
silex.utils.PageablePlugin.PAGE_CLASS_NAME = 'page-element';


/**
 * constant for the class name of elements visible only on some pages
 * @const
 * @type {string}
 */
silex.utils.PageablePlugin.PAGED_CLASS_NAME = 'paged-element';


/**
 * constant for the class name of elements when it is in a visible page
 * this css class is set in pageable.js
 * @const
 * @type {string}
 */
silex.utils.PageablePlugin.PAGED_VISIBLE_CLASS_NAME = 'paged-element-visible';


/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.utils.PageablePlugin.PAGED_CLASS_NAME
 */
silex.utils.PageablePlugin.getParentPage = function(element) {
  var parent = element.parentNode;
  while (parent && !goog.dom.classes.has(parent, silex.utils.PageablePlugin.PAGED_CLASS_NAME)) {
    parent = parent.parentNode;
  }
  return parent;
};


/**
 * retrieve the first parent which is visible only on some pages
 * @return true if the {element} bodyElement has the css class silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME
 */
silex.utils.PageablePlugin.getPageable = function(bodyElement) {
  return bodyElement && $(bodyElement).hasClass(silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME);
};


/**
 * retrieve the first parent which is visible only on some pages
 * @param {element} bodyElement which has the css class silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME
 */
silex.utils.PageablePlugin.setPageable = function(bodyElement, isPageable) {
    if (isPageable){
      // add the class, to validate this is a root pageable element in other methods
      $(bodyElement).addClass(silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME);
      // find default first page
      var pages = silex.utils.PageablePlugin.getPages();
      // enable jquery plugin
      $(bodyElement).pageable(
        {
          currentPage: pages[0],
          useDeeplink: false
        });
    }
    else{
        $(bodyElement).pageable('destroy');
        $(bodyElement).removeClass(silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME);
    }
};


/**
 * get the pages from the dom
 * @return {array} an array of the page names I have found in the DOM
 */
silex.utils.PageablePlugin.getPages = function() {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // retrieve all page names from the head section
  var pages = [];
  $('a[data-silex-type="page"]', silex.utils.PageablePlugin.bodyElement).each(function() {
    pages.push(this.getAttribute('id'));
  });
  return pages;
};


/**
 * get the currently opened page from the dom
 * @return {string} name of the page currently opened
 */
silex.utils.PageablePlugin.getCurrentPageName = function() {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var pageName = $(silex.utils.PageablePlugin.bodyElement).pageable('option', 'currentPage');
  return pageName;
};


/**
 * open the page
 * this is a static method, a helper
 * @param {string} pageName   name of the page to open
 */
silex.utils.PageablePlugin.setCurrentPage = function(pageName) {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  $(silex.utils.PageablePlugin.bodyElement).pageable({currentPage: pageName});
};


/**
 * get a page from the dom by its name
 * @param  {string} pageName  a page name
 * @return {silex.utils.Page} the page corresponding to the given page name
 */
silex.utils.PageablePlugin.getDisplayName = function(pageName) {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var displayName = '';
  $('a[data-silex-type="page"]', silex.utils.PageablePlugin.bodyElement).each(
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
silex.utils.PageablePlugin.removePage = function(pageName) {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // remove the DOM element
  $('a[data-silex-type="page"]', silex.utils.PageablePlugin.bodyElement).each(
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

        var pagesOfElement = silex.utils.PageablePlugin.getPagesForElement(this);

        if (pagesOfElement.length <= 0)
          $(this).removeClass(silex.utils.PageablePlugin.PAGED_CLASS_NAME);
      }
  );
};


/**
 * add a page to the dom
 * @param {string} name
 * @param {string} displayName
 */
silex.utils.PageablePlugin.createPage = function(name, displayName) {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', name);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = displayName;
  goog.dom.appendChild(silex.utils.PageablePlugin.bodyElement, aTag);
  // for coherence with other silex elements
  goog.dom.classes.add(aTag, silex.utils.PageablePlugin.PAGE_CLASS_NAME);
};


/**
 * rename a page in the dom
 */
silex.utils.PageablePlugin.renamePage = function(oldName, newName, newDisplayName) {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var that = this;
  // update the DOM element
  $('a[data-silex-type="page"]', silex.utils.PageablePlugin.bodyElement).each(
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
silex.utils.PageablePlugin.setLink = function(element, link) {
  if (link){
    element.setAttribute(silex.utils.PageablePlugin.LINK_ATTR, link);
  }
  else{
    element.removeAttribute(silex.utils.PageablePlugin.LINK_ATTR);
  }
};

/**
 * set/get a "silex style link" on an element
 */
silex.utils.PageablePlugin.getLink = function(element) {
  var link = element.getAttribute('data-silex-href');
  return link;
};


/**
 * set/get a the visibility of an element in the given page
 */
silex.utils.PageablePlugin.addToPage = function(element, pageName) {
  goog.dom.classes.add(element, pageName);
  goog.dom.classes.add(element, silex.utils.PageablePlugin.PAGED_CLASS_NAME);
};

/**
 * set/get a "silex style link" on an element
 */
silex.utils.PageablePlugin.removeFromPage = function(element, pageName) {
  goog.dom.classes.remove(element, pageName);
  if (!silex.utils.PageablePlugin.getPagesForElement(element).length>0){
    goog.dom.classes.remove(element, silex.utils.PageablePlugin.PAGED_CLASS_NAME);
  }
};


/**
 * set/get a "silex style link" on an element
 */
silex.utils.PageablePlugin.getPagesForElement = function(element) {
  if(!silex.utils.PageablePlugin.getPageable(silex.utils.PageablePlugin.bodyElement)){
    throw new Error('Operation failed, root pageable element is required.');
  }
  var res = [];
  // get all the pages
  var pages = silex.utils.PageablePlugin.getPages();
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
silex.utils.PageablePlugin.isInPage = function(element, opt_pageName) {
  if (!opt_pageName){
    opt_pageName = silex.utils.PageablePlugin.getCurrentPageName();
  }
  return goog.dom.classes.has(element, opt_pageName);
}
