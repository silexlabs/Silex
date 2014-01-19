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


goog.require('silex.model.ModelBase');
goog.provide('silex.model.Body');
goog.require('silex.Config');



/**
 * @constructor
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.model.Body = function(bodyElement, headElement) {
  // call super
  goog.base(this, bodyElement, headElement);

  // activate pageable plugin
  silex.utils.PageablePlugin.setPageable(bodyElement, true);
};

// inherit from silex.model.ModelBase
goog.inherits(silex.model.Body, silex.model.ModelBase);

