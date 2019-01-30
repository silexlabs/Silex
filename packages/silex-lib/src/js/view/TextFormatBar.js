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
 * @fileoverview
 *   This class handle a div positioned on top of the selected text in a text box
 *   It uses the wysihtml library to change text format
 */


goog.provide('silex.view.TextFormatBar');
goog.require('silex.view.dialog.LinkDialog');


/**
 * @class {silex.view.TextFormatBar}
 */
silex.view.TextFormatBar = class {
  /**
   *
   * @param {Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                  the controller instances
   */
  constructor(element, model, controller) {
    // tracker for analytics
    this.tracker = silex.service.Tracker.getInstance();

    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;
    /** @type {?Array.<Element>} */
    this.selectedElements = null;
    /** @type {?Array.<string>} */
    this.pageNames = null;
    /** @type {?string} */
    this.currentPageName = null;
    /** @type {?Element} */
    this.currentTextBox = null;
    this.wysihtmlEditor = null;
    this.linkDialog = new silex.view.dialog.LinkDialog(element, model);

    this.toolbar = this.element.querySelector('#wysihtml5-toolbar');

    // for event add / remove
    this.onKeyPressedBinded = this.onKeyPressed.bind(this);
    this.onScrollBinded = this.onScroll.bind(this);
  }


  /**
   * Intercept keys before it is forwarded from iframe to Silex
   */
  onKeyPressed(e) {
    e = e || window.event;
    if (e.key === 'Escape') {
      // stop editing but keep selection
      this.stopEditing();
      e.preventDefault();
    }
  }
  onScroll(e) {
    this.controller.textEditorController.attachToTextBox(this.currentTextBox, this.element);
  }


  /**
   * stop edit, destroy wysihtml object and reset everything
   */
  stopEditing() {
    if(this.wysihtmlEditor) {
      const doc = this.model.file.getContentDocument();
      const win = this.model.file.getContentWindow();
      // remove event listener
      doc.removeEventListener('keydown', this.onKeyPressedBinded);
      win.removeEventListener('scroll', this.onScrollBinded);
      // remove and put back the whole UI
      // this is the way to go with wysihtml
      // @see https://github.com/Voog/wysihtml/issues/109#issuecomment-198350743
      this.element.querySelector('.image-details').style.display = 'none';
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
      doc['getSelection']().removeAllRanges(); // use array acces for getSelection as a workaround for google closure warning 'Property getSelection never defined on Document'
      // cleanup
      const editable = this.model.element.getContentNode(this.currentTextBox);
      editable.removeAttribute('contenteditable');
      editable.classList.remove('wysihtml-sandbox', 'wysihtml-editor');
      this.currentTextBox.classList.remove('text-editor-focus');
      this.currentTextBox.removeAttribute('data-allow-silex-shortcuts');
      this.currentTextBox.onclick = null;
      this.currentTextBox = null;
    }
    this.element.classList.remove('text-editor-editing');
  }

  /**
   * @param {FileExplorer} fileExplorer
   */
  startEditing(fileExplorer) {
    const doc = this.model.file.getContentDocument();
    const win = this.model.file.getContentWindow();
    // edit the style of the selection
    if(this.selectedElements.length === 1) {
      const newTextBox = this.selectedElements[0];
      if(newTextBox != this.currentTextBox) {
        this.currentTextBox = newTextBox;
        // this.currentTextBox.insertBefore(this.element, this.currentTextBox.firstChild);
        this.controller.textEditorController.attachToTextBox(this.currentTextBox, this.element);

        const editable = this.model.element.getContentNode(this.currentTextBox);
        const options = {
          'toolbar': this.toolbar,
          'handleTables': false,
          'useLineBreaks': false,
          'classes': {
            'wysiwyg-float-left': 1, // this doesnt work for some reason
            'wysiwyg-float-right': 1, // this doesnt work for some reason
          },
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
              'u': {},
              'ol': {},
              'li': {},
              'a': {
                'check_attributes': {
                  'href': 'href',
                  'download': 'href',
                  'target': 'any',
                  'title': 'any',
                  'type': 'any',
                },
              },
              'img': {
                'check_attributes': {
                  'src': 'src',
                  'alt': 'alt',
                  'title': 'any',
                  'width': 'any',
                  'height': 'any',
                  'class': 'any', // this should not be necessary, workaround
                },
              },
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
        this.currentTextBox.setAttribute('data-allow-silex-shortcuts', true);
        this.element.classList.add('text-editor-editing');
        // handle the focus
        doc.addEventListener('keydown', this.onKeyPressedBinded);
        win.addEventListener('scroll', this.onScrollBinded);
        this.currentTextBox.onclick = e => {
          if(e.target === this.currentTextBox) {
            this.stopEditing();
          }
        };

        this.wysihtmlEditor.on('load', () => {
          this.wysihtmlEditor.focus(false);
          setTimeout(() => {if(this.wysihtmlEditor) this.wysihtmlEditor.focus(false)}, 250);
          setTimeout(() => {if(this.wysihtmlEditor) this.wysihtmlEditor.focus(false)}, 500);

          this.element.querySelector('.insert-image').onclick = e => {
            this.tracker.trackAction('controller-events', 'request', 'insert.image.text', 0);
            fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
              .then(fileInfo => {
                if(fileInfo) {
                  // undo checkpoint
                  this.controller.textEditorController.undoCheckPoint();
                  this.wysihtmlEditor.composer.commands.exec('insertImage', { src: fileInfo.absPath, alt: '' })
                  this.tracker.trackAction('controller-events', 'success', 'insert.image.text', 1);
                }
              })
              .catch(error => {
                silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
                this.tracker.trackAction('controller-events', 'error', 'insert.image.text', -1);
              });
          };

          // image details UI
          const imageDetails = this.element.querySelector('.image-details');
          const autoBtn = imageDetails.querySelector('#auto-submit-image');
          function autoSubmitImage(e) {
            // give time to the value to be updated and validate wysihtml image dialog
            setTimeout(_ => {
              autoBtn.click();
              imageDetails.style.display = '';
              e.target.focus();
            }, 100);
          }
          imageDetails.querySelector('.float').onchange = e => autoSubmitImage(e);
          imageDetails.querySelector('.src').onkeydown = e => autoSubmitImage(e);
          imageDetails.querySelector('.alt').onkeydown = e => autoSubmitImage(e);

          this.element.querySelector('.create-link').onclick = e => {
            // open link editor
            this.linkDialog.open(this.wysihtmlEditor, this.pageNames);

            // prevent click on the button
            e.preventDefault();
          };
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
    // reuse selectedElements in combo box on change
    this.selectedElements = selectedElements;

    // reuse pageNames in combo box on change
    this.pageNames = pageNames;
    this.currentPageName = currentPageName;

    // stop editing, even if we may not be editing right now
    this.stopEditing();
  }

};

