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
 * @fileoverview The settings dialog which handles the file settings
 *
 */


goog.provide('silex.view.dialog.SettingsDialog');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.view.ModalDialog');


/**
 * constant for all pane css classes
 * @type {Array.<string>}
 */
const PANE_CSS_CLASSES = [
  'general-pane',
  'social-pane',
  'publish-pane',
  'fonts-pane',
];

/**
 * the Silex SettingsDialog class
 */
class SettingsDialog {
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
     * store the mobile checkbox
     * @type {HTMLInputElement}
     */
    this.mobileCheckbox = null;


    /**
     * store the current publication path
     * @type {?FileInfo}
     */
    this.publicationPath = null;


    /**
     * @type {function()|null}
     */
    this.onClose = null;

    // make this a dialog
    this.modalDialog = new ModalDialog({
      element: element,
      onOpen: args => {
        this.onClose = args.cbk;
        if(args.pane) this.openPane(args.pane);
        this.redraw();
      },
      onClose: () => {
        // notify the caller of this dialog
        if(this.onClose) this.onClose();
      },
    });

    // navigation
    this.paneCssClasses = PANE_CSS_CLASSES;
    this.element.classList.add(this.paneCssClasses[0] + '-visible');
    var leftPane = goog.dom.getElementByClass('left-pane');
    goog.events.listen(
        leftPane, goog.events.EventType.CLICK, this.onNavClick, false, this);

    // input text fields
    this.bindTextField('.general-pane .input-title', (v) => this.controller.settingsDialogController.setTitle(v));
    this.bindTextField('.general-pane .input-site-width', (v) => this.controller.settingsDialogController.setWebsiteWidth(v));
    this.bindTextField('.social-pane .input-title', (v) => this.controller.settingsDialogController.setTitleSocial(v));
    this.bindTextField('.general-pane .input-description', (v) => this.controller.settingsDialogController.setDescription(v));
    this.bindTextField('.social-pane .input-description', (v) => this.controller.settingsDialogController.setDescriptionSocial(v));
    this.bindTextField('.social-pane .input-twitter', (v) => this.controller.settingsDialogController.setTwitterSocial(v));
    this.bindTextField('.general-pane .input-favicon-path', (v) => this.controller.settingsDialogController.setFaviconPath(v));
    this.bindTextField('.social-pane .input-image-path', (v) => this.controller.settingsDialogController.setThumbnailSocialPath(v));
    this.bindTextField('.publish-pane .input-publication-path', (v) => {
      const fileInfo = this.controller.settingsDialogController.getPublicationPath();
      const fileInfoNew = silex.utils.Url.updateFileInfo(fileInfo, {'path': v});
      this.controller.settingsDialogController.setPublicationPath(fileInfoNew);
    });
    this.bindTextField('.publish-pane .input-publication-service', (v) => {
      const fileInfo = this.controller.settingsDialogController.getPublicationPath();
      const fileInfoNew = silex.utils.Url.updateFileInfo(fileInfo, {'service': v});
      this.controller.settingsDialogController.setPublicationPath(fileInfoNew);
    });

    // image path browse button
    this.bindBrowseButton('.general-pane .browse-favicon-path', () => {
      this.controller.settingsDialogController.browseFaviconPath(() => this.open());
    });
    this.bindBrowseButton('.publish-pane .browse-publication-path', () => {
      this.controller.settingsDialogController.browsePublishPath(() => this.open());
    });

    // build UI
    this.mobileCheckbox = /** @type {HTMLInputElement} */ (this.element.querySelector('.mobile-check'));
    goog.events.listen(this.mobileCheckbox, goog.ui.Component.EventType.CHANGE,
     function(e) {
       this.controller.settingsDialogController.toggleEnableMobile();
     }, false, this);

    // fill the options of the service selector
    silex.service.CloudStorage.getInstance().ready(() => {
      silex.service.CloudStorage.getInstance().getServices(services => {
        const select = this.element.querySelector('.publish-pane .input-publication-service');
        select.innerHTML = '';
        for(let idx=0; idx<services.length; idx++) {
          const service = services[idx];
          const option = document.createElement('option');
          option.value = service.name;
          option.innerHTML = service.displayName || service.name;
          select.appendChild(option);
        }
      });
    });
    // font button
    this.element.querySelector('.pane.fonts-pane .add-font-btn').onclick = e => {
      this.addFont();
    };
    this.list = this.element.querySelector('.fonts-list');
    this.list.onclick = e => {
      const el = e.target;
      if(el.classList.contains('del-btn')) {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const fonts = this.model.head.getFonts();
        const newFonts = fonts.slice()
        newFonts.splice(idx, 1);
        this.model.head.setFonts(newFonts);
      }
      else if(el.classList.contains('edit-btn')) {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const fonts = this.model.head.getFonts();
        console.log('edit', fonts[idx]);
        this.editFont(fonts[idx], font => {
          const newFonts = fonts.slice()
          newFonts[idx] = font;
          this.model.head.setFonts(newFonts);
        });
      }
    };
  }


  /**
   * click in the navigation
   * @param {Event} e
   */
  onNavClick(e) {
    this.openPane(e.target.getAttribute('data-pane'));
  }


  /**
   * open the given pane
   * adds the desired pane class + '-visible' to this.element
   * @param {string} paneCssClass
   */
  openPane(paneCssClass) {
    // close all panes
    this.paneCssClasses.forEach(className => this.element.classList.remove(className + '-visible'));
    // open the one we want
    this.element.classList.add(paneCssClass + '-visible');
  }


  /**
   * binds an input element with a callback
   * @param {string} cssSelector
   * @param {function(string)} cbk
   */
  bindTextField(cssSelector, cbk) {
    // title input field
    var input = this.element.querySelector(cssSelector);
    if (!input) {
      throw new Error('Settings panel error: could not find the element to bind.');
    }
    input.onchange = (e) => {
      cbk(input.value);
    };
  }


  /**
   * binds a button element with a callback
   * @param {string} cssSelector
   * @param {function()} cbk
   */
  bindBrowseButton(cssSelector, cbk) {
    // title input field
    var btn = this.element.querySelector(cssSelector);
    if (!btn) {
      throw new Error('Settings panel error: could not find the element to bind.');
    }
    goog.events.listen(btn, goog.events.EventType.CLICK, function() {
      cbk();
    }, false, this);
  }


  /**
   * set the value to the input element
   * @see silex.model.Head
   * @param {string} cssSelector
   * @param {?string=} opt_value
   */
  setInputValue(cssSelector, opt_value) {
    var input = this.element.querySelector(cssSelector);
    if (opt_value) {
      input.value = opt_value;
    }
    else {
      input.value = '';
    }
  }


  /**
   * set the favicon path to display
   * @see silex.model.Head
   * @param {?string=} opt_path
   */
  setFaviconPath(opt_path) {
    this.setInputValue('.general-pane .input-favicon-path', opt_path);
  }


  /**
   * set the social image path to display
   * @see silex.model.Head
   * @param {?string=} opt_path
   */
  setThumbnailSocialPath(opt_path) {
    this.setInputValue('.social-pane .input-image-path', opt_path);
  }


  /**
   * set the pubication path to display
   * @see silex.model.Head
   * @param {?FileInfo=} opt_fileInfo   the publication path
   */
  setPublicationPath(opt_fileInfo) {
    if(opt_fileInfo != null) {
      // set input tags the values
      this.setInputValue('.publish-pane .input-publication-service', opt_fileInfo.service);
      this.setInputValue('.publish-pane .input-publication-path', opt_fileInfo.path);
      // display the UI with publication path set
      this.element.classList.remove('publication-path-not-set');
      // store fileInfo value, clone fileInfo for safety
      this.publicationPath = /** @type {FileInfo} */ (Object.assign({}, opt_fileInfo));
    }
    else {
      this.setInputValue('.publish-pane .input-publication-service', '');
      this.setInputValue('.publish-pane .input-publication-path', '');
      // display the "not set" UI
      this.element.classList.add('publication-path-not-set');
      // store fileInfo value
      this.publicationPath = null;
    }
  };


  /**
   * get the pubication path from text fields
   * @return {?FileInfo} the publication path
   */
  getPublicationPath() {
    const service = this.element.querySelector('.publish-pane .input-publication-service').value;
    const path = this.element.querySelector('.publish-pane .input-publication-path').value;
    if(this.publicationPath != null && service && path && service !== '' && path !== '') {
      this.publicationPath.service = service;
      this.publicationPath.path = path;
    }
    return this.publicationPath;
  }


  /**
   * enable/disable mobile version
   * @see silex.model.Head
   * @param {boolean} enabled
   */
  setEnableMobile(enabled) {
    this.mobileCheckbox.checked = enabled;
  }


  /**
   * set the website width
   * @see silex.model.Head
   * @param {?string=} opt_value
   */
  setWebsiteWidth(opt_value) {
    this.setInputValue('.general-pane .input-site-width', opt_value);
  }


  /**
   * set the site title to display
   * @see silex.model.Head
   * @param {?string=} opt_title   the site title
   */
  setTitle(opt_title) {
    this.setInputValue('.general-pane .input-title', opt_title);
  }


  /**
   * set the site description tag
   * @see silex.model.Head
   * @param {?string=} opt_description   the site description
   */
  setDescription(opt_description) {
    this.setInputValue('.general-pane .input-description', opt_description);
  }


  /**
   * set the site title to display
   * @see silex.model.Head
   * @param {?string=} opt_title   the site title
   */
  setTitleSocial(opt_title) {
    this.setInputValue('.social-pane .input-title', opt_title);
  }


  /**
   * set the site description tag
   * @see silex.model.Head
   * @param {?string=} opt_description   the site description
   */
  setDescriptionSocial(opt_description) {
    this.setInputValue('.social-pane .input-description', opt_description);
  }


  /**
   * set the owner twitter account
   * @see silex.model.Head
   * @param {?string=} opt_twitter
   */
  setTwitterSocial(opt_twitter) {
    this.setInputValue('.social-pane .input-twitter', opt_twitter);
  }


  /**
   * open settings dialog
   * @param {?function()=} opt_cbk   callback to be called when the user closes the dialog
   * @param {?string=} opt_paneCssClass   css class of the pane to open
   */
  open(opt_cbk, opt_paneCssClass) {
    this.modalDialog.open({
      cbk: opt_cbk,
      pane: opt_paneCssClass,
    });
  }


  /**
   * redraw the dialog
   */
  redraw() {
    try{
      this.setPublicationPath(this.model.head.getPublicationPath());
      this.setFonts(this.model.head.getFonts());
    } catch(e){}
  }


  /**
   * @param {Array<Font>} fonts
   */
  setFonts(fonts) {
    this.list.innerHTML = '<ul>' + fonts.map((font, idx) => {
      const iframeContent = encodeURIComponent(`
        <link href="${ font.href }" rel="stylesheet">
        <style>
          body {
            width: 100%;
            font-family: ${ font.family };
            color: white;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }
        </style>
        <span style="font-size:14px;">${ font.family }</span> -&nbsp;
        <span style="font-size:28px;">${ font.family }</span> -&nbsp;
        <span style="font-size:56px;">${ font.family }</span>
      `);
      return `<li>
        <div class="ui">
          <button class="edit-btn fa fa-pencil" title="Edit this font" data-idx="${ idx }"></button>
          <button class="del-btn" title="Remove this font" data-idx="${ idx }"></button>
        </div>
        <div class="content">
          <iframe src="data:text/html,${ iframeContent }"></iframe>
        </div>
      </li>`;
    }).join('') + '</ul>';
  }


  addFont() {
    this.editFont({
      href: 'https://fonts.googleapis.com/css?family=Roboto',
      family: '\'Roboto\', sans-serif',
    }, newFont => {
      const fonts = this.model.head.getFonts();
      if(fonts.find(/** @param {Font} font */ (font) => font.href === newFont.href && font.family === newFont.family)) {
        console.warn('This font is already embedded in this website');
      }
      else {
        fonts.push(newFont);
        this.model.head.setFonts(fonts);
      }
    });
  }


  editFont(font, cbk) {
    silex.utils.Notification.prompt('What is the CSS stylesheet for your font, e.g. https://fonts.googleapis.com/css?family=Roboto', font.href, (ok, href) => {
      if(ok) silex.utils.Notification.prompt('What is the name of your font, e.g. \'Roboto\', sans-serif', font.family, (ok, family) => {
        if(ok) {
          cbk(/** @type {Font} */ ({
            family: family,
            href: href,
          }));
        }
      });
    });
  }


  /**
   * close editor
   * this is private method, do not call it
   */
  close() {
    this.modalDialog.close();
  }
}

