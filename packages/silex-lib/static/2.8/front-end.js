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
  var $preventScale = $('.prevent-scale');
  var $fixed = $('.fixed');
  var siteWidth = parseInt($('meta[name=website-width]').attr('content')) || null;

  // flags
  var blockedFlag = false;
  var resizeNeededFlag = false;
  var iAmScaling = false;

  // expose data to components
  window.silex = window.silex || {};
  window.silex.siteWidth = siteWidth;
  window.silex.resizeRatio = 1;

  // FIXME: why is it needed?
  window.silex.resizeBody = function() {}

  // this script is only for outside the editor
  if($body.hasClass('silex-runtime')) {
    // store fixed positions

    // listens for events
    resizeNeededFlag = true;
    onScroll();
    $win.resize(onResize);
    $win.scroll(onScroll);

    // Event handlers
    function block() {
      if(blockedFlag) {
        console.log('blocked !!!')
        resizeNeededFlag = true;
        return true;
      }
      blockedFlag = true;
      return false;
    }
    function unblock() {
      blockedFlag = false;
      if(resizeNeededFlag) {
        console.log('resize needed !!!')
        onResize();
        resizeNeededFlag = false
        return true;
      }
      return false;
    }
    function onResize() {
      console.log('onResize');
      if(iAmScaling) {
        console.warn('iAmScaling !!!');
        return;
      }
      // wait if scale or scroll is pending
      if(block()) {
        console.warn('scaling or scrolling is pending, can not scale now, will do later!!!');
        return;
      }
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
        setScale($body, {}, function() {
          // add space around the elements in the body
          // I removed this because it bugs when there are elements with 100% width
          //width += 50;
          //height += 50;
          // check if a redraw is needed
          if(!unblock()) {
            console.log('no scaling');
            // notify the components that the resize is done
            $doc.trigger('silex.resize');
          }
          });
      }
      else {
        // scale the body
        setScale($body, {
          'transform': 'scale(' + ratio + ')',
          'transform-origin': '0 0',
          'min-width': getScaleBreakPoint() + 'px',
          'height': $body.height() * ratio,
        }, function() {
          // unscale some elements
          // $preventScale.css({
          //   'transform': 'scale(' + (1/ratio) + ')',
          //   'transform-origin': '0 0',
          // })

          // keep the scroll position when resizing,
          // fixes a bug on mobile when reaching the bottom of page and the broser UI comes back and changes the viewport size
          // var scrollTarget = scrollRatio * $body.prop("scrollHeight");
          // $body.scrollTop(scrollTarget);

          // check if a redraw is needed
          if(!unblock()) {
            console.log('scaling is done');
            // notify the components that the resize is done
            $doc.trigger('silex.resize');
          }
        });
      }
    }

    function onScroll() {
      console.log('onScroll');
      if(iAmScaling) {
        console.warn('iAmScaling !!!');
        return;
      }
      if(block()) {
        console.warn('scaling is pending, can not scroll!!!');
        return;
      };

      var ratio = getScaleRatio();
      if(ratio === 1) {
        console.log('no scale => use css position: fixed')
        setPosition($fixed, {}, function() {
          applyOffset($fixed, {}, function() {
            if(!unblock()) {
              console.log('scrolling is done');
            }
          });
        });
      }
      else {
        // reset positions
        setPosition($fixed, {}, function() {
          // reset scale
          setScale($body, {}, function(oldCss) {
            $fixed.each(function() {
              applyOffset($(this), {
                top: $('html').scrollTop() / ratio,
                left: $('html').scrollLeft() / ratio,
              });
            });
            setScale($body, oldCss, function() {
              if(!unblock()) {
                console.log('scrolling is done');
              }
            });
          });
        });
      }
    }

    function applyOffset($el, opt_delta, opt_cbk) {
      var delta = opt_delta || {};
      var offset = $el.offset();
      offset.top = $el.attr('silex-fixed-style-top') || offset.top;
      offset.left = $el.attr('silex-fixed-style-left') || offset.left;
      // $el.attr('silex-fixed-style-top', offset.top);
      // $el.attr('silex-fixed-style-left', offset.left);
      // set positions
      setPosition($el, {
        'position': 'fixed',
        'top': `${ offset.top + (delta.top || 0) }px`,
        'left': `${ offset.left + (delta.left || 0) }px`,
      }, opt_cbk);
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
    // generic set attributes with defaults
    // wait for the dom to render
    function setAttr(attrs, $el, opt_cssObj, opt_cbk) {
      var cssObj = opt_cssObj || {};
      var oldCss = $el.css(attrs);
      var newCss = {};
      // this is a reduce but works in old browsers
      for(var name in attrs) {
        if(cssObj[attrs[name]] === 'keep') {
          newCss[attrs[name]] = oldCss[attrs[name]];
        }
        else {
          newCss[attrs[name]] = cssObj[attrs[name]] || '';
        }
      };
      iAmScaling = true;
      $el.css(newCss);
      if(opt_cbk) {
        setTimeout(function() {
          iAmScaling = false;
          opt_cbk(oldCss)
        }, 0);
      }
    }
    // scale mode
    function setScale($el, opt_cssObj, opt_cbk) {
      console.log('setScale', opt_cssObj, iAmScaling);
      setAttr([
        'transform',
        'transform-origin',
        'min-width',
        'height',
      ], $el, opt_cssObj, function(oldCss) {
        if(opt_cbk) opt_cbk(oldCss);
      })
    }
    // positions
    function setPosition($el, opt_cssObj, opt_cbk) {
      console.log('setPosition', opt_cssObj);
      // opt_cssObj.position = 'fixed'
      setAttr([
        'position',
        'top',
        'left',
      ], $el, opt_cssObj, opt_cbk)
    }
    if(!$body.hasClass('silex-published')) {
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
        // resize on page change (size will vary)
        resizeNeededFlag = true;
        onScroll();
        // onResize();
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
