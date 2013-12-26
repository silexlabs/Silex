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
 * @fileoverview
 *   This class represents a the body of the opened file,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the dom
 *
 */


goog.provide('silex.model.Body');
goog.require('silex.Config');



/**
 * @constructor
 * Never call this directly nor do new Body,
 * Rather use silex.model.Body.getInstance()
 */
silex.model.Body = function() {
};


/**
 * Singleton pattern
 * reference to the only {silex.model.Body} Body instance of the application
 */
silex.model.Body.instance;


/**
 * Singleton pattern
 * @return {silex.model.Body} a Body instance
 */
silex.model.Body.getInstance = function() {
  if (!silex.model.Body.instance){
    silex.model.Body.instance = new silex.model.Body();
  }
  return silex.model.Body.instance;
};




  this.headElement = goog.dom.createElement('div');
  this.bodyElement = goog.dom.getElementByClass('silex-stage-body', this.element);
  // make the body pageable
  silex.model.Element.prototype.setPageable(this.bodyElement, true);
  // allow drops
  silex.utils.JQueryEditable.setDropableOnly(this.bodyElement);

