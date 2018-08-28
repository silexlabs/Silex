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
  /**
   * catchall error tracker
   * @type {sourceMap.SourceMapConsumer}
   */
  this.sourceMapConsumer = null;
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
  // console.info('trackAction (anonymized)', arguments);
  _paq.push(['trackEvent', category, action, opt_label, opt_value]);
};

/**
 * @param {string} msg
 * @param {string} url
 * @param {number} line
 * @param {?number=} colno
 * @param {?Error=} error
 */
silex.service.Tracker.prototype.trackOnError = function(msg, url, line, colno, error) {
// define a closure to execute once sourceMapConsumer is initialized
  var trackWithSourceMap = () => {
    try {
      var originalPosition = this.sourceMapConsumer.originalPositionFor({
        line: line,
        column: colno
      });
      this.trackAction('controller-events', 'uncaught.error ' + msg, 'file: ' + originalPosition.source + ' - line: ' + originalPosition.line + ':' + originalPosition.column + ' - name: ' + originalPosition.name, -1);
    }
    catch(e) {
      // do nothing if the error tracker itself fails
    }
  };
  // load the source map if needed
  if(this.sourceMapConsumer) {
    trackWithSourceMap();
  }
  else {
    // load sourcemap
    var oReq = new XMLHttpRequest();
    oReq.open('GET', 'js/admin.js.map');
    oReq.addEventListener('load', (event) => {
      try {
        this.sourceMapConsumer = new sourceMap.SourceMapConsumer(event.target.responseText);
      }
      catch(e) {
        // do nothing if the error tracker itself fails
      }
      trackWithSourceMap();
    });
    oReq.send();
  }
}
