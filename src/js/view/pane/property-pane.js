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
 * @fileoverview Property pane, displayed in the property tool box
 *
 */


goog.require('silex.view.pane.PaneBase');
goog.provide('silex.view.pane.PropertyPane');

goog.require('silex.utils.Dom');

goog.require('goog.array');
goog.require('goog.object');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extend silex.view.PaneBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.PropertyPane = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  this.buildUi();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.PropertyPane, silex.view.pane.PaneBase);

/**
 * callback to call to let the user edit the HTML content of the component
 */
silex.view.pane.PropertyPane.prototype.editHTML;


/**
 * callback to call to let the user edit the text content of the component
 */
silex.view.pane.PropertyPane.prototype.editText;


/**
 * callback to call to let the user edit the image url
 */
silex.view.pane.PropertyPane.prototype.selectImage;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.leftInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.rightInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.topInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.bottomInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.widthInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.heightInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.zIndexInput;


/**
 * build the UI
 */
silex.view.pane.PropertyPane.prototype.buildUi = function() {

  // position and size
  this.leftInput = goog.dom.getElementByClass('left-input');
  goog.events.listen(this.leftInput,
      'change',
      this.onPositionChanged,
      false,
      this);
  this.widthInput = goog.dom.getElementByClass('width-input');
  goog.events.listen(this.widthInput,
      'change',
      this.onPositionChanged,
      false,
      this);
  this.bottomInput = goog.dom.getElementByClass('bottom-input');
  goog.events.listen(this.bottomInput,
      'change',
      this.onPositionChanged,
      false,
      this);
  this.topInput = goog.dom.getElementByClass('top-input');
  goog.events.listen(this.topInput,
      'change',
      this.onPositionChanged,
      false,
      this);
  this.heightInput = goog.dom.getElementByClass('height-input');
  goog.events.listen(this.heightInput,
      'change',
      this.onPositionChanged,
      false,
      this);
  this.rightInput = goog.dom.getElementByClass('right-input');
  goog.events.listen(this.rightInput,
      'change',
      this.onPositionChanged,
      false,
      this);

  // z index
  this.zIndexInput = goog.dom.getElementByClass('z-index-input');
  goog.events.listen(this.zIndexInput,
      'change',
      this.onPositionChanged,
      false,
      this);
};


/**
 * position or size changed
 * callback for number inputs
 */
silex.view.pane.PropertyPane.prototype.onPositionChanged =
    function() {
  // get the selected element
  var element = this.getSelection()[0];

  if (element){
    if (this.leftInput.value && this.leftInput.value !== ''){
      this.styleChanged('left', this.leftInput.value + 'px');
    }
    else{
      this.styleChanged('left');
    }
    if (this.widthInput.value && this.widthInput.value !== ''){
      this.styleChanged('width', this.widthInput.value + 'px');
    }
    else{
      this.styleChanged('width');
    }
    if (this.bottomInput.value && this.bottomInput.value !== ''){
      this.styleChanged('bottom', this.bottomInput.value + 'px');
    }
    else{
      this.styleChanged('bottom');
    }
    if (this.topInput.value && this.topInput.value !== ''){
      this.styleChanged('top',this.topInput.value + 'px');
    }
    else{
      this.styleChanged('top');
    }
    if (this.heightInput.value && this.heightInput.value !== ''){
      console.log('height changed', this.heightInput.value);
      this.styleChanged('height', this.heightInput.value + 'px');
    }
    else{
      this.styleChanged('height');
    }
    if (this.rightInput.value && this.rightInput.value !== ''){
      this.styleChanged('right', this.rightInput.value + 'px');
    }
    else{
      this.styleChanged('right');
    }
    if (this.zIndexInput.value && this.zIndexInput.value !== ''){
      this.styleChanged('zIndex', this.zIndexInput.value + 'px');
    }
    else{
      this.styleChanged('zIndex');
    }
  }
};


/**
 * redraw the properties
 */
silex.view.pane.PropertyPane.prototype.redraw = function() {
  // call super
  goog.base(this, 'redraw');

  // get the selected element
  var element = this.getSelection()[0];

  if (element){

    var type = element.getAttribute(silex.model.Element.TYPE_ATTR);
    // refresh properties
    var imageUrl = '';
    if (type === silex.model.Element.TYPE_IMAGE) {
      var img = goog.dom.getElement(silex.model.Element.ELEMENT_CONTENT_CLASS_NAME, element);
      if (img){
        if (this.baseUrl)
          imageUrl = silex.utils.Style.getRelativePath(img.getAttribute('src'), this.baseUrl);
        else
          imageUrl = img.getAttribute('src');
      }
    }

    // resolve the template
    var editionContainer = goog.dom.getElementByClass('edition-container', this.element);
    if (this.element) {
      var templateHtml = goog.dom.getElementByClass('edition-template', this.element).innerHTML;
      editionContainer.innerHTML = silex.utils.Dom.renderList(templateHtml, [{
        htmlEditor: (type === silex.model.Element.TYPE_HTML)?'inherit':'none',
        textEditor: (type === silex.model.Element.TYPE_TEXT)?'inherit':'none',
        imageEditor: (type === silex.model.Element.TYPE_IMAGE)?'inherit':'none',
        imageUrl: imageUrl
      }]);

      // HTML editor
      var buttonElement = goog.dom.getElementByClass('html-editor-button', editionContainer);
      if (buttonElement) {
        var button = new goog.ui.CustomButton();
        button.decorate(buttonElement);
        goog.events.listen(buttonElement,
            goog.events.EventType.CLICK,
            this.editHTML,
            false);
      }
      // text editor
      var buttonElement = goog.dom.getElementByClass('text-editor-button', editionContainer);
      if (buttonElement) {
        var button = new goog.ui.CustomButton();
        button.decorate(buttonElement);
        goog.events.listen(buttonElement,
            goog.events.EventType.CLICK,
            this.editText,
            false);
      }
      if (type === silex.model.Element.TYPE_IMAGE) {
        // browse for image button
        var buttonElement = goog.dom.getElementByClass('image-url-button', editionContainer);
        if (buttonElement) {
          var button = new goog.ui.CustomButton();
          button.decorate(buttonElement);
          goog.events.listen(buttonElement,
              goog.events.EventType.CLICK,
              this.selectImage,
              false);
        }
        // edit image url text field
        var inputElement = goog.dom.getElementByClass('image-url-input',
            editionContainer);
        if (inputElement) {
          goog.events.listen(inputElement, 'change', function() {
            if (this.component && !this.isRedraw) {
              if (type === silex.model.Element.TYPE_IMAGE)
                this.setImage(inputElement.value);
            }
          }, false, this);
        }
      }

      // position and size
      if (goog.dom.classes.has(element, 'editable-style')) {
        if (element.style.left !== undefined) {
          this.leftInput.value = element.style.left.substr(0,
              element.style.left.indexOf('px'));
        }
        else {
          this.leftInput.value = '';
        }
        if (element.style.width !== undefined) {
          this.widthInput.value = element.style.width.substr(0,
              element.style.width.indexOf('px'));
        }
        else {
          this.widthInput.value = '';
        }
        if (element.style.bottom !== undefined) {
          this.bottomInput.value = element.style.bottom.substr(0,
              element.style.bottom.indexOf('px'));
        }
        else {
          this.bottomInput.value = '';
        }
        if (element.style.top !== undefined) {
          this.topInput.value = element.style.top.substr(0,
              element.style.top.indexOf('px'));
        }
        else {
          this.topInput.value = '';
        }
        if (element.style.height !== undefined) {
          this.heightInput.value = element.style.height.substr(0,
              element.style.height.indexOf('px'));
        }
        else {
          this.heightInput.value = '';
        }
        if (element.style.right !== undefined) {
          this.rightInput.value = element.style.right.substr(0,
              element.style.right.indexOf('px'));
        }
        else {
          this.rightInput.value = '';
        }
        if (element.style.zIndex !== undefined) {
          this.zIndexInput.value = element.style.zIndex;
        }
        else {
          this.zIndexInput.value = '';
        }
      }
      else {
        // case of the stage
        this.leftInput.value = '';
        this.widthInput.value = '';
        this.bottomInput.value = '';
        this.topInput.value = '';
        this.heightInput.value = '';
        this.rightInput.value = '';
        this.zIndexInput.value = '';
      }
    }
    else {
      if (editionContainer) {
        editionContainer.innerHTML = '';
      }
    }
    this.isRedraw = false;
  }
};
