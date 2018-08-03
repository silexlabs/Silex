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
 * @fileoverview The format pane is displayed in the property panel on the right.
 * It uses the wysihtml library to change text format
 *
 */

goog.provide('silex.view.pane.FormatPane');

class FormatPane extends silex.view.pane.PaneBase {

  /**
   *
   * @param {Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                  the controller instances
   */
  constructor(element, model, controller) {
    super(element, model, controller);

    // tracker for analytics
    this.tracker = silex.service.Tracker.getInstance();

    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;
    /** @type {?Array.<Element>} */
    this.selectedElements = null;
    /** @type {?Element} */
    this.currentTextBox = null;
    this.wysihtmlEditor = null;

    // Build the UI
    this.toolbar = this.element.querySelector('#wysihtml5-toolbar');

    // for event add / remove
    this.onKeyPressedBinded = this.onKeyPressed.bind(this);
  }


  /**
   * check if user pressed esc key
   */
  onKeyPressed(e) {
    e = e || window.event;
    if (e.keyCode == 27) this.stopEditing();
  }


  /**
   * stop edit, destroy wysihtml object and reset everything
   */
  stopEditing() {
    if(this.wysihtmlEditor) {
      // remove event listener
      this.model.file.getContentDocument().removeEventListener('keydown', this.onKeyPressedBinded);
      // remove and put back the whole UI
      // this is the way to go with wysihtml
      // @see https://github.com/Voog/wysihtml/issues/109#issuecomment-198350743
      this.wysihtmlEditor.destroy();
      this.wysihtmlEditor = null;
      const parent = this.toolbar.parentNode;
      const clone = this.toolbar.cloneNode(true);
      Array.from(clone.querySelectorAll('.wysihtml-command-active'))
      .forEach(el => el.classList.remove('wysihtml-command-active'));
      parent.insertBefore(clone, this.toolbar);
      parent.removeChild(this.toolbar);
      this.toolbar = clone;
      // reset focus
      silex.model.Body.resetFocus();
      this.model.file.getContentDocument()['getSelection']().removeAllRanges(); // use array acces for getSelection as a workaround for google closure warning 'Property getSelection never defined on Document'
      // cleanup
      const editable = this.model.element.getContentNode(this.currentTextBox);
      editable.removeAttribute('contentEditable');
      editable.classList.remove('wysihtml-sandbox', 'wysihtml-editor');
      this.currentTextBox.classList.remove('text-editor-focus');
      this.currentTextBox.onclick = null;
      this.currentTextBox = null;
    }
    this.element.classList.remove('text-editor-editing');
  }


  startEditing() {
    // edit the style of the selection
    if(this.selectedElements.length === 1) {
      const newTextBox = this.selectedElements[0];
      if(newTextBox != this.currentTextBox) {
        this.currentTextBox = newTextBox;
        const editable = this.model.element.getContentNode(this.currentTextBox);
        const options = {
          'toolbar': this.toolbar,
          'handleTables': false,
          'parserRules': {
            'tags': {
              'b': {},
              'strong': {
                'rename_tag': 'b'
              },
              'i': {},
              'br': {},
              'p': {},
              'h1': {},
              'h2': {},
              'h3': {},
              'h4': {},
              'h5': {},
              'h6': {},
              'ul': {},
              'ol': {},
              'li': {},
              'a': {},
              'img': {},
              'font': {
                'rename_tag': 'span',
                'add_class': {
                    'size': 'size_font'
                }
              },
            }
          }
        };
        this.wysihtmlEditor = new wysihtml.Editor(editable, options);
        // CSS classes
        this.currentTextBox.classList.add('text-editor-focus');
        this.element.classList.add('text-editor-editing');
        // handle the focus
        this.model.file.getContentDocument().addEventListener('keydown', this.onKeyPressedBinded);
        this.currentTextBox.onclick = e => {
          if(e.target === this.currentTextBox) {
            this.stopEditing();
          }
        };
        this.wysihtmlEditor.on('load', () => {
          this.wysihtmlEditor.focus(false);
          setTimeout(() => this.wysihtmlEditor.focus(false), 250);
          setTimeout(() => this.wysihtmlEditor.focus(false), 500);
        });
        // debug
        window['wysihtmlEditor'] = this.wysihtmlEditor;
      }
    }
    else {
      console.error('Error, can not edit selection with format pane', this.selectedElements);
    }
  }


  /**
   * redraw the properties
   * @param   {Array.<Element>} selectedElements the elements currently selected
   * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
   * @param   {string}  currentPageName   the name of the current page
   */
  redraw(selectedElements, pageNames, currentPageName) {
    super.redraw(selectedElements, pageNames, currentPageName);

    // reuse selectedElements in combo box on change
    this.selectedElements = selectedElements;

    // stop editing, even if we may not be editing right now
    this.stopEditing();
  }
}
