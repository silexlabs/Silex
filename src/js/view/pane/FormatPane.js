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
 // TODO:
 // * keyboard shoortcuts => filter del, enter, ...
 // * tooltips on button bar (A => link)
 // * ? link target = just "in a new tab"
 // * ? image float
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
    /** @type {?Array.<string>} */
    this.pageNames = null;
    /** @type {?string} */
    this.currentPageName = null;
    /** @type {?Element} */
    this.currentTextBox = null;
    this.wysihtmlEditor = null;

    // Build the UI
    this.toolbar = this.element.querySelector('#wysihtml5-toolbar');

    // for event add / remove
    this.onKeyPressedBinded = this.onKeyPressed.bind(this);
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


  /**
   * stop edit, destroy wysihtml object and reset everything
   */
  stopEditing() {
    if(this.wysihtmlEditor) {
      const doc = this.model.file.getContentDocument();
      // remove event listener
      doc.removeEventListener('keydown', this.onKeyPressedBinded);
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
    // edit the style of the selection
    if(this.selectedElements.length === 1) {
      const newTextBox = this.selectedElements[0];
      if(newTextBox != this.currentTextBox) {
        this.currentTextBox = newTextBox;
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
        this.currentTextBox.onclick = e => {
          if(e.target === this.currentTextBox) {
            this.stopEditing();
          }
        };

        const LINK_ATTRIBUTES =  ['href', 'rel', 'target', 'type', 'title', 'download'];
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
                  this.controller.propertyToolController.undoCheckPoint();
                  this.wysihtmlEditor.composer.commands.exec('insertImage', { src: fileInfo.absPath, alt: 'this is an image' })
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
            // get link current values
            const linkData = LINK_ATTRIBUTES
            .reduce((acc, attr) => {
              const el = this.element.querySelector('.get-' + attr);
              if(!el) {
                console.error('could not get data from link editor for attribute', attr);
              }
              else {
                acc[attr] = el.value;
              }
              return acc;
            }, {});

            // external link data
            const isExternal = !linkData['href'].startsWith('#!');

            // prompt
            silex.utils.Notification.prompt('Link editor', 'unused', (accept, unused) => {
              if(accept) {
                // get new values
                const newData = LINK_ATTRIBUTES
                .reduce((acc, attr) => {
                  const el = dialogBody.querySelector('.' + attr);
                  if(!el) {
                    console.error('could not get data from wysihtml for attribute', attr);
                  }
                  else {
                    acc[attr] = el.value;
                  }
                  return acc;
                }, {});

                // internal link info
                const newIsExternal = dialogBody.querySelector('#link-editor-external').checked;
                const page = dialogBody.querySelector('.page').value;

                const options = { 'href': newIsExternal ? newData['href'] : page };
                if(newData['target'] != '') options.target = newData['target'];
                if(newData['rel'] != '') options.rel = newData['rel'];
                if(newData['title'] != '') options.title = newData['title'];
                if(newData['type'] != '') options.type = newData['type'];
                if(newData['download'] != '') options.download = newData['download'];

                this.wysihtmlEditor.composer.commands.exec('createLink', options);
              }
            });

            // add a remove link button
            const dialogButtons = silex.utils.Notification.getFormButtons();
            const fragmentButtons = document.createElement('fragment');
            fragmentButtons.innerHTML = `
              <button class=wyg-float-right": 1,alertify-button alertify-button-remove">remove link</button>
            `;
            dialogButtons.insertBefore(fragmentButtons, dialogButtons.childNodes[0]);
            dialogButtons.querySelector('.alertify-button-remove')
            .onclick = (e => {
              silex.utils.Notification.close();
              this.wysihtmlEditor.composer.commands.exec('removeLink');
            });

            // add info about the link
            const dialogBody = silex.utils.Notification.getFormBody();
            dialogBody.innerHTML = `
              <section class="link-editor">
                <div class="labels">
                  <label for="link-editor-external" title="External Link" class="link-editor-tab-label first-button fa fa-lg fa-link${ isExternal ? ' checked ' : '' }"></label>
                  <label for="link-editor-internal" title="Link to a page" class="link-editor-tab-label last-button fa fa-lg fa-file"${ isExternal ? '' : ' checked ' }></label>
                </div>
                <input autocomplete="nope" id="link-editor-external" class="link-editor-radio" type="radio" name="link-editor-tab-group"${ isExternal ? ' checked ' : '' }/>
                <div class="link-editor-tab link-editor-tab-external">
                  <div class="link-editor-tab-container">
                    <label for="link-editor-href">External link</label>
                    <input autocomplete="nope" id="link-editor-href" class="alertify-text href tabbed" type="url" value="${ isExternal ? linkData['href'] : '' }">
                    <select autocomplete="nope" id="link-editor-target" class="alertify-text target">
                      <option${ linkData['target'] === '' ? ' selected ' : ''} value=""></option>
                      <option${ linkData['target'] === '_self' ? ' selected ' : ''} value="_self">_self</option>
                      <option${ linkData['target'] === '_blank' ? ' selected ' : ''} value="_blank">_blank</option>
                      <option${ linkData['target'] === '_parent' ? ' selected ' : ''} value="_parent">_parent</option>
                      <option${ linkData['target'] === '_top' ? ' selected ' : ''} value="_top">_top</option>
                    </select>
                  </div>
                </div>
                <input autocomplete="nope" id="link-editor-internal" class="link-editor-radio" type="radio" name="link-editor-tab-group"${ !isExternal ? ' checked ' : '' }/>
                <div class="link-editor-tab link-editor-tab-internal">
                  <div class="link-editor-tab-container">
                    <label for="link-editor-page">Link to a page</label>
                    <select autocomplete="nope" class="tabbed alertify-text page" id="link-editor-page">
                      <option value=""${ isExternal ? ' selected ' : ''}></option>
                      ${ this.pageNames.map(page => `<option value="#!${ page }"${ !isExternal && '#!' + page === linkData['href'] ? ' selected ' : ''} >${ this.model.page.getDisplayName(page) }</option>`) }
                    </select>
                  </div>
                </div>
                <div class="link-editor-2col-container">
                  <div class="link-editor-2col">
                    <label for="link-editor-title">Title</label>
                    <input autocomplete="nope" id="link-editor-title" class="alertify-text title" type="text" value="${ linkData['title'] }">
                  </div>
                </div>
                <hr>
                <div class="link-editor-advanced-container">
                  <input autocomplete="nope" id="link-editor-show-advanced" type="checkbox">
                  <label for="link-editor-show-advanced">Advanced params</label>
                  <div class="link-editor-advanced">
                    <label for="link-editor-rel">The "rel" attribute. Describes the relationship between the current document and the destination.</label>
                    <input autocomplete="nope" id="link-editor-rel" class="alertify-text rel" type="text" value="${ linkData['rel'] }">
                    <label for="link-editor-type">The "type" attribute. Specifies the MIME type of the linked resource.</label>
                    <input autocomplete="nope" id="link-editor-type" class="alertify-text type" type="text" value="${ linkData['type'] }">
                    <label for="link-editor-download">The "download" attribute. Indicates that the link is to be used for downloading a resource (such as a file). The author can specify a default file name by providing a value.</label>
                    <input autocomplete="nope" id="link-editor-download" class="alertify-text download" type="text" value="${ linkData['download'] }">
                  </div>
                </div>
              </section>
            `;
            Array.from(dialogBody.querySelectorAll('.link-editor-tab-label'))
            .forEach(el => {
              el.onclick = _ => {
                Array.from(dialogBody.querySelectorAll('.link-editor-tab-label.checked'))
                .forEach(selected => selected.classList.remove('checked'));
                el.classList.add('checked');
              }
            });
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
    super.redraw(selectedElements, pageNames, currentPageName);

    // reuse selectedElements in combo box on change
    this.selectedElements = selectedElements;

    // reuse pageNames in combo box on change
    this.pageNames = pageNames;
    this.currentPageName = currentPageName;

    // stop editing, even if we may not be editing right now
    this.stopEditing();
  }
}
