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


goog.provide('silex.view.propertiesTool.PropertyPane');

goog.require('goog.array');
goog.require('goog.object');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {function} propertyChanged   callback which I'll call when the style
 *  has been changed by the user
 * @param  {function} editHTML   callback which I'll call when
 *         the HTML of the current component must be edited
 * @param  {function} editText   callback which I'll call when
 *         the text of the current component must be edited
 * @param  {function} selectImage   callback which I'll call when
 *          the user is supposed to select an image
 */
silex.view.propertiesTool.PropertyPane = function(element,
    propertyChanged,
    editHTML,
    editText,
    selectImage) {
  this.element = element;
  this.propertyChanged = propertyChanged;
  this.editText = editText;
  this.editHTML = editHTML;
  this.selectImage = selectImage;
  this.buildUi();
};


/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.PropertyPane.prototype.element;


/**
 * component to be edited
 */
silex.view.propertiesTool.PropertyPane.prototype.component;


/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.PropertyPane.prototype.propertyChanged;


/**
 * callback to call to let the user edit the HTML content of the component
 */
silex.view.propertiesTool.PropertyPane.prototype.editHTML;


/**
 * callback to call to let the user edit the text content of the component
 */
silex.view.propertiesTool.PropertyPane.prototype.editText;


/**
 * callback to call to let the user edit the image url
 */
silex.view.propertiesTool.PropertyPane.prototype.selectImage;


/**
 * base url for relative/absolute urls
 */
silex.view.propertiesTool.PropertyPane.prototype.baseUrl;


/**
 * avoid loops on redraw
 */
silex.view.propertiesTool.PropertyPane.prototype.isRedraw;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.leftInput;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.rightInput;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.topInput;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.bottomInput;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.widthInput;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.heightInput;


/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.zIndexInput;


/**
 * build the UI
 */
silex.view.propertiesTool.PropertyPane.prototype.buildUi = function() {
  // lock / unlock
  var lockBtn = goog.dom.getElementByClass('lock-btn');
  var unlockBtn = goog.dom.getElementByClass('unlock-btn');
  if (lockBtn) goog.events.listen(lockBtn,
                                  goog.events.EventType.CLICK,
                                  this.lock,
                                  false,
                                  this);
  if (unlockBtn) goog.events.listen(unlockBtn,
                                    goog.events.EventType.CLICK,
                                    this.unlock,
                                    false,
                                    this);

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
 * look for a locked parent
 * @return   {boolean}  returns true if the current component
 *           has a locked parent
 */
silex.view.propertiesTool.PropertyPane.prototype.hasLockedParent = function() {
  var element = this.component.element.parentNode;
  while (element && !goog.dom.classes.has(element, 'locked-style')) {
    element = element.parentNode;
  }
  if (element && goog.dom.classes.has(element, 'locked-style')) {
    return true;
  }
  return false;
};


/**
 * callback for the lock/unlock button
 */
silex.view.propertiesTool.PropertyPane.prototype.lock = function() {
  if (!this.hasLockedParent()) {
    this.component.setLocked(true);
  }
  else {
    alert('unlock the parent in order to lock / unlock this component.');
  }
};


/**
 * callback for the lock/unlock button
 */
silex.view.propertiesTool.PropertyPane.prototype.unlock = function() {
  if (!this.hasLockedParent()) {
    this.component.setLocked(false);
  }
  else {
    alert('unlock the parent in order to lock / unlock this component.');
  }
};


/**
 * position or size changed
 * callback for number inputs
 */
silex.view.propertiesTool.PropertyPane.prototype.onPositionChanged =
    function() {
  if (this.component &&
      !this.isRedraw &&
      goog.dom.classes.has(this.component.element, 'editable-style')) {
    var bbox = {};
    if (this.leftInput.value && this.leftInput.value !== '')
      bbox.left = this.leftInput.value + 'px';
    if (this.widthInput.value && this.widthInput.value !== '')
      bbox.width = this.widthInput.value + 'px';
    if (this.bottomInput.value && this.bottomInput.value !== '')
      bbox.bottom = this.bottomInput.value + 'px';
    if (this.topInput.value && this.topInput.value !== '')
      bbox.top = this.topInput.value + 'px';
    if (this.heightInput.value && this.heightInput.value !== '')
      bbox.height = this.heightInput.value + 'px';
    if (this.rightInput.value && this.rightInput.value !== '')
      bbox.right = this.rightInput.value + 'px';
    if (this.zIndexInput.value && this.zIndexInput.value !== '')
      bbox.zIndex = this.zIndexInput.value;

    this.component.setBoundingBox(bbox);
  }
  this.redraw();
};


/**
 * display the propertis of the component being edited
 * @param   {silex.model.component} component being edited
 */
silex.view.propertiesTool.PropertyPane.prototype.setComponent =
    function(component) {
  this.component = component;
  this.redraw();
};


/**
 * base url for abs/rel conversions
 * @return   {string} the base URL
 */
silex.view.propertiesTool.PropertyPane.prototype.getBaseUrl = function() {
  return this.baseUrl;
};


/**
 * base url for abs/rel conversions
 * @param   {string} url  URL to set as the base URL
 */
silex.view.propertiesTool.PropertyPane.prototype.setBaseUrl = function(url) {
  this.baseUrl = url;
  this.redraw();
};


/**
 * change current component image
 * @param   {string} url  URL of the image to set as the src
 */
silex.view.propertiesTool.PropertyPane.prototype.setImage = function(url) {
  if (this.baseUrl)
    this.component.setImageSrc(silex.Helper.getAbsolutePath(url, this.baseUrl));
  else
    this.component.setImageSrc(url);
  this.redraw();
};


/**
 * redraw the properties
 */
silex.view.propertiesTool.PropertyPane.prototype.redraw = function() {
  if (this.component && !this.isRedraw) {
    this.isRedraw = true;
    // refresh properties
    var imageUrl = null;
    if (this.component.type === silex.model.Component.SUBTYPE_IMAGE) {
      if (this.baseUrl)
        imageUrl = silex.Helper.getRelativePath(this.component.getImageSrc(),
                                                this.baseUrl);
      else
        imageUrl = this.component.getImageSrc();
    }

    var editionContainer = goog.dom.getElementByClass('edition-container',
        this.element);
    if (this.component) {
      var templateHtml = goog.dom.getElementByClass('edition-template',
          this.element).innerHTML;
      silex.Helper.resolveTemplate(editionContainer, templateHtml, {
        htmlEditor: (this.component.type ===
            silex.model.Component.SUBTYPE_HTML),
        textEditor: (this.component.type ===
            silex.model.Component.SUBTYPE_TEXT),
        imageUrl: imageUrl
      });

      // HTML editor
      var buttonElement = goog.dom.getElementByClass('html-editor-button',
          editionContainer);
      if (buttonElement) {
        var button = new goog.ui.CustomButton();
        button.decorate(buttonElement);
        goog.events.listen(buttonElement,
            goog.events.EventType.CLICK,
            this.editHTML,
            false);
      }
      // text editor
      var buttonElement = goog.dom.getElementByClass('text-editor-button',
          editionContainer);
      if (buttonElement) {
        var button = new goog.ui.CustomButton();
        button.decorate(buttonElement);
        goog.events.listen(buttonElement,
            goog.events.EventType.CLICK,
            this.editText,
            false);
      }
      if (this.component.type === silex.model.Component.SUBTYPE_IMAGE) {
        // browse for image button
        var buttonElement = goog.dom.getElementByClass('image-url-button',
            editionContainer);
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
              if (this.component.type === silex.model.Component.SUBTYPE_IMAGE)
                this.setImage(inputElement.value);
            }
          }, false, this);
        }
      }

      // position and size
      if (goog.dom.classes.has(this.component.element, 'editable-style')) {
        var bbox = this.component.getBoundingBox();
        if (bbox.left !== undefined) {
          this.leftInput.value = bbox.left.substr(0,
              bbox.left.indexOf('px'));
        }
        else {
          this.leftInput.value = '';
        }
        if (bbox.width !== undefined) {
          this.widthInput.value = bbox.width.substr(0,
              bbox.width.indexOf('px'));
        }
        else {
          this.widthInput.value = '';
        }
        if (bbox.bottom !== undefined) {
          this.bottomInput.value = bbox.bottom.substr(0,
              bbox.bottom.indexOf('px'));
        }
        else {
          this.bottomInput.value = '';
        }
        if (bbox.top !== undefined) {
          this.topInput.value = bbox.top.substr(0,
              bbox.top.indexOf('px'));
        }
        else {
          this.topInput.value = '';
        }
        if (bbox.height !== undefined) {
          this.heightInput.value = bbox.height.substr(0,
              bbox.height.indexOf('px'));
        }
        else {
          this.heightInput.value = '';
        }
        if (bbox.right !== undefined) {
          this.rightInput.value = bbox.right.substr(0,
              bbox.right.indexOf('px'));
        }
        else {
          this.rightInput.value = '';
        }
        if (bbox.zIndex !== undefined) {
          this.zIndexInput.value = bbox.zIndex;
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
