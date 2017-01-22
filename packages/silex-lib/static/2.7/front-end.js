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

  // store the body selector
  // be careful since it will change after undo/redo or open file in Silex editor
  var bodyEl = $('body');

   /**
   * returns a function that will not be called more than every `wait` seconds
   */
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        clearTimeout(timeout);
        timeout = null;
        func.apply(context, args);
      };
      if(!timeout) timeout = setTimeout(later, wait);
    };
  };

  /**
   * compute the desired size of the body
   * this will allways be as big as the viewport
   * and the bounding box (0,0) (width, height) contains all the elements in the body
   * even if the elements are absolute positioned
   * @return {width, height}
   */
  function getBodySize() {
    var width = 0;
    var height = 0;
    $('body > *').each(function (index) {
      var el = $(this);
      // take elements visible on the current page
      if(el.hasClass('editable-style') &&
        (!el.hasClass('paged-element') || el.hasClass($('body').pageable('option').currentPage)) &&
        (!el.hasClass('hide-on-mobile') || win.width() >= 480)
      ) {
        var position = el.position();
        var right = position.left + el.width();
        var bottom = position.top + el.height();
        if (width < right) width = right;
        if (height < bottom) height = bottom;
      }
    });
    return {
      'width': width,
      'height': height
    };
  }

  var initialViewportContent = $('meta[data-silex-viewport]').attr('content');
  var win = $(window);
  /**
   * resize body to the size of its content
   * this is needed since the content has absolute position
   * so it is not automatic with css
   */
  var resizeBody = debounce(function (event){
    var bodyEl = $('body');
    // start computation, put the body to a 0x0 size
    // to avoid 100% elements to mess with the size computation
    bodyEl.addClass('compute-body-size-pending');
    // get the size of the elements in the body
    var boundingBox = getBodySize();
    var width = boundingBox.width;
    var height = boundingBox.height;
    // behavior which is not the same in Silex editor and outside the editor
    if(bodyEl.hasClass('silex-runtime')) {
      var winWidth = win.width();
      // handle the scroll bar manually
      // prevent the scroll bar to appear when we are only a few pixels short
      // this allows us to set width to 100% instead of 99%
      // this will only take place on mobile with winWidth < 480 (not needed on desktop apparently)
      if(width < winWidth + 10 && winWidth < 480)
        bodyEl.css('overflow-x', 'hidden');
      else
        bodyEl.css('overflow-x', 'auto');
    }
    else {
      // add space around the elements in the body
      // I removed this because it bugs when there are elements with 100% width
      //width += 50;
      //height += 50;
    }
    // set the body size to contain all the elements
    // this has to be done manually since the elements are absolutely positioned
    bodyEl.css({
      'min-width': width + 'px',
      'min-height': height + 'px'
    });
    // end computation, put back the body to a normal size
    bodyEl.removeClass('compute-body-size-pending');
  }, 500);

  // only outside silex editor when the window is small enough
  // change viewport to enable mobile view scale mode
  // for "pixel perfect" mobile version
  // bellow 960, the window width will be seen as 480
  if(bodyEl.hasClass('silex-runtime')) {
    var winWidth = win.width();
    if(winWidth < 960) {
      $('meta[data-silex-viewport]').attr('content', 'width=479, user-scalable=no, maximum-scale=5');
    }
  }

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
  bodyEl.on('pageChanged', function (event, pageName) {
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
    // resize on page change (size will vary)
    resizeBody();
  });
  /**
   * init page system
   */
  bodyEl.pageable({
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
  $('.silex-runtime .silex-pages .menu-button').click(function () {
    $(document.body).toggleClass('show-mobile-menu');
  });
  $('.silex-runtime .silex-pages .page-element').click(function(e) {
    window.location.hash = '#!' + this.id;
    $(document.body).removeClass('show-mobile-menu');
    e.preventDefault();
  });

  // resize body at start
  resizeBody();

  // resize body on window resize
  win.resize(resizeBody);

  // expose for use by the widgets and Silex editor
  window.resizeBody = resizeBody;
});
