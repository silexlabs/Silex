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
    $('[id="'+pageName+'"]').addClass('page-link-active');
    // prevent iframe content from staying in the dom
    // this prevent a youtube video to continue playing while on another page
    // this is useful in chrome and not firefox since display:none does not reset iframe dom in chrome
    $('[data-silex-iframe-src]').each(function() {
      this.setAttribute('src', this.getAttribute('data-silex-iframe-src'));
    });
    $('.paged-element-hidden iframe').each(function() {
      this.setAttribute('data-silex-iframe-src', this.getAttribute('src'));
      this.setAttribute('src', '');
    });
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
   * Silex links
   * Only when `body.silex-runtime` is defined, i.e. not while editing
   * Links are not clickable while editing
   */
  $('.silex-runtime [data-silex-href]').click(function () {
    var href = this.getAttribute('data-silex-href');
    if (href.indexOf('#') === 0){
      window.location.href = href;
    }
    else {
      window.open(href, '_blank');
    }
  });
  /**
   * mobile menu
   */
  $('.silex-pages').each(function() {
    $('.menu-button', this).click(function () {
      $(document.body).toggleClass('show-mobile-menu');
    });
  });
  $('.silex-runtime .silex-pages .page-element').click(function(e) {
    window.location.hash = '#!' + this.id;
    $(document.body).removeClass('show-mobile-menu');
    e.preventDefault();
  });

  /**
   * Returns a function, that, as long as it continues to be invoked, will not
   * be triggered. The function will be called after it stops being called for
   * N milliseconds. If `immediate` is passed, trigger the function on the
   * leading edge, instead of the trailing.
   */
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  /**
   * resize body to the size of its content
   * this is needed since the content has absolute position
   * so it is not automatic with css
   */
  var resizeBody = debounce(function (event){
    var width = 0;
    var height = 0;
    var bodyEl = $('body');
    $('body > *').each(function (index) {
      var el = $(this);
      // take elements visible on the current page
      if(el.hasClass('editable-style') && (!el.hasClass('paged-element') || el.hasClass(bodyEl.pageable('option').currentPage))) {
        var position = el.position();
        var right = position.left + el.width();
        var bottom = position.top + el.height();
        if (width < right) width = right;
        if (height < bottom) height = bottom;
      }
    });
    bodyEl.css({
      "min-width": width + "px",
      "min-height": height + "px"
    });
  }, 500);

  // resize body at start
  resizeBody();

  // resize body on window resize
  $(window).resize(resizeBody);

  // resize on page change (size will vary)
  $('body').on('pageChanged', resizeBody);
});
