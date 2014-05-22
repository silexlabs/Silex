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

goog.require('silex.view.dialog.DialogBase');
goog.require('silex.view.dialog.LinkDialogPlugin');

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
  this.textField.registerPlugin(new goog.editor.plugins.UndoRedo());
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
  while (formatButton.getItemCount()>0){
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
  goog.events.listen(formatButton,
    goog.ui.Component.EventType.ACTION, function (e) {
      // let time for the editor to replace the node by the desired node (P, H1, H2...)
      setTimeout(goog.bind(function(){
        var container = this.textField.getRange().getContainerElement();
        if (container.tagName.toLowerCase() !== 'body'){
          // cleanup, remove previous classes
          var allClasses = ['normal', 'title', 'heading1', 'heading2', 'heading3'];
          goog.dom.classes.addRemove(container, allClasses);
          // add the desired class
          switch(e.target.getContent()){
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
    }, false, this);


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
      var container = goog.dom.createElement('P');
      // add normal style
      goog.dom.classes.add(container, 'normal');
      container.innerHTML = text;
      this.textField.getRange().replaceContentsWithNode(container);
      this.contentChanged();
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
/*
        // prevent text only
        var content = this.textField.getEditableIframe().contentDocument.body;
        for (var idx in content.childNodes){
          if (content.childNodes[idx].nodeType === 3){
            content.innerHTML = '<P class="normal">'+content.innerHTML+'<P>';
            break;
          }
        }
*/
        // notify the controller
        this.contentChanged();
      }, false, this);

  try {
    this.textField.makeEditable();
  }
  catch (e) {
    // to prevent this bug: goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS = false;
    console.error('error catched', e);
  }
  // prevent the body of the editor from having an image as background, and bg color
  // this would screw up everything in some cases, e.g. body{background-image: ...} in silex custom styles
  // this.resetBodyStyles();
};


/**
 * Open the editor
 * @param    {string} initialHtml    HTML to display at start
 * @param    {string} elementClassName    css classes of the element being edited,
 *                                               so that css rules apply in the editor too
 * @param    {string} opt_bgColor    desired color for the editor background
 *            which is useful to edit white text on a black bacground for example
 */
silex.view.dialog.TextEditor.prototype.openEditor = function(initialHtml, elementClassName, opt_bgColor) {
  // call super
  goog.base(this, 'openEditor');
  // init editable text input
  this.textField.setHtml(false, initialHtml);
  this.textField.focusAndPlaceCursorAtStart();
  // editor bg color
  if (!opt_bgColor){
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
  iframeDoc.getElementsByTagName("html")[0].className = elementClassName;
  // body represents the '.silex-element-content' element of Silex text elements
  // so it has these classes: 'silex-element-content normal'
  iframeDoc.body.className = 'silex-element-content normal';
}


/**
 * set the list of custom fonts
 * @param {Array<string>} the custom fonts used in the text fields
 */
silex.view.dialog.TextEditor.prototype.setCustomFonts = function(customFonts) {
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  if (!iframe){
    // iframe not yet defined, the text editor is loading
    setTimeout(goog.bind(function(){this.setCustomFonts(customFonts);}, this), 100);
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
 * set the list of custom css styles
 * @param {string} customCssStyles   the styles written by the user in the css editor
 */
silex.view.dialog.TextEditor.prototype.setCustomCssStyles = function(customCssStyles) {
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  if (!iframe){
    // iframe not yet defined, the text editor is loading
    setTimeout(goog.bind(function(){this.setCustomCssStyles(customCssStyles);}, this), 100);
    return;
  }

  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeHead = iframeDoc.head;
  // add Silex css to the iframe
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
    iframeHead);
  // update iframe css
  if (!silexStyle){
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
 * the content has changed, notify the controler
 */
silex.view.dialog.TextEditor.prototype.contentChanged = function() {
  this.controller.textEditorController.changed(this.textField.getCleanContents());
};


/**
 * set the list of css styles to reset all properties of body
 * this is to prevent the body style from silex custom styles from being applyed to the text editor
 */
 /* Do not work, because body is supposed to be styled as the text element
silex.view.dialog.TextEditor.prototype.resetBodyStyles = function() {
  // get the iframe document
  var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeHead = iframeDoc.head;
  var iframeBody = iframeDoc.body;
  // reset body style
  iframeBody.className = "reset-all";
  // define the reset style
  var resetStyles =  "\
    .reset-all {\
        animation : none !important;\
        animation-delay : 0 !important;\
        animation-direction : normal !important;\
        animation-duration : 0 !important;\
        animation-fill-mode : none !important;\
        animation-iteration-count : 1 !important;\
        animation-name : none !important;\
        animation-play-state : running !important;\
        animation-timing-function : ease !important;\
        backface-visibility : visible !important;\
        background : 0 !important;\
        background-attachment : scroll !important;\
        background-clip : border-box !important;\
        background-color : transparent !important;\
        background-image : none !important;\
        background-origin : padding-box !important;\
        background-position : 0 0 !important;\
        background-position-x : 0 !important;\
        background-position-y : 0 !important;\
        background-repeat : repeat !important;\
        background-size : auto auto !important;\
        border : 0 !important;\
        border-style : none !important;\
        border-width : medium !important;\
        border-color : inherit !important;\
        border-bottom : 0 !important;\
        border-bottom-color : inherit !important;\
        border-bottom-left-radius : 0 !important;\
        border-bottom-right-radius : 0 !important;\
        border-bottom-style : none !important;\
        border-bottom-width : medium !important;\
        border-collapse : separate !important;\
        border-image : none !important;\
        border-left : 0 !important;\
        border-left-color : inherit !important;\
        border-left-style : none !important;\
        border-left-width : medium !important;\
        border-radius : 0 !important;\
        border-right : 0 !important;\
        border-right-color : inherit !important;\
        border-right-style : none !important;\
        border-right-width : medium !important;\
        border-spacing : 0 !important;\
        border-top : 0 !important;\
        border-top-color : inherit !important;\
        border-top-left-radius : 0 !important;\
        border-top-right-radius : 0 !important;\
        border-top-style : none !important;\
        border-top-width : medium !important;\
        bottom : auto !important;\
        box-shadow : none !important;\
        box-sizing : content-box !important;\
        caption-side : top !important;\
        clear : none !important;\
        clip : auto !important;\
        color : inherit !important;\
        columns : auto !important;\
        column-count : auto !important;\
        column-fill : balance !important;\
        column-gap : normal !important;\
        column-rule : medium none currentColor !important;\
        column-rule-color : currentColor !important;\
        column-rule-style : none !important;\
        column-rule-width : none !important;\
        column-span : 1 !important;\
        column-width : auto !important;\
        content : normal !important;\
        counter-increment : none !important;\
        counter-reset : none !important;\
        cursor : auto !important;\
        direction : ltr !important;\
        display : inline !important;\
        empty-cells : show !important;\
        float : none !important;\
        font : normal !important;\
        font-family : inherit !important;\
        font-size : medium !important;\
        font-style : normal !important;\
        font-variant : normal !important;\
        font-weight : normal !important;\
        height : auto !important;\
        hyphens : none !important;\
        left : auto !important;\
        letter-spacing : normal !important;\
        line-height : normal !important;\
        list-style : none !important;\
        list-style-image : none !important;\
        list-style-position : outside !important;\
        list-style-type : disc !important;\
        margin : 0 !important;\
        margin-bottom : 0 !important;\
        margin-left : 0 !important;\
        margin-right : 0 !important;\
        margin-top : 0 !important;\
        max-height : none !important;\
        max-width : none !important;\
        min-height : 0 !important;\
        min-width : 0 !important;\
        opacity : 1 !important;\
        orphans : 0 !important;\
        outline : 0 !important;\
        outline-color : invert !important;\
        outline-style : none !important;\
        outline-width : medium !important;\
        overflow : visible !important;\
        overflow-x : visible !important;\
        overflow-y : visible !important;\
        padding : 0 !important;\
        padding-bottom : 0 !important;\
        padding-left : 0 !important;\
        padding-right : 0 !important;\
        padding-top : 0 !important;\
        page-break-after : auto !important;\
        page-break-before : auto !important;\
        page-break-inside : auto !important;\
        perspective : none !important;\
        perspective-origin : 50% 50% !important;\
        position : static !important;\
        /* May need to alter quotes for different locales (e.g fr) * !important/\
        quotes : '\201C' '\201D' '\2018' '\2019' !important;\
        right : auto !important;\
        tab-size : 8 !important;\
        table-layout : auto !important;\
        text-align : inherit !important;\
        text-align-last : auto !important;\
        text-decoration : none !important;\
        text-decoration-color : inherit !important;\
        text-decoration-line : none !important;\
        text-decoration-style : solid !important;\
        text-indent : 0 !important;\
        text-shadow : none !important;\
        text-transform : none !important;\
        top : auto !important;\
        transform : none !important;\
        transform-style : flat !important;\
        transition : none !important;\
        transition-delay : 0s !important;\
        transition-duration : 0s !important;\
        transition-property : none !important;\
        transition-timing-function : ease !important;\
        unicode-bidi : normal !important;\
        vertical-align : baseline !important;\
        visibility : visible !important;\
        white-space : normal !important;\
        widows : 0 !important;\
        width : auto !important;\
        word-spacing : normal !important;\
        z-index : auto !important;\
     }\
  ";
  // add the style to head section
  var element = iframeDoc.createElement('style');
  element.type = 'text/css';
  goog.dom.appendChild(iframeHead, element);
  element.innerHTML = resetStyles;
};
/* */
