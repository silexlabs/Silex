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

  // store jquery references
  var $win = $(window);
  var $doc = $(document);
  var $body = $('body');
  var $html = $('html');
  var $preventScale = $('.prevent-scale');
  var $fixed = $('.fixed');
  var siteWidth = parseInt($('meta[name=website-width]').attr('content')) || null;
  var $fixedPositions = $([]);

  // flags
  // var blockedFlag = false;
  // var resizeNeededFlag = false;
  // var iAmScaling = false;

  // expose data to components
  window.silex = window.silex || {};
  window.silex.siteWidth = siteWidth;
  window.silex.resizeRatio = 1;

  // FIXME: why is it needed?
  window.silex.resizeBody = resizeBody;

  // this script is only for outside the editor
  if($body.hasClass('silex-runtime')) {

    if(!$body.hasClass('silex-published')) {
      initPages();
    }
    initFixedPositions();
    onScroll();
    resizeBody();
    $win.resize(onResize);
    $win.scroll(onScroll);
    if(!$body.hasClass('silex-published')) {
      $body.on('pageChanged', onResize);
    }
    function initFixedPositions() {
      console.log('getFixedPositions');
      $fixedPositions = $fixed.map(function(el) {
        var offset = $(this).offset();
        offset.top = $(this).attr('silex-fixed-style-top') || offset.top;
        offset.left = $(this).attr('silex-fixed-style-left') || offset.left;
        console.log(this, offset);
        return {
          offsetTop: offset.top,
          offsetLeft: offset.left,
          $el: $(this)
        };
      });
    }

    function onResize() {
      $body.css({
        'transform': '',
        'transform-origin': '',
        'min-width': '',
        'height': '',
      });
      $fixedPositions.each(function($obj) {
        var obj = $(this).get(0);
        obj.$el.css({
          'position': '',
          'top': '',
          'left': '',
        });
      });
      initFixedPositions();
      onScroll();
      resizeBody();
    }

    function resizeBody() {
      console.log('resizeBody');

      // if the site has a defined width and the window is smaller than this width, then
      // scale the website to fit the window
      // This happens also on mobile

      // notify the components that the resize will occure
      $doc.trigger('silex.preresize');

      // scale on mobile or on desktop only when needed
      var ratio = getScaleRatio();
      // expose the ratio to components
      window.silex.resizeRatio = ratio;
      if(ratio === 1) {
        // reset scale
        $body.css({
          'transform': '',
          'transform-origin': '',
          'min-width': '',
          'height': '',
        });
        // unscale some elements
        $preventScale.css({
          'transform': '',
          'transform-origin': '',
        })
        // add space around the elements in the body
        // I removed this because it bugs when there are elements with 100% width
        //width += 50;
        //height += 50;
        // check if a redraw is needed
      }
      else {
        // scale the body
        $body.css({
          'transform': 'scale(' + ratio + ')',
          'transform-origin': '0 0',
          'min-width': getScaleBreakPoint() + 'px',
          'height': $body.height() * ratio,
        });
        // unscale some elements
        $preventScale.css({
          'transform': 'scale(' + (1/ratio) + ')',
          'transform-origin': '0 0',
        })
        }
    }

    function onScroll() {
      console.log('onScroll', $fixedPositions);
      var ratio = getScaleRatio();
      if(ratio === 1) {
        // in this case, there is no transformation and we use the native fixed position
        console.log('no scale => use css position: fixed')
        $fixedPositions.each(function($obj) {
          var obj = $(this).get(0);
          obj.$el.css({
            'position': 'fixed',
            'top': `${ obj.offsetTop }px`,
            'left': `${ obj.offsetLeft }px`,
          });
        });
      }
      else {
        var delta = {
          top: $html.scrollTop() / ratio,
          left: $html.scrollLeft() / ratio,
        };
        $fixedPositions.each(function($obj) {
          var obj = $(this).get(0);
          obj.$el.css({
            'position': 'fixed',
            'top': `${ obj.offsetTop + delta.top }px`,
            'left': `${ obj.offsetLeft + delta.left }px`,
          });
        });
      }
    }

    // utility functions
    function getScaleRatio() {
      var winWidth = $win.width();
      if((siteWidth && winWidth < siteWidth) || winWidth < 480) {
        // scale the site
        var breakPoint = getScaleBreakPoint();
        return winWidth / breakPoint;
      }
      return 1;
    }
    function getScaleBreakPoint() {
      var winWidth = $win.width();
      return winWidth < 480 ? 480 : siteWidth;
    }

    function initPages() {
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
      $body.on('pageChanged', function (event, pageName) {
        console.log('pageChanged')
        // mark links to the current page as active
        $('[data-silex-href*="#!'+pageName+'"]').addClass('page-link-active');
        $('[id*="'+pageName+'"]').addClass('page-link-active');
        // prevent iframe content from staying in the dom
        // this prevent a youtube video to continue playing while on another page
        // this is useful in chrome and not firefox since display:none does not reset iframe dom in chrome
        $('[data-silex-iframe-src]').each(function() {
          this.setAttribute('src', this.getAttribute('data-silex-iframe-src'));
        });
        $('.paged-element-hidden iframe').each(function() {
          var src = this.getAttribute('src');
          if(src) {
            this.setAttribute('data-silex-iframe-src', src);
            this.setAttribute('src', '');
          }
        });
      });
      /**
       * init page system
       * Use deep links (hash) only when `body.silex-runtime` is defined, i.e. not while editing
       */
      $body.pageable({
        currentPage: firstPageName,
        useDeeplink: $body.hasClass('silex-runtime'),
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
    }
  }
});
