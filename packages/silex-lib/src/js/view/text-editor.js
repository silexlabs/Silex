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


goog.require('silex.view.ViewBase');
goog.provide('silex.view.TextEditor');

goog.require('goog.dom');
goog.require('goog.editor.Command');
goog.require('goog.editor.Field');
goog.require('goog.editor.plugins.BasicTextFormatter');
goog.require('goog.editor.plugins.EnterHandler');
goog.require('goog.editor.plugins.HeaderFormatter');
goog.require('goog.editor.plugins.LinkBubble');
goog.require('goog.editor.plugins.LinkDialogPlugin');
goog.require('goog.editor.plugins.ListTabHandler');
goog.require('goog.editor.plugins.RemoveFormatting');
goog.require('goog.editor.plugins.SpacesTabHandler');
goog.require('goog.editor.plugins.UndoRedo');
goog.require('goog.events');
goog.require('goog.ui.editor.DefaultToolbar');
goog.require('goog.ui.editor.ToolbarController');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.text.LoremIpsum');
goog.require('goog.ui.ToolbarSeparator');
goog.require('silex.Config');



/**
 * the Silex TextEditor class
 * @constructor
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {function} cbk   callback which I'll call when the text
 *  has been changed by the user
 */
silex.view.TextEditor = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  // init the editor
  this.initUI();
  // hide the at start
  this.closeEditor();
  // handle escape key
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  shortcutHandler.registerShortcut('esc', goog.events.KeyCodes.ESC);
  goog.events.listen(
      shortcutHandler,
      goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
      goog.bind(this.closeEditor, this));
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.TextEditor, silex.view.ViewBase);


/**
 * the editable text field
 */
silex.view.TextEditor.prototype.textField;


/**
 * init the menu and UIs
 */
silex.view.TextEditor.prototype.initUI = function() {
  // Create an editable field.
  this.textField = new goog.editor.Field(
      goog.dom.getElementByClass('text-field', this.element));

  // Create and register all of the editing plugins you want to use.
  this.textField.registerPlugin(new goog.editor.plugins.BasicTextFormatter());
  this.textField.registerPlugin(new goog.editor.plugins.RemoveFormatting());
  this.textField.registerPlugin(new goog.editor.plugins.UndoRedo());
  this.textField.registerPlugin(new goog.editor.plugins.ListTabHandler());
  this.textField.registerPlugin(new goog.editor.plugins.SpacesTabHandler());
  this.textField.registerPlugin(new goog.editor.plugins.EnterHandler());
  this.textField.registerPlugin(new goog.editor.plugins.HeaderFormatter());
  this.textField.registerPlugin(new goog.editor.plugins.LinkDialogPlugin());
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
  while (formatButton.getItemCount()>0){
    formatButton.removeItemAt(0);
  }
  // add our styles
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Normal text', 'P');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Title', 'HEADER');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Subtitle', 'DIV');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Heading 1', 'H1');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Heading 2', 'H2');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Heading 3', 'H3');
  goog.ui.editor.ToolbarFactory.addFormatOption(formatButton, 'Quote', 'BLOCKQUOTE');

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
    goog.editor.Command.UNDO,
    goog.editor.Command.REDO,
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
  var generator = new goog.text.LoremIpsum();
  var button = goog.ui.editor.ToolbarFactory.makeButton('loremIpsumBtn', 'insert lorem ipsum text', 'L');
  goog.events.listen(button,
    goog.ui.Component.EventType.ACTION, function () {
      var text = generator.generateParagraph(true);
      var div = goog.dom.createElement('div');
      div.innerHTML = text;
      this.textField.getRange().replaceContentsWithNode(div);
    }, false, this);
  myToolbar.addChild(new goog.ui.ToolbarSeparator(), true);
  myToolbar.addChild(button, true);

  // Hook the toolbar into the field.
  var myToolbarController = new goog.ui.editor.ToolbarController(this.textField,
      myToolbar);

  // Watch for field changes, to display below.
  goog.events.listen(this.textField,
      goog.editor.Field.EventType.DELAYEDCHANGE,
      function() {
        this.contentChanged();
      }, false, this);

  try {
    this.textField.makeEditable();
  }
  catch (e) {
    // goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS = false;
    console.error('error catched', e);
  }

  // close button
  goog.events.listen(goog.dom.getElementByClass('close-btn', this.element),
      goog.events.EventType.CLICK,
      function() {
        this.closeEditor();
      }, false, this);
  // close on background click
  var background = goog.dom.getElementByClass('dialogs-background');
  goog.events.listen(background, goog.events.EventType.CLICK, function(e) {
    this.closeEditor();
  }, false, this);

};


/**
 * Open the editor
 * @param    {string} initialHtml    HTML to display at start
 * @param    {string} opt_bgColor    desired color for the editor background
 *            which is useful to edit white text on a black bacground for example
 */
silex.view.TextEditor.prototype.openEditor = function(initialHtml, opt_bgColor) {
  // init editable text input
  this.textField.setHtml(false, initialHtml);
  this.textField.focusAndPlaceCursorAtStart();
  // background
  var background = goog.dom.getElementByClass('dialogs-background');
  // show
  goog.style.setStyle(background, 'display', 'inherit');
  goog.style.setStyle(this.element, 'display', 'inherit');
  // editor bg color
  if (!opt_bgColor){
    opt_bgColor = '#FFFFFF';
  }
  // apply to the bg
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  iframe.style.backgroundColor = opt_bgColor;

  this.redraw();
}
/**
 * Redraw the editor, update silex styles
 */
silex.view.TextEditor.prototype.redraw = function() {
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeBody = iframeDoc.body;
  var iframeHead = iframeDoc.head;

  // get silex styles from the DOM
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_ID,
    this.headElement);
  var cssString = '';
  if (silexStyle){
    cssString = silexStyle.innerHTML;
  }

  // add Silex css to the iframe
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_ID,
    iframeHead);

  // update iframe css
  if (!silexStyle){
    silexStyle = iframeDoc.createElement('style');
    silexStyle.type = 'text/css';
    goog.dom.classes.add(silexStyle, silex.model.Head.SILEX_STYLE_ELEMENT_ID);
    goog.dom.appendChild(iframeHead, silexStyle);
  }
  silexStyle.innerHTML = cssString;
  // also set the class name on the iframe body so that it matches css rule ".text-element"
  goog.dom.classes.add(iframeBody, 'text-element');
};


/**
 * close text editor
 */
silex.view.TextEditor.prototype.closeEditor = function() {
  // background
  var background = goog.dom.getElementByClass('dialogs-background');
  // hide
  goog.style.setStyle(background, 'display', 'none');
  goog.style.setStyle(this.element, 'display', 'none');
};


/**
 * retrieve the editor html content
 * @return     {string}     the text as it is currently in the editor
 */
silex.view.TextEditor.prototype.getData = function() {
  return this.textField.getCleanContents();
};


/**
 * the content has changed, notify the controler
 */
silex.view.TextEditor.prototype.contentChanged = function() {
  if (this.onStatus) {
    this.onStatus('changed', this.getData());
  }
};
