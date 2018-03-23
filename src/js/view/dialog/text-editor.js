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
goog.require('silex.view.dialog.LinkDialogPlugin');


/**
 * the URL of the lorem ipsum service
 * @const
 * @type {string}
 */
const LOREM_IPSUM_SERVICE_URL = '//baconipsum.com/api/?type=meat-and-filler';



/**
 * the Silex TextEditor class
 * @class {silex.view.dialog.TextEditor}
 */
class TextEditor {
  /**
   * @param {!Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                               the controller instances
   */
  constructor(element, model, controller) {
    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;


    /**
     * the editable text field
     */
    this.textField = null;

    /**
     * @type {Element}
     */
    this.fontColorButtonEl = null;

    /**
     * list of custom fonts to apply when the editor opens
     */
    this.currentCustomFonts = null;

    /**
     * list of custom css styles to apply when the editor opens
     */
    this.currentCustomCssStyles = null;

    // make this a dialog
    this.modalDialog = new ModalDialog({
      element: element,
      onOpen: args => {
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

        // tag = iframeDoc.createElement('link');
        // tag.rel = 'stylesheet';
        // tag.href = silex.utils.BackwardCompat.getStaticResourceUrl('front-end.css');
        // goog.dom.appendChild(head, tag);

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
          if(this.modalDialog.isOpen && e.keyCode == goog.events.KeyCodes.ESC) {
            this.close();
          }
        });
      },
      onClose: () => {
        // needed because sometimes the color picker do not fire a change event
        this.contentChanged();
        // remove editable before it goes "display: none"
        if (!this.textField.isUneditable()) {
          this.textField.makeUneditable();
        }
      },
    });


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

    // font color button
    this.colorInput = document.createElement('input');
    this.colorInput.type = 'color';
    this.colorInput.style.position = 'absolute';
    this.colorInput.style.left = '-999px';
    document.body.appendChild(this.colorInput);

    var fontColorButton = goog.ui.editor.ToolbarFactory.makeButton(
        'fontColorButton', 'Text color', '', 'fa fa-paint-brush');
    goog.events.listen(
        fontColorButton,
        goog.ui.Component.EventType.ACTION,
        this.onFontColorClick,
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
      fontColorButton,
      goog.editor.Command.LINK,
      goog.editor.Command.UNORDERED_LIST,
      goog.editor.Command.ORDERED_LIST,
      goog.editor.Command.INDENT,
      goog.editor.Command.OUTDENT,
      goog.editor.Command.JUSTIFY_LEFT,
      goog.editor.Command.JUSTIFY_CENTER,
      goog.editor.Command.JUSTIFY_RIGHT,
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
    // keep a reference to the font color button
    this.fontColorButtonEl = fontColorButton.getContentElement();
    // keep the color of the button the same as the selection
    setInterval(() => {
      if(this.modalDialog.isOpen) this.updateFontColorButton();
    }, 1000);
  }


  /**
   * Set the value of the editor
   * @param    {string} html    HTML to display at start
   */
  setValue(html) {
    // this.textField.setSafeHtml(false, goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(html, null /* dir */));

    this.textField.getElement().innerHTML = html;

    // we loose foxus shortly after open
    this.getFocus();
    setTimeout(() => this.getFocus(), 250);
    setTimeout(() => this.getFocus(), 500);
  }

  getFocus() {
    if(this.modalDialog.isOpen) {
      this.textField.focus();
    }
  }

  /**
   * add class names to the iframe inside the editor
   * @param    {string} elementClassNames , css classes of the element being edited
   *                    so that css rules apply in the editor too
   */
  setElementClassNames(elementClassNames) {
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
  }


  /**
   * Set the editor bg color
   * @param    {?string=} opt_bgColor    desired color for the editor background
   *           which is useful to edit white text on a black bacground for example
   */
  setBackgroundColor(opt_bgColor) {
    // editor bg color
    if (!opt_bgColor) {
      opt_bgColor = '#FFFFFF';
    }
    // apply to the bg
    var iframe = goog.dom.getElementsByTagNameAndClass(
        'iframe', null, this.element)[0];

    goog.style.setStyle(iframe, 'backgroundColor', opt_bgColor);
  }


  /**
   * Open the editor
   */
  open() {
    this.modalDialog.open();
  }


  /**
   * Close the editor
   */
  close() {
    this.modalDialog.close();
  }


  /**
   * set the list of custom fonts
   * @param {Array.<{name:string, href:string}>} customFonts ,
   *                                      the custom fonts used in the text fields
   */
  setCustomFonts(customFonts) {
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
  }


  /**
   * set the list of custom css styles
   * @param {string} customCssStyles  the styles
   *                                  written by the user in the css editor
   */
  setCustomCssStyles(customCssStyles) {
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
  onInvertColor(event) {
    var iframe = goog.dom.getElementsByTagNameAndClass('iframe', null, this.element)[0];
    var bgColorStr = goog.style.getStyle(iframe, 'backgroundColor');
    var bgColorArray = goog.color.hexToRgb(goog.color.parse(bgColorStr).hex);
    var invertedArray = bgColorArray.map(color => 255 - color);
    goog.style.setStyle(iframe, 'backgroundColor', goog.color.rgbArrayToHex(invertedArray));
  }


  getColorContainer() {
    const container = this.textField.getRange().getContainer();
    /*
    const range = this.textField.getRange();
    const startNode = this.textField.getRange().getStartNode();
    const container = startNode.nextElementSibling == null ? startNode : startNode.nextElementSibling;
    */
    // when the body is selected and has only one child, then this is the container we want
    // happens when we already enclosed the content in a span
    if(container.nodeName.toLowerCase() === 'body' && container.childNodes.length === 1) {
      return container.childNodes[0];
    }
    return container;
  }

  /**
   * update the font color button in the toolbar
   * return {string} color in rgb(rr, gg, bb) format
   */
  updateFontColorButton() {
    const container = this.getColorContainer();
    let color = '#000000';
    if(container && container.style && container.style.color) {
      color = container.style.color;
    }
    else if (container) {
      const el = /** @type {Element} */ (container.nodeType === goog.dom.NodeType.ELEMENT ? container : container.parentElement);
      if(el) color = window.getComputedStyle(el).color;
    }
    // apply the color input and the button to the selection color
    // update the button color in the tool bar
    this.fontColorButtonEl.style.color = color;
    return color;
  }


  /**
   * user clicked font color button
   */
  onFontColorClick(event) {
    // this.colorInput.focus();
    const color = this.updateFontColorButton();
    // update the color picker to match the value
    // here we need to convert from rgb to hex because color picker is hex and element.style.color is rgb
    this.colorInput.value = silex.utils.Style.rgbToHex(color);
    // open the browser's color picker
    this.colorInput.click();
    this.colorInput.onchange = e => {
      let container = this.getColorContainer();
      // enclose the body into a span, do not apply color to it directly
      // same for a simple text nodes
      if(container.nodeName.toLowerCase() === 'body' || container.nodeType === goog.dom.NodeType.TEXT) {
        container = document.createElement('span');
        this.textField.getRange().surroundContents(container);
      }
      container.style.color = this.colorInput.value;
      this.colorInput.onchange = null;
      this.contentChanged();
    }
  }


  /**
   * user clicked lorem ipsum button
   * get the lorem from a lorem ipsum service
   */
  onLoremIpsumClick(event) {
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
            LOREM_IPSUM_SERVICE_URL +
            '">call failed</a>';
      }
      // update container
      container.innerHTML = data;
      this.contentChanged();
    }.bind(this));
    // make the call
    request.send(
        LOREM_IPSUM_SERVICE_URL,
        'GET');
  }


  /**
   * user changed selection in the format drop down list
   */
  formatChanged(e) {
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
  }


  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    this.controller.textEditorController.changed(
        this.textField.getCleanContents());
  }
}

