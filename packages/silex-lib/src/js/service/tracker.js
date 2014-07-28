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
 * @fileoverview Service used to interact with google analytics server.
 *     It is used in Silex to track the user actions (QOS layer).
 *     This class is a singleton.
 *
 */


goog.provide('silex.service.Tracker');



/**
 * the Silex Tracker class hadles user actions tracking
 * this is for us to detect problems and improve user experience
 * @constructor
 */
silex.service.Tracker = function() {
  if (!ga) {
    console.error('google analytcs not loaded');
  }
};
goog.addSingletonGetter(silex.service.Tracker);


/**
 * constant
 * @const
 * @type {string}
 */
silex.service.Tracker.SILEX_ACTIONS_CATEGORY = 'silex-event';


/**
 * constant
 */
silex.service.Tracker.prototype.trackAction = function(category, action, opt_label, opt_value) {
  //  console.info('trackAction', arguments);
  ga('send', 'event', category, action, opt_label, opt_value, true);
};

