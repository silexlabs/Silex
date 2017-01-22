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
 * @fileoverview The text editor is displayed when the user
 *   needs to edit rich text.
 * It is based on google rich text editor
 *
 */

goog.provide('silex.view.dialog.TextEditor');

goog.require('goog.events');
goog.require('goog.dom');
goog.require('goog.editor.Command');
goog.require('goog.editor.Field');
goog.require('goog.editor.plugins.BasicTextFormatter');
goog.require('goog.editor.plugins.EnterHandler');
goog.require('goog.editor.plugins.HeaderFormatter');
goog.require('goog.editor.plugins.LinkBubble');
goog.require('goog.editor.plugins.ListTabHandler');
goog.require('goog.editor.plugins.RemoveFormatting');
goog.require('goog.editor.plugins.SpacesTabHandler');
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.editor.DefaultToolbar');
goog.require('goog.ui.editor.ToolbarController');
goog.require('silex.Config');
goog.require('silex.view.dialog.DialogBase');
goog.require('silex.view.dialog.LinkDialogPlugin');



/**
 * the Silex TextEditor class
 * @constructor
 * @extends {silex.view.dialog.DialogBase}
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.TextEditor = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // set the visibility css class
  this.visibilityClass = 'text-editor';
};

// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.TextEditor, silex.view.dialog.DialogBase);


/**
 * the URL of the lorem ipsum service
 * @const
 * @type {string}
 */
silex.view.dialog.TextEditor.LOREM_IPSUM_SERVICE_URL =
    '//baconipsum.com/api/?type=meat-and-filler';


/**
 * the editable text field
 */
silex.view.dialog.TextEditor.prototype.textField = null;


/**
 * init the menu and UIs
 */
silex.view.dialog.TextEditor.prototype.buildUi = function() {
  // call super
  goog.base(this, 'buildUi');

  // Create an editable field
  // compute a unique class name for the text field element
  // in order to avoid collision in case we would have
  // several text-editors in the same page
  // FIXME: goog.editor.Field should handle {Element}
  // which would work because getElement already accepts {string|Element}
  var rnd = Math.floor(Math.random() * (99999));
  silex.view.dialog.TextEditor.nextId =
      silex.view.dialog.TextEditor.nextId || 0;
  var uniqueId =
      'text-field' + rnd + '-' + (silex.view.dialog.TextEditor.nextId++);
  // mark the desired text field
  goog.dom.getElementByClass('text-field', this.element).id = uniqueId;
  // create a text field out of this element
  this.textField = new goog.editor.Field(uniqueId);

  // Create and register all of the editing plugins you want to use.
  this.textField.registerPlugin(new goog.editor.plugins.BasicTextFormatter());
  this.textField.registerPlugin(new goog.editor.plugins.RemoveFormatting());
  this.textField.registerPlugin(new goog.editor.plugins.ListTabHandler());
  this.textField.registerPlugin(new goog.editor.plugins.SpacesTabHandler());
  this.textField.registerPlugin(new goog.editor.plugins.EnterHandler());
  this.textField.registerPlugin(new goog.editor.plugins.HeaderFormatter());
  this.textField.registerPlugin(new silex.view.dialog.LinkDialogPlugin());
  this.textField.registerPlugin(new goog.editor.plugins.LinkBubble());

  // add fonts
  var fontFaceButton = goog.ui.editor.DefaultToolbar.makeBuiltInToolbarButton(
      goog.editor.Command.FONT_FACE);

  var availableFonts = silex.Config.fonts;
  for (let fontName in availableFonts) {
    goog.ui.editor.ToolbarFactory.addFont(
        /** @type {!goog.ui.Select} */ (fontFaceButton),
        fontName,
        availableFonts[fontName].value);
  }

  // add font sizes
  var fontSizeButton = goog.ui.editor.DefaultToolbar.makeBuiltInToolbarButton(
      goog.editor.Command.FONT_SIZE);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '1', 1);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '2', 2);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '3', 3);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '4', 4);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '5', 5);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '6', 6);
  goog.ui.editor.ToolbarFactory.addFontSize(
      /** @type {!goog.ui.Select} */ (fontSizeButton), '7', 7);

  var formatButton = goog.ui.editor.DefaultToolbar.makeBuiltInToolbarButton(
      goog.editor.Command.FORMAT_BLOCK);
  while (formatButton.getItemCount() > 0) {
    formatButton.removeItemAt(0);
  }
  // add our styles
  goog.ui.editor.ToolbarFactory.addFormatOption(
      /** @type {!goog.ui.Select} */ (formatButton),
      'Normal', goog.dom.TagName.P);
  goog.ui.editor.ToolbarFactory.addFormatOption(
      /** @type {!goog.ui.Select} */ (formatButton),
      'Heading 1', goog.dom.TagName.H1);
  goog.ui.editor.ToolbarFactory.addFormatOption(
      /** @type {!goog.ui.Select} */ (formatButton),
      'Heading 2', goog.dom.TagName.H2);
  goog.ui.editor.ToolbarFactory.addFormatOption(
      /** @type {!goog.ui.Select} */ (formatButton),
      'Heading 3', goog.dom.TagName.H3);

  // apply a class when the format changes
  // silex convention is ".normal" class for "Normal" style
  goog.events.listen(
      formatButton,
      goog.ui.Component.EventType.ACTION,
      this.formatChanged,
      false,
      this);


  // Specify the buttons to add to the toolbar, using built in default buttons.
  var buttons = [
    formatButton,
    fontFaceButton,
    fontSizeButton,
    goog.editor.Command.BOLD,
    goog.editor.Command.ITALIC,
    goog.editor.Command.UNDERLINE,
    goog.editor.Command.FONT_COLOR,
    goog.editor.Command.BACKGROUND_COLOR,
    goog.editor.Command.LINK,
    goog.editor.Command.UNORDERED_LIST,
    goog.editor.Command.ORDERED_LIST,
    goog.editor.Command.INDENT,
    goog.editor.Command.OUTDENT,
    goog.editor.Command.JUSTIFY_LEFT,
    goog.editor.Command.JUSTIFY_CENTER,
    goog.editor.Command.JUSTIFY_RIGHT,
    goog.editor.Command.STRIKE_THROUGH,
    goog.editor.Command.REMOVE_FORMAT
  ];
  var myToolbar = goog.ui.editor.DefaultToolbar.makeToolbar(
      buttons,
      /** @type  {!Element} */ (goog.dom.getElementByClass(
          'toolbar', this.element)));

  // lorem ipsum button
  var button = goog.ui.editor.ToolbarFactory.makeButton(
      'loremIpsumBtn', 'insert lorem ipsum text', 'Lorem');
  goog.events.listen(
      button,
      goog.ui.Component.EventType.ACTION,
      this.onLoremIpsumClick,
      false,
      this);
  myToolbar.addChild(new goog.ui.ToolbarSeparator(), true);
  myToolbar.addChild(button, true);

  // invert color button
  var buttonColor = goog.ui.editor.ToolbarFactory.makeButton(
      'invertColorBtn', 'invert the background color of the text editor', ' bg color', 'fa fa-adjust fa-lg');
  goog.events.listen(
      buttonColor,
      goog.ui.Component.EventType.ACTION,
      this.onInvertColor,
      false,
      this);
  myToolbar.addChild(buttonColor, true);

  // Hook the toolbar into the field.
  var myToolbarController = new goog.ui.editor.ToolbarController(
      this.textField, myToolbar);

  // Watch for field changes, to display below.
  // notify the controller
  goog.events.listen(
      this.textField,
      goog.editor.Field.EventType.DELAYEDCHANGE,
      this.contentChanged,
      false,
      this);

  /* This appears to bug in firefox,
     because at this stage the text field is display: none
  try {
    this.textField.makeEditable();
  }
  catch (e) {
    // to prevent this bug:
    // goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS = false;
    console.error('error catched', e);
  }
  */

};


/**
 * Set the value of the editor
 * @param    {string} html    HTML to display at start
 */
silex.view.dialog.TextEditor.prototype.setValue = function(html) {
  // init editable text input
  this.textField.setHtml(false, html);
  this.textField.focusAndPlaceCursorAtStart();
};


/**
 * add class names to the iframe inside the editor
 * @param    {string} elementClassNames , css classes of the element being edited
 *                    so that css rules apply in the editor too
 */
silex.view.dialog.TextEditor.prototype.setElementClassNames =
    function(elementClassNames) {
  // apply to the bg
  var iframe = goog.dom.getElementsByTagNameAndClass(
      'iframe', null, this.element)[0];
  // get the iframe document
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  // apply css classes of the element
  // apply it on <html> tag instead of body,
  // because body represents
  // the '.silex-element-content' element of Silex text elements
  // so it has these classes: 'silex-element-content normal'
  var htmlElement = iframeDoc.getElementsByTagName('html')[0];
  htmlElement.className = elementClassNames;
  // body represents the '.silex-element-content' element of Silex text elements
  // so it has these classes: 'silex-element-content normal'
  iframeDoc.body.className = 'silex-element-content normal';
  // keep the size of the text field
  htmlElement.style.left = '10px';
  htmlElement.style.right = '20px';
  htmlElement.style.height = '100%';
  htmlElement.style.overflowX = 'hidden';
  htmlElement.style.overflowY = 'scroll';
  iframeDoc.body.style.height = 'auto';
  iframeDoc.body.style.position = 'initial';
  // keep the pointer events which are disabled on element content (see front-end.css)
  iframeDoc.body.style.pointerEvents = 'auto';
};


/**
 * Set the editor bg color
 * @param    {?string=} opt_bgColor    desired color for the editor background
 *           which is useful to edit white text on a black bacground for example
 */
silex.view.dialog.TextEditor.prototype.setBackgroundColor =
    function(opt_bgColor) {
  // editor bg color
  if (!opt_bgColor) {
    opt_bgColor = '#FFFFFF';
  }
  // apply to the bg
  var iframe = goog.dom.getElementsByTagNameAndClass(
      'iframe', null, this.element)[0];

  goog.style.setStyle(iframe, 'backgroundColor', opt_bgColor);
};


/**
 * Open the editor
 */
silex.view.dialog.TextEditor.prototype.openEditor = function() {
  // call super
  goog.base(this, 'openEditor');
  // make the text field editable after it is made "display: block"
  this.textField.makeEditable();
  // handle current css styles
  if (this.currentCustomCssStyles) {
    this.setCustomCssStyles(this.currentCustomCssStyles);
  }
  // handle current fonts
  if (this.currentCustomFonts) {
    this.setCustomFonts(this.currentCustomFonts);
  }
  // add styles already present in the main editor iframe
  // this is useful to have text rendered the same way
  var iframe = goog.dom.getElementsByTagNameAndClass(
      'iframe', null, this.element)[0];
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var head = iframeDoc.getElementsByTagName('head')[0];
  var tag = iframeDoc.createElement('link');
  tag.rel = 'stylesheet';
  tag.href = 'libs/normalize.css';
  goog.dom.appendChild(head, tag);

  tag = iframeDoc.createElement('link');
  tag.rel = 'stylesheet';
  tag.href = silex.utils.BackwardCompat.getStaticResourceUrl('front-end.css');
  goog.dom.appendChild(head, tag);

  // prevent paged content to be hidden (pageable jquery plugin)
  tag = iframeDoc.createElement('style');
  tag.innerHTML = '.paged-element{display:inherit;}';
  goog.dom.appendChild(head, tag);

  // workaround "body of the text editor has min-width:0;"
  iframeDoc.documentElement.style.minWidth = '';
  iframeDoc.body.style.minWidth = '';

  // listen for escape key inside the iframe
  let keyHandler = new goog.events.KeyHandler(iframeDoc);
  goog.events.listen(keyHandler, 'key', (e) => {
    if(this.isOpened && e.keyCode == goog.events.KeyCodes.ESC) {
      this.closeEditor();
    }
  });
};


/**
 * Close the editor
 */
silex.view.dialog.TextEditor.prototype.closeEditor = function() {
  // call super
  goog.base(this, 'closeEditor');
  // remove editable before it goes "display: none"
  if (!this.textField.isUneditable()) {
    this.textField.makeUneditable();
  }
};


/**
 * list of custom fonts to apply when the editor opens
 */
silex.view.dialog.TextEditor.prototype.currentCustomFonts = null;


/**
 * set the list of custom fonts
 * @param {Array.<{name:string, href:string}>} customFonts ,
 *                                      the custom fonts used in the text fields
 */
silex.view.dialog.TextEditor.prototype.setCustomFonts = function(customFonts) {
  // store for later use
  this.currentCustomFonts = customFonts;
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass(
      'iframe', null, this.element)[0];
  if (!iframe) {
    // iframe not yet defined, the text editor is loading
    return;
  }
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeHead = iframeDoc.head;
  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByClass(
      silex.model.Head.CUSTOM_FONTS_CSS_CLASS, iframeHead);
  goog.array.forEach(links, function(link) {
    link.parentNode.removeChild(link);
  });
  goog.array.forEach(customFonts, function(font) {
    var link = goog.dom.createElement('link');
    link.setAttribute('href', font.href);
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('class', silex.model.Head.CUSTOM_FONTS_CSS_CLASS);
    iframeHead.appendChild(link);
  }, this);
};


/**
 * list of custom css styles to apply when the editor opens
 */
silex.view.dialog.TextEditor.prototype.currentCustomCssStyles = null;


/**
 * set the list of custom css styles
 * @param {string} customCssStyles  the styles
 *                                  written by the user in the css editor
 */
silex.view.dialog.TextEditor.prototype.setCustomCssStyles =
    function(customCssStyles) {
  // store for later use
  this.currentCustomCssStyles = customCssStyles;
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass(
      'iframe', null, this.element)[0];
  if (!iframe) {
    // iframe not yet defined, the text editor is loading
    return;
  }

  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeHead = iframeDoc.head;
  // add Silex css to the iframe
  var silexStyle = /** @type  {!Element} */ (goog.dom.getElementByClass(
      silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
      iframeHead));
  // update iframe css
  if (!silexStyle) {
    silexStyle = iframeDoc.createElement('style');
    silexStyle.type = 'text/css';
    goog.dom.classlist.add(
        silexStyle, silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS);
    goog.dom.appendChild(iframeHead, silexStyle);
  }
  // remove the styles which apply to body
  // because the text editor's iframe's body
  // represents the text element container
  customCssStyles = customCssStyles.replace(
      /body\s*\{/gi, '.replace-by-text-editor {');
  customCssStyles = customCssStyles.replace(
      /html\s*\{/gi, '.replace-by-text-editor {');

  // add the styles to the editor's dom
  silexStyle.innerHTML = customCssStyles;
};


/**
 * user clicked invert bg color button
 * invert the background color of the text editor
 */
silex.view.dialog.TextEditor.prototype.onInvertColor = function(event) {
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  var bgColorStr = goog.style.getStyle(iframe, 'backgroundColor');
  var bgColorArray = goog.color.hexToRgb(goog.color.parse(bgColorStr).hex);
  var invertedArray = bgColorArray.map(color => 255 - color);
  goog.style.setStyle(iframe, 'backgroundColor', goog.color.rgbArrayToHex(invertedArray));
}


/**
 * user clicked lorem ipsum button
 * get the lorem from a lorem ipsum service
 */
silex.view.dialog.TextEditor.prototype.onLoremIpsumClick = function(event) {
  var request = new goog.net.XhrIo();
  var container = goog.dom.createElement('P');
  // add normal style
  goog.dom.classlist.add(container, 'normal');
  container.innerHTML = '<pre><i><small>Loading lorem ipsum...</small></i></pre>';
  this.textField.getRange().replaceContentsWithNode(container);
  this.contentChanged();
  //request complete callback
  goog.events.listen(request, 'complete', function() {
    var data = '';
    if (request.isSuccess()) {
      // success
      data = request.getResponseJson()[0];
    } else {
      // error: show a message in place of the lorem ipsum text
      data = 'lorem ipsum service <a href="' +
          silex.view.dialog.TextEditor.LOREM_IPSUM_SERVICE_URL +
          '">call failed</a>';
    }
    // update container
    container.innerHTML = data;
    this.contentChanged();
  }.bind(this));
  // make the call
  request.send(
      silex.view.dialog.TextEditor.LOREM_IPSUM_SERVICE_URL,
      'GET');
};


/**
 * user changed selection in the format drop down list
 */
silex.view.dialog.TextEditor.prototype.formatChanged = function(e) {
  // let time for the editor to replace the node by the desired node (P, H1,...)
  setTimeout(goog.bind(function() {
    var container = this.textField.getRange().getContainerElement();
    if (container.tagName.toLowerCase() !== 'body') {
      // cleanup, remove previous classes
      goog.dom.classlist.removeAll(
          container, ['normal', 'heading1', 'heading2', 'heading3']);
      // add the desired class
      switch (e.target.getContent()) {
        case 'Normal':
          goog.dom.classlist.add(container, 'normal');
          break;
        case 'Heading 1':
          goog.dom.classlist.add(container, 'heading1');
          break;
        case 'Heading 2':
          goog.dom.classlist.add(container, 'heading2');
          break;
        case 'Heading 3':
          goog.dom.classlist.add(container, 'heading3');
          break;
      }
    }
  }, this), 10);
};


/**
 * the content has changed, notify the controler
 */
silex.view.dialog.TextEditor.prototype.contentChanged = function() {
  this.controller.textEditorController.changed(
      this.textField.getCleanContents());
};
