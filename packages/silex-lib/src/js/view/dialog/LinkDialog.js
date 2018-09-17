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
 * @fileoverview The dialog to edit links
 *
 */


goog.provide('silex.view.dialog.LinkDialog');
goog.require('silex.utils.Notification');

const LINK_ATTRIBUTES =  ['href', 'rel', 'target', 'type', 'title', 'download'];

/**
 * the LinkDialog class
 */
silex.view.dialog.LinkDialog = class {

  constructor(element, model) {
    this.element = element;
    this.model = model;
  }

  /**
   * get the link of selected text in text editor
   * this uses a hidden text field in the text format bar, which has a value set by wysihtml
   * @return {{href:string, target:string, title:string, rel:string, type:string, download:string}}
   */
  getLink() {
    return LINK_ATTRIBUTES
      .reduce((acc, attr) => {
        const el = this.element.querySelector('.get-' + attr);
        if(!el) {
          console.error('could not get data from link editor for attribute', attr);
        }
        else {
          acc[attr] = el.value;
        }
        return acc;
      }, {})
  }

  /**
   * @param {wysihtml.Editor} wysihtmlEditor
   * @param {Array<string>} pageNames
   */
  open(wysihtmlEditor, pageNames) {
    // get link current values
    const linkData = this.getLink();

    // external link data
    const isExternal = !linkData['href'].startsWith('#!');

    silex.utils.Notification.prompt('Link editor <a class="link-editor-help-button fa fa-question-circle" target="_blank" href="https://github.com/silexlabs/Silex/wiki/Editor-UI#link-editor">       Help</a>', 'unused', (accept, unused) => {
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

        wysihtmlEditor.composer.commands.exec('createLink', options);
      }
    });

    // add a remove link button
    const dialogButtons = silex.utils.Notification.getFormButtons();
    const fragmentButtons = document.createElement('fragment');
    fragmentButtons.innerHTML = `
              <button class="alertify-button alertify-button-remove">remove link</button>
            `;
    dialogButtons.insertBefore(fragmentButtons, dialogButtons.childNodes[0]);
    dialogButtons.querySelector('.alertify-button-remove')
      .onclick = (e => {
        silex.utils.Notification.close();
        wysihtmlEditor.composer.commands.exec('removeLink');
      });

    // add info about the link
    const dialogBody = silex.utils.Notification.getFormBody();
    dialogBody.innerHTML = this.getDialogHtml({
      isExternal: isExternal,
      linkData: linkData,
      pageNames: pageNames,
    });
    Array.from(dialogBody.querySelectorAll('.link-editor-tab-label'))
      .forEach(el => {
        el.onclick = _ => {
          Array.from(dialogBody.querySelectorAll('.link-editor-tab-label.checked'))
            .forEach(selected => selected.classList.remove('checked'));
          el.classList.add('checked');
        }
      });
  }
  getDialogHtml({
    isExternal,
    linkData,
    pageNames,
  }) {
    return `
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
              ${ pageNames.map(page => `<option value="#!${ page }"${ !isExternal && '#!' + page === linkData['href'] ? ' selected ' : ''} >${ this.model.page.getDisplayName(page) }</option>`) }
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
    `
  }
};

