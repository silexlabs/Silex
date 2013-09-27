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

goog.provide('silex.service.Tracker');

/**
 * the Silex Tracker class hadles user actions tracking
 * this is for us to detect problems and improve user experience
 * @constructor
 */
silex.service.Tracker = function(){
	if(!ga){
		throw('google analytcs not loaded');
	}
}
/**
 * constant
 */
silex.service.Tracker.SILEX_ACTIONS_CATEGORY = 'silex-event';
/**
 * constant
 */
silex.service.Tracker.prototype.trackAction = function (name, opt_label, opt_value) {
	console.log('trackAction', arguments);
	//_gaq.push(['_trackEvent', silex.service.Tracker.SILEX_ACTIONS_CATEGORY, name, opt_label, opt_value, true]);
	ga('send', 'event', silex.service.Tracker.SILEX_ACTIONS_CATEGORY, name, opt_label, opt_value, true);
}

