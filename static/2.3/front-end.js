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

$(function() {
  // allow HTML5 tags used by Silex to be styled with CSS (polyfill)
  document.createElement('HEADER');
  document.createElement('VIDEO');

  /**
   * list all pages from the head section
   * and open the 1st one by default
   */
  var firstPageName = null;
  var pages = $('a[data-silex-type="page"]');
  if (pages && pages.length>0){
    var firstPage = pages[0];
    firstPageName = firstPage.getAttribute('id');
  }
  /**
   * callback for change events
   * called when a page is opened
   */
  $('body').on('pageChanged', function (event, pageName) {
    // mark links to the current page as active
    $('[data-silex-href="#!'+pageName+'"]').addClass('page-link-active');
  });
  /**
   * init page system
   */
  $('body').pageable({
    currentPage: firstPageName,
    useDeeplink:true,
    pageClass: 'paged-element'
  });
  /**
   * silex links
   * only when the classname .silex-runtime is defined on the body (not while editing)
   */
  $('.silex-runtime [data-silex-href]').click(function () {
    var href = this.getAttribute('data-silex-href');
    if (href.indexOf('#!') === 0){
      window.location.href = href;
    }
    else{
      window.open(href, '_blank');
    }
  });
})
