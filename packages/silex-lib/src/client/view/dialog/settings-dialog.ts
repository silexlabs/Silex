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

import { CloudStorage } from '../../service/cloud-storage';
import { Controller, FileInfo, Font, Model } from '../../types';
import { SilexNotification } from '../../utils/notification';
import { Url } from '../../utils/url';
import { ModalDialog } from '../ModalDialog';

/**
 * constant for all pane css classes
 */
const PANE_CSS_CLASSES: string[] =
    ['general-pane', 'social-pane', 'publish-pane', 'fonts-pane'];

/**
 * the Silex SettingsDialog class
 */
export class SettingsDialog {
  /**
   * store the mobile checkbox
   */
  mobileCheckbox: HTMLInputElement = null;

  /**
   * store the current publication path
   */
  publicationPath: FileInfo = null;
  websiteUrl: string = null;
  onClose: (() => any) = null;

  // make this a dialog
  modalDialog: any;

  // navigation
  paneCssClasses: any;
  list: any;

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {
    this.modalDialog = new ModalDialog({
      name:'Settings dialog',
      element: element,
      onOpen: (args) => {
        this.onClose = args.cbk;
        if (args.pane) {
          this.openPane(args.pane);
        }
        this.redraw();
      },
      onClose: () => {
        // notify the caller of this dialog
        if (this.onClose) {
          this.onClose();
        }
      }
    });
    this.paneCssClasses = PANE_CSS_CLASSES;
    this.element.classList.add(this.paneCssClasses[0] + '-visible');
    let leftPane = document.querySelector('.left-pane');
    leftPane.addEventListener('click', e => this.onNavClick(e), false);

    // input text fields
    this.bindTextField(
        '.general-pane .input-title',
        (v) => this.controller.settingsDialogController.setTitle(v));
    this.bindTextField(
        '.general-pane .input-lang',
        (v) => this.controller.settingsDialogController.setLang(v));
    this.bindTextField(
        '.general-pane .input-site-width',
        (v) => this.controller.settingsDialogController.setWebsiteWidth(!!v ? parseInt(v) : null));
    this.bindTextField(
        '.social-pane .input-title',
        (v) => this.controller.settingsDialogController.setTitleSocial(v));
    this.bindTextField(
        '.general-pane .input-description',
        (v) => this.controller.settingsDialogController.setDescription(v));
    this.bindTextField(
        '.social-pane .input-description',
        (v) =>
            this.controller.settingsDialogController.setDescriptionSocial(v));
    this.bindTextField(
        '.social-pane .input-twitter',
        (v) => this.controller.settingsDialogController.setTwitterSocial(v));
    this.bindTextField(
        '.general-pane .input-favicon-path',
        (v) => this.controller.settingsDialogController.setFaviconPath(v));
    this.bindTextField(
        '.social-pane .input-image-path',
        (v) =>
            this.controller.settingsDialogController.setThumbnailSocialPath(v));
    this.bindTextField('.publish-pane .input-publication-path', (v) => {
      const fileInfo =
          this.controller.settingsDialogController.getPublicationPath();
      const fileInfoNew = Url.updateFileInfo(fileInfo, {'path': v});
      this.controller.settingsDialogController.setPublicationPath(fileInfoNew);
    });
    this.bindTextField('.publish-pane .input-publication-service', (v) => {
      const fileInfo =
          this.controller.settingsDialogController.getPublicationPath();
      const fileInfoNew =
          Url.updateFileInfo(fileInfo, {'service': v});
      this.controller.settingsDialogController.setPublicationPath(fileInfoNew);
    });
    this.bindTextField('.publish-pane .input-website-url', (v) => {
      if (v === '') {
        v = null;
      }
      this.model.head.setWebsiteUrl(v);
      this.websiteUrl = v;
    });

    // image path browse button
    this.bindBrowseButton('.general-pane .browse-favicon-path', () => {
      this.controller.settingsDialogController.browseFaviconPath(
          () => this.open());
    });
    this.bindBrowseButton('.publish-pane .browse-publication-path', () => {
      this.controller.settingsDialogController.browsePublishPath(
          () => this.open());
    });

    // build UI
    this.mobileCheckbox = this.element.querySelector('.mobile-check');
    this.mobileCheckbox.addEventListener('click', () => {
          this.controller.settingsDialogController.toggleEnableMobile();
        }, false);

    // fill the options of the service selector
    CloudStorage.getInstance().ready(() => {
      CloudStorage.getInstance().getServices((services) => {
        const select = this.element.querySelector(
            '.publish-pane .input-publication-service');
        select.innerHTML = '';
        for (let idx = 0; idx < services.length; idx++) {
          const service = services[idx];
          const option = document.createElement('option');
          option.value = service.name;
          option.innerHTML = service.displayName || service.name;
          select.appendChild(option);
        }
      });
    });

    // font button
    (this.element.querySelector('.pane.fonts-pane .add-font-btn') as HTMLElement).onclick = e => this.addFont();
    this.list = this.element.querySelector('.fonts-list');
    this.list.onclick = (e) => {
      const el = (e.target as HTMLElement);
      if (el.classList.contains('del-btn')) {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const fonts = this.model.head.getFonts();
        const newFonts = fonts.slice();
        newFonts.splice(idx, 1);
        this.model.head.setFonts(newFonts);
      } else {
        if (el.classList.contains('edit-btn')) {
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          const fonts = this.model.head.getFonts();
          this.editFont(fonts[idx], (font) => {
            const newFonts = fonts.slice();
            newFonts[idx] = font;
            this.model.head.setFonts(newFonts);
          });
        }
      }
    };
  }

  /**
   * click in the navigation
   */
  onNavClick(e: Event) {
    this.openPane((e.target as HTMLElement).getAttribute('data-pane'));
  }

  /**
   * open the given pane
   * adds the desired pane class + '-visible' to this.element
   */
  openPane(paneCssClass: string) {
    // close all panes
    this.paneCssClasses.forEach(
        (className) => this.element.classList.remove(className + '-visible'));

    // open the one we want
    this.element.classList.add(paneCssClass + '-visible');
  }

  /**
   * binds an input element with a callback
   */
  bindTextField(cssSelector: string, cbk: (p1: string) => any) {
    let input = this.element.querySelector(cssSelector) as HTMLInputElement;
    if (!input) {
      throw new Error(
          'Settings panel error: could not find the element to bind.');
    }
    input.onchange = (e) => {
      cbk(input.value);
    };
  }

  /**
   * binds a button element with a callback
   */
  bindBrowseButton(cssSelector: string, cbk: () => any) {
    let btn = this.element.querySelector(cssSelector);
    if (!btn) {
      throw new Error(
          'Settings panel error: could not find the element to bind.');
    }
    btn.addEventListener('click', () => {
      cbk();
    }, false);
  }

  /**
   * set the value to the input element
   * @see silex.model.Head
   */
  setInputValue(cssSelector: string, opt_value?: string) {
    let input = this.element.querySelector(cssSelector) as HTMLInputElement;
    if (opt_value) {
      input.value = opt_value;
    } else {
      input.value = '';
    }
  }

  /**
   * set the favicon path to display
   * @see silex.model.Head
   */
  setFaviconPath(opt_path?: string) {
    this.setInputValue('.general-pane .input-favicon-path', opt_path);
  }

  /**
   * set the social image path to display
   * @see silex.model.Head
   */
  setThumbnailSocialPath(opt_path?: string) {
    this.setInputValue('.social-pane .input-image-path', opt_path);
  }

  /**
   * set the pubication path to display
   * @see silex.model.Head
   * @param fileInfo   the publication path
   */
  setPublicationPath(fileInfo?: FileInfo) {
    if (fileInfo != null) {
      // set input tags the values
      this.setInputValue(
          '.publish-pane .input-publication-service', fileInfo.service);
      this.setInputValue(
          '.publish-pane .input-publication-path', fileInfo.path);

      // display the UI with publication path set
      this.element.classList.remove('publication-path-not-set');

      // store FileInfo value, clone FileInfo for safety
      this.publicationPath = (Object.assign({}, fileInfo) as FileInfo);
    } else {
      this.setInputValue('.publish-pane .input-publication-service', '');
      this.setInputValue('.publish-pane .input-publication-path', '');

      // display the "not set" UI
      this.element.classList.add('publication-path-not-set');

      // store FileInfo value
      this.publicationPath = null;
    }
  }

  /**
   * get the pubication path from text fields
   * @return the publication path
   */
  getPublicationPath(): FileInfo {
    const service = (this.element.querySelector('.publish-pane .input-publication-service') as HTMLInputElement).value;
    const path = (this.element.querySelector('.publish-pane .input-publication-path') as HTMLInputElement).value;
    if (this.publicationPath != null && service && path && service !== '' && path !== '') {
      this.publicationPath.service = service;
      this.publicationPath.path = path;
    }
    return this.publicationPath;
  }

  setWebsiteUrl(opt_url) {
    this.setInputValue('.publish-pane .input-website-url', opt_url);
    this.websiteUrl = opt_url;
  }

  /**
   * enable/disable mobile version
   * @see silex.model.Head
   */
  setEnableMobile(enabled: boolean) {
    this.mobileCheckbox.checked = enabled;
  }

  /**
   * set the website width
   * @see silex.model.Head
   */
  setWebsiteWidth(opt_value?: number) {
    this.setInputValue('.general-pane .input-site-width', opt_value ? opt_value.toString() : null);
  }

  /**
   * set the site title to display
   * @see silex.model.Head
   * @param opt_title   the site title
   */
  setTitle(opt_title?: string) {
    this.setInputValue('.general-pane .input-title', opt_title);
  }

  /**
   * set the site default language
   * @see silex.model.Head
   * @param opt_lang   the site lang
   */
  setLang(opt_lang?: string) {
    this.setInputValue('.general-pane .input-lang', opt_lang);
  }

  /**
   * set the site description tag
   * @see silex.model.Head
   * @param opt_description   the site description
   */
  setDescription(opt_description?: string) {
    this.setInputValue('.general-pane .input-description', opt_description);
  }

  /**
   * set the site title to display
   * @see silex.model.Head
   * @param opt_title   the site title
   */
  setTitleSocial(opt_title?: string) {
    this.setInputValue('.social-pane .input-title', opt_title);
  }

  /**
   * set the site description tag
   * @see silex.model.Head
   * @param opt_description   the site description
   */
  setDescriptionSocial(opt_description?: string) {
    this.setInputValue('.social-pane .input-description', opt_description);
  }

  /**
   * set the owner twitter account
   * @see silex.model.Head
   */
  setTwitterSocial(opt_twitter?: string) {
    this.setInputValue('.social-pane .input-twitter', opt_twitter);
  }

  /**
   * open settings dialog
   * @param opt_cbk   callback to be called when the user closes the dialog
   * @param opt_paneCssClass   css class of the pane to open
   */
  open(opt_cbk?: (() => any), opt_paneCssClass?: string) {
    this.modalDialog.open({cbk: opt_cbk, pane: opt_paneCssClass});
  }

  /**
   * redraw the dialog
   */
  redraw() {
    try {
      this.setPublicationPath(this.model.head.getPublicationPath());
      this.setWebsiteUrl(this.model.head.getWebsiteUrl());
      this.setFonts(this.model.head.getFonts());
    } catch (e) {
    }
  }

  setFonts(fonts: Font[]) {
    this.list.innerHTML = '<ul>' +
        fonts
            .map((font, idx) => {
              const iframeContent = encodeURIComponent(`
        <link href="${font.href}" rel="stylesheet">
        <style>
          body {
            width: 100%;
            font-family: ${font.family};
            color: white;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }
        </style>
        <span style="font-size:14px;">${font.family}</span> -&nbsp;
        <span style="font-size:28px;">${font.family}</span> -&nbsp;
        <span style="font-size:56px;">${font.family}</span>
      `);
              return `<li>
        <div class="ui">
          <button class="edit-btn fa fa-pencil" title="Edit this font" data-idx="${
                  idx}"></button>
          <button class="del-btn" title="Remove this font" data-idx="${
                  idx}"></button>
        </div>
        <div class="content">
          <iframe src="data:text/html,${iframeContent}"></iframe>
        </div>
      </li>`;
            })
            .join('') +
        '</ul>';
  }

  addFont() {
    this.editFont(
        {
          href: 'https://fonts.googleapis.com/css?family=Roboto',
          family: '\'Roboto\', sans-serif'
        },
        (newFont) => {
          const fonts = this.model.head.getFonts();
          if (fonts.find(
                  (font: Font) => font.href === newFont.href &&
                      font.family === newFont.family)) {
            console.warn('This font is already embedded in this website');
          } else {
            fonts.push(newFont);
            this.model.head.setFonts(fonts);
          }
        });
  }

  editFont(font, cbk) {
    SilexNotification.prompt('Edit font',
      'What is the CSS stylesheet for your font, e.g. https://fonts.googleapis.com/css?family=Roboto',
      font.href, (ok, href) => {
        if (ok) {
          SilexNotification.prompt('Edit font',
            'What is the name of your font, e.g. \'Roboto\', sans-serif',
            font.family, (ok, family) => {
              if (ok) {
                cbk(({family: family, href: href} as Font));
              }
            }
          );
        }
      }
    );
  }

  /**
   * close editor
   * this is private method, do not call it
   */
  close() {
    this.modalDialog.close();
  }
}
