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
 * @fileoverview The text editor is displayed when the user
 *   needs to edit rich text.
 * It is based on google rich text editor
 *
 */

goog.provide('silex.view.dialog.TextEditor');

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
goog.require('goog.text.LoremIpsum');
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
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.dialog.TextEditor = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);
};

// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.TextEditor, silex.view.dialog.DialogBase);


/**
 * the editable text field
 */
silex.view.dialog.TextEditor.prototype.textField = null;


/**
 * init the menu and UIs
 */
silex.view.dialog.TextEditor.prototype.initUI = function() {
  // call super
  goog.base(this, 'initUI');

  // Create an editable field.
  this.textField = new goog.editor.Field(
      goog.dom.getElementByClass('text-field', this.element));

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
  for (var fontName in availableFonts) {
    goog.ui.editor.ToolbarFactory.addFont(fontFaceButton,
        fontName,
        availableFonts[fontName].value);
  }

  // add font sizes
  var fontSizeButton = goog.ui.editor.DefaultToolbar.makeBuiltInToolbarButton(
      goog.editor.Command.FONT_SIZE);
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '1', '1');
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '2', '2');
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '3', '3');
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '4', '4');
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '5', '5');
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '6', '6');
  goog.ui.editor.ToolbarFactory.addFontSize(fontSizeButton, '7', '7');

  var formatButton = goog.ui.editor.DefaultToolbar.makeBuiltInToolbarButton(
      goog.editor.Command.FORMAT_BLOCK);
  while (formatButton.getItemCount() > 0) {
    formatButton.removeItemAt(0);
  }
  // add our styles
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Normal', 'P');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Title', 'HEADER');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Heading 1', 'H1');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Heading 2', 'H2');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Heading 3', 'H3');

  // apply a class when the format changes
  // silex convention is ".normal" class for "Normal" style
  goog.events.listen(formatButton, goog.ui.Component.EventType.ACTION, this.formatChanged, false, this);


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
  var myToolbar = goog.ui.editor.DefaultToolbar.makeToolbar(buttons,
      goog.dom.getElementByClass('toolbar', this.element));

  // lorem ipsum button
  var button = goog.ui.editor.ToolbarFactory.makeButton('loremIpsumBtn', 'insert lorem ipsum text', 'L');
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, this.onLoremIpsumClick, false, this);
  myToolbar.addChild(new goog.ui.ToolbarSeparator(), true);
  myToolbar.addChild(button, true);

  // Hook the toolbar into the field.
  var myToolbarController = new goog.ui.editor.ToolbarController(this.textField, myToolbar);

  // Watch for field changes, to display below.
  // notify the controller
  goog.events.listen(this.textField, goog.editor.Field.EventType.DELAYEDCHANGE, this.contentChanged, false, this);

  /* This appears to bug in firefox, because at this stage the text field is display: none
  try {
    this.textField.makeEditable();
  }
  catch (e) {
    // to prevent this bug: goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS = false;
    console.error('error catched', e);
  }
  */

};


/**
 * Open the editor
 * @param    {string} initialHtml    HTML to display at start
 * @param    {string} elementClassName    css classes of the element being edited,
 *                                               so that css rules apply in the editor too
 * @param    {string=} opt_bgColor    desired color for the editor background
 *            which is useful to edit white text on a black bacground for example
 */
silex.view.dialog.TextEditor.prototype.openEditor = function(initialHtml, elementClassName, opt_bgColor) {
  // call super
  goog.base(this, 'openEditor');

  // make the text field editable after it is made "display: block"
  this.textField.makeEditable();
  // init editable text input
  this.textField.setHtml(false, initialHtml);
  this.textField.focusAndPlaceCursorAtStart();
  // editor bg color
  if (!opt_bgColor) {
    opt_bgColor = '#FFFFFF';
  }
  // apply to the bg
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  // get the iframe document
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  iframe.style.backgroundColor = opt_bgColor;
  // apply css classes of the element
  // apply it on <html> tag instead of body,
  // because body represents the '.silex-element-content' element of Silex text elements
  // so it has these classes: 'silex-element-content normal'
  iframeDoc.getElementsByTagName('html')[0].className = elementClassName;
  // body represents the '.silex-element-content' element of Silex text elements
  // so it has these classes: 'silex-element-content normal'
  iframeDoc.body.className = 'silex-element-content normal';
  // handle current css styles
  if (this.currentCustomCssStyles) {
    this.setCustomCssStyles(this.currentCustomCssStyles);
  }
  // handle current fonts
  if (this.currentCustomFonts) {
    this.setCustomFonts(this.currentCustomFonts);
  }
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
 * @param {Array<string>} the custom fonts used in the text fields
 */
silex.view.dialog.TextEditor.prototype.setCustomFonts = function(customFonts) {
  // store for later use
  this.currentCustomFonts = customFonts;
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  if (!iframe) {
    // iframe not yet defined, the text editor is loading
    return;
  }
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeHead = iframeDoc.head;
  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByClass(silex.model.Head.CUSTOM_FONTS_CSS_CLASS, iframeHead);
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
 * @param {string} customCssStyles   the styles written by the user in the css editor
 */
silex.view.dialog.TextEditor.prototype.setCustomCssStyles = function(customCssStyles) {
  // store for later use
  this.currentCustomCssStyles = customCssStyles;
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  if (!iframe) {
    // iframe not yet defined, the text editor is loading
    return;
  }

  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeHead = iframeDoc.head;
  // add Silex css to the iframe
  var silexStyle = goog.dom.getElementByClass(
      silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
      iframeHead);
  // update iframe css
  if (!silexStyle) {
    silexStyle = iframeDoc.createElement('style');
    silexStyle.type = 'text/css';
    goog.dom.classes.add(silexStyle, silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS);
    goog.dom.appendChild(iframeHead, silexStyle);
  }
  // remove the styles which apply to body
  // because the text editor's iframe's body represents the text element container
  customCssStyles = customCssStyles.replace(/body\s*\{/gi, '.replace-by-text-editor {');
  customCssStyles = customCssStyles.replace(/html\s*\{/gi, '.replace-by-text-editor {');

  // add the styles to the editor's dom
  silexStyle.innerHTML = customCssStyles;
};


/**
 * user clicked lorem ipsum button
 */
silex.view.dialog.TextEditor.prototype.onLoremIpsumClick = function(e) {
  var generator = new goog.text.LoremIpsum();
  var text = generator.generateParagraph(true);
  var container = goog.dom.createElement('P');
  // add normal style
  goog.dom.classes.add(container, 'normal');
  container.innerHTML = text;
  this.textField.getRange().replaceContentsWithNode(container);
  this.contentChanged();
};


/**
 * user changed selection in the format drop down list
 */
silex.view.dialog.TextEditor.prototype.formatChanged = function(e) {
  // let time for the editor to replace the node by the desired node (P, H1, H2...)
  setTimeout(goog.bind(function() {
    var container = this.textField.getRange().getContainerElement();
    if (container.tagName.toLowerCase() !== 'body') {
      // cleanup, remove previous classes
      var allClasses = ['normal', 'title', 'heading1', 'heading2', 'heading3'];
      goog.dom.classes.addRemove(container, allClasses);
      // add the desired class
      switch (e.target.getContent()) {
        case 'Normal':
          goog.dom.classes.add(container, 'normal');
          break;
        case 'Title':
          goog.dom.classes.add(container, 'title');
          break;
        case 'Heading 1':
          goog.dom.classes.add(container, 'heading1');
          break;
        case 'Heading 2':
          goog.dom.classes.add(container, 'heading2');
          break;
        case 'Heading 3':
          goog.dom.classes.add(container, 'heading3');
          break;
      }
    }
  }, this), 10);
};


/**
 * the content has changed, notify the controler
 */
silex.view.dialog.TextEditor.prototype.contentChanged = function() {
  this.controller.textEditorController.changed(this.textField.getCleanContents());
};
