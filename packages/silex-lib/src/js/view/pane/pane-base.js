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
 * @fileoverview This is the pane's base class
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */


goog.require('silex.view.ViewBase');
goog.provide('silex.view.pane.PaneBase');

/**
 * base class for all UI panes of the view.pane package
 * @constructor
 * @extend silex.view.ViewBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.PaneBase = function (element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.PaneBase, silex.view.ViewBase);


/**
 * base url for relative/absolute urls
 */
silex.view.pane.PaneBase.prototype.baseUrl;


/**
 * {bool} flag to prevent redraw while changing a value myself
 *        this is true when the user has used the toolbox to change a value,
 *        while the call to notify the controller is processed
 */
silex.view.pane.PaneBase.prototype.iAmSettingValue;


/**
 * {bool} flag to prevent notifying the controller while changing a value myself
 *        this is true during redraw
 *        it is useful because setting a value of an input element
 *        automatically triggers a change event
 */
silex.view.pane.PaneBase.prototype.iAmRedrawing;


/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgPane
 */
silex.view.pane.PaneBase.prototype.selectBgImage = function() {
  if (this.onStatus) this.onStatus('selectBgImage');
};


/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgPane
 */
silex.view.pane.PaneBase.prototype.selectImage = function() {
  if (this.onStatus) this.onStatus('selectImage');
};


/**
 * notify the controller that the user needs to edit the html content of the component
 * this is called by PropertyPane
 */
silex.view.pane.PaneBase.prototype.editHTML = function() {
  if (this.onStatus) this.onStatus('editHTML');
};


/**
 * notify the controller that the user needs to edit the html content of the component
 * this is called by PropertyPane
 */
silex.view.pane.PaneBase.prototype.editText = function() {
  if (this.onStatus) this.onStatus('editText');
};


/**
 * notify the controller that the style changed
 * @param   styleName   not css style but camel case
 */
silex.view.pane.PaneBase.prototype.styleChanged = function(styleName, opt_styleValue, opt_elements) {
  if (this.iAmRedrawing) return;
  // notify the controller
  this.iAmSettingValue = true;
  try{
    if (this.onStatus) this.onStatus('styleChanged', styleName, opt_styleValue, opt_elements);
  }
  catch(err){
    // error which will not keep this.iAmSettingValue to true
    console.error('an error occured while editing the value', err);
  }
  this.iAmSettingValue = false;
};


/**
 * refresh the displayed data
 */
silex.view.pane.PaneBase.prototype.redraw = function() {
/*
  // to be placed in all redraw methods to avoid loops
  if (this.iAmSettingValue) return;
  this.iAmRedrawing = true;
  this.iAmRedrawing = false;
*/
};


/**
 * base url for abs/rel conversions
 */
silex.view.pane.PaneBase.prototype.getBaseUrl = function() {
  return this.baseUrl;
};


/**
 * base url for abs/rel conversions
 */
silex.view.pane.PaneBase.prototype.setBaseUrl = function(url) {
  this.baseUrl = url;
  this.redraw();
};


/**
 * get the common property of a group of elements
 * @return  the value or null if the value is not the same for all elements
 */
silex.view.pane.PaneBase.prototype.getCommonProperty = function(elements, getPropertyFunction) {
  var value = null;
  var hasCommonValue = true;
  var isFirstValue = true;
  goog.array.forEach(elements, function (element) {
    var elementValue = getPropertyFunction(element);
    if (isFirstValue){
      isFirstValue = false;
      // init value
      value = elementValue;
    }
    else{
      // check if there is a common type
      if(elementValue !== value){
        hasCommonValue = false;
      }
    }
  }, this);
  if(hasCommonValue === false){
    value = null;
  }
  return value;
};

