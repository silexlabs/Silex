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
 * @fileoverview In Silex, each UI overrides the
 *      {silex.view.ViewBase} UiBase class
 *
 */
goog.provide('silex.view.ViewBase');

goog.require('silex.model.Element');

/**
 * @constructor
 * base class for all UI views of the view package
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.ViewBase = function (element, bodyElement, headElement) {
  this.element = element;
  this.bodyElement = bodyElement;
  this.headElement = headElement;
};


/**
 * callback set by the controller
 * called to notify the controller
 */
silex.view.ViewBase.prototype.onStatus;


/**
 * reference to the {element} element to which the UI is attached / rendered
 */
silex.view.ViewBase.prototype.element;


/**
 * reference to the {element} element which holds the body of the opened file
 */
silex.view.ViewBase.prototype.bodyElement;


/**
 * reference to the {element} element which holds the head of the opened file
 */
silex.view.ViewBase.prototype.headElement;


/**
 * @return {array} array of selected {element} elements on the stage
 */
silex.view.ViewBase.prototype.getSelection = function () {
  var elements = goog.dom.getElementsByClass(silex.model.Element.SELECTED_CLASS_NAME, this.bodyElement);
  if (!elements || elements.length === 0){
    // default, return body
    return [this.bodyElement];
  }
  return elements;
};





