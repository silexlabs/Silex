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
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */


goog.require('silex.view.pane.PaneBase');
goog.provide('silex.view.pane.StylePane');


/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extend silex.view.PaneBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.StylePane = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  this.buildUi();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.StylePane, silex.view.pane.PaneBase);


/**
 * css classe name input
 */
silex.view.pane.StylePane.prototype.cssClassesInput;


/**
 * instance of ace editor
 */
silex.view.CssEditor.prototype.ace;


/**
 * build the UI
 */
silex.view.pane.StylePane.prototype.buildUi = function() {
  this.cssClassesInput = goog.dom.getElementByClass('style-css-classes-input', this.element);
  goog.events.listen(this.cssClassesInput, 'change', this.onInputChanged, false, this);

  this.ace = ace.edit(goog.dom.getElementByClass('element-style-editor', this.element));
  this.iAmSettingValue = false;
  //this.ace.setTheme("ace/theme/monokai");
  this.ace.getSession().setMode('ace/mode/css');
  this.ace.getSession().on('change', goog.bind(function(e) {
    if (this.iAmSettingValue === false) {
      setTimeout(goog.bind(function() {
        this.contentChanged();
      }, this), 100);
    }
  }, this));
};


/**
 * redraw the properties
 */
silex.view.pane.StylePane.prototype.redraw = function() {
  // call super
  goog.base(this, 'redraw');

  // get the selected element
  var element = this.getSelection()[0];

  if (element){
    this.cssClassesInput.value = silex.utils.Style.getClassName(element);
    // set value
    var value = element.getAttribute('style');
    if (value){
      this.iAmSettingValue = true;
      var str = '.element{\n'+value.replace(/; /g, ';\n')+'\n}';
      var pos = this.ace.getCursorPosition();
      this.ace.setValue(str);
      this.ace.gotoLine(pos.row + 1, pos.column, false);
      this.iAmSettingValue = false;
    }
    else{
      this.iAmSettingValue = true;
      this.ace.setValue('');
      this.iAmSettingValue = false;
    }
  }
};


/**
 * User has selected a color
 */
silex.view.pane.StylePane.prototype.onInputChanged = function(event) {
  if (this.onStatus) this.onStatus('classNameChanged', this.cssClassesInput.value);
};

/**
 * the content has changed, notify the controler
 */
silex.view.pane.StylePane.prototype.contentChanged = function() {
  var value = this.ace.getValue();
  if(value){
    value = value.replace('.element{\n', '');
    value = value.replace('\n}', '');
    value = value.replace(/\n/, ' ');
  }
  if (this.onStatus) {
    this.onStatus('propertyChanged', 'style', value);
  }
};
