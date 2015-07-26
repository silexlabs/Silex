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
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */


goog.provide('silex.view.pane.GeneralStylePane');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.ColorButton');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.TabBar');
goog.require('silex.view.pane.PaneBase');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extends {silex.view.pane.PaneBase}
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.pane.GeneralStylePane = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // init the component
  this.buildUi();
};

// inherit from silex.view.PaneBase
goog.inherits(silex.view.pane.GeneralStylePane, silex.view.pane.PaneBase);


/**
 * opacity input
 */
silex.view.pane.GeneralStylePane.prototype.opacityInput = null;


/**
 * build the UI
 */
silex.view.pane.GeneralStylePane.prototype.buildUi = function() {
  // opacity
  this.opacityInput = goog.dom.getElementByClass('opacity-input');
  goog.events.listen(this.opacityInput, goog.events.EventType.INPUT, this.onInputChanged, false, this);
};


/**
 * redraw the properties
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.GeneralStylePane.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
  if (this.iAmSettingValue) {
    return;
  }
  this.iAmRedrawing = true;

  // call super
  goog.base(this, 'redraw', selectedElements, pageNames, currentPageName);

  // not available for stage element
  var elementsNoStage = [];
  goog.array.forEach(selectedElements, function(element) {
    if (this.model.body.getBodyElement() !== element) {
      elementsNoStage.push(element);
    }
  }, this);
  if (elementsNoStage.length > 0) {
    // not stage element only
    this.opacityInput.removeAttribute('disabled');
    // get the opacity
    var opacity = this.getCommonProperty(selectedElements, goog.bind(function(element) {
      return this.model.element.getStyle(element, 'opacity');
    }, this));
    if (goog.isNull(opacity)) {
      this.opacityInput.value = '';
    }
    else if (opacity === '') {
      this.opacityInput.value = '100';
    }
    else {
      this.opacityInput.value = Math.round(parseFloat(opacity) * 100);
    }
  }
  else {
    // stage element only
    this.opacityInput.value = '';
    this.opacityInput.setAttribute('disabled', true);
  }
  this.iAmRedrawing = false;
};


/**
 * User has selected a color
 */
silex.view.pane.GeneralStylePane.prototype.onInputChanged = function(event) {
  if (this.opacityInput.value && this.opacityInput.value !== '') {
    var val = parseFloat(this.opacityInput.value) / 100.0;
    if (val < 0) {
      val = 0;
    }
    if (val > 1) {
      val = 1;
    }
    this.styleChanged('opacity', val.toString());
  }
  else {
    this.styleChanged('opacity');
  }
};
