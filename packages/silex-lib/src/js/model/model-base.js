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
 *   This class is the base class for models
 *
 */


goog.provide('silex.model.ModelBase');


/**
 * @constructor
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.model.ModelBase = function(bodyElement, headElement) {
  this.bodyElement = bodyElement;
  this.headElement = headElement;
};


/**
 * reference to the {element} stage, which is a pageable root
 */
silex.model.ModelBase.prototype.bodyElement;


/**
 * reference to the {element} element which holds the head of the opened file
 */
silex.model.ModelBase.prototype.headElement;


