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
 * @fileoverview add polyfills to the browser if needed
 *
 */


goog.provide('silex.utils.Polyfills');


/**
 * @fileoverview add polyfills to the browser if needed
 *
 */
silex.utils.Polyfills.init = function() {
  // console object, do nothing
  window.console = window.console || {
    log: function() {},
    info: function() {},
    warn: function() {},
    error: function() {},
    dir: function() {}
  };
};
