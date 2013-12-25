
page = {
  name
  displayName
}

/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.model.JQueryPageable.PAGE_CLASS
 */
silex.model.JQueryPageable.getFirstPageableParent = function(element) {
  var parent = element.parentNode;
  while (parent && !goog.dom.classes.has(parent, silex.model.JQueryPageable.PAGE_CLASS)) {
    parent = parent.parentNode;
  }
  return parent;
};

/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.model.JQueryPageable.PAGE_CLASS
 */
silex.model.JQueryPageable.setPageable = function(element, isPageable) {
    if (isPageable){
        $(element).pageable({useDeeplink: false});
    }
    else{
        $(element).pageable('destroy');
    }
};



/**
 * get the pages from the dom
 * @see silex.model.JQueryPageable
 * @return {array} an array of the page names I have found in the DOM
 */
silex.view.JQueryPageable.getPages = function() {
  // retrieve all page names from the head section
  var pages = [];
  $('a[data-silex-type="page"]', this.bodyElement).each(function() {
    pages.push({
      name: this.getAttribute('id')
      displayName: this.getAttribute('data-silex-name')
    });
  });
  return pages;
};


/**
 * remove a page from the dom
 * @see silex.model.JQueryPageable
 */
silex.view.JQueryPageable.removePage = function(page) {
  // remove the DOM element
  $('a[data-silex-type="page"]', this.bodyElement).each(
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

        var pagesOfElement = silex.model.JQueryPageable.getPagesForElement(this);
        if (pagesOfElement.length <= 0)
          $(this).removeClass(silex.model.JQueryPageable.PAGE_CLASS);
      }
  );
};


/**
 * add a page from the dom
 * @see silex.model.JQueryPageable
 */
silex.view.JQueryPageable.addPage = function(page) {
  // create the DOM element
  var aTag = goog.dom.createElement('a');
  aTag.setAttribute('id', page.name);
  aTag.setAttribute('data-silex-type', 'page');
  aTag.innerHTML = page.name;
  goog.dom.appendChild(this.bodyElement, aTag);
};


/**
 * rename a page in the dom
 * @see silex.model.JQueryPageable
 */
silex.view.JQueryPageable.renamePage = function(page, name) {
  var that = this;
  // update the DOM element
  $('a[data-silex-type="page"]', this.bodyElement).each(
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
 * open the page
 * this is a static method, a helper
 * @param {silex.model.JQueryPageable} page   the page to open
 */
silex.view.JQueryPageable.openPage = function(page) {
  $(this.bodyElement).pageable({currentPage: page.name});
};


/**
 * set/get a "silex style link" on an element
 */
silex.view.JQueryPageable.setLink = function(element, pageName) {
  element.setAttribute('data-silex-href', '#!' + pageName);
};

/**
 * set/get a "silex style link" on an element
 */
silex.view.JQueryPageable.getLink = function(element) {
  var link = element.getAttribute('data-silex-href');
  // remove the hash
  if (link.indexOf('#!') === 0){
    link = link.substring(2);
  }
  return link;
};

