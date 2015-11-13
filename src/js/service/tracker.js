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
 * @fileoverview Service used to interact with analytics server.
 *     It is used in Silex to track the user actions (QOS layer).
 *     This class is a singleton.
 *
 */


goog.provide('silex.service.Tracker');



/**
 * the Silex Tracker class logs user actions
 * this is for us to detect problems and improve user experience
 * @constructor
 */
silex.service.Tracker = function() {
};
goog.addSingletonGetter(silex.service.Tracker);


/**
 * constant
 * @const
 * @type {string}
 */
silex.service.Tracker.SILEX_ACTIONS_CATEGORY = 'silex-event';


/**
 * track an action in G.A.
 *
 * @param  {string} category
 * @param  {string} action
 * @param  {?string=} opt_label
 * @param  {?number=} opt_value
 */
silex.service.Tracker.prototype.trackAction = function(category, action, opt_label, opt_value) {
  console.info('trackAction', arguments);
  if (typeof Piwik === 'undefined') {
    // console.error('Piwik not loaded');
  }
  else {
    _paq.push(['trackEvent', category, action, opt_label, opt_value]);
  }
};

