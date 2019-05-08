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
 *   This class represents a the head section of the opened file,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the dom
 */

import { Constants } from '../../Constants';
import {View} from '../types';
import {FileInfo} from '../types';
import {Model} from '../types';
import {Font} from '../types';


/**
 * @param model  model class which holds the other models
 * @param view  view class which holds the other views
 */
export class Head {
  userHeadTag: string = '';

  constructor(public model: Model, public view: View) {}

  /**
   * Update the settings from the DOM after a website was loaded
   */
  updateFromDom() {
    this.setPublicationPath(this.getPublicationPath());
    this.setWebsiteUrl(this.getWebsiteUrl());
    this.setFaviconPath(this.getFaviconPath());
    this.setThumbnailSocialPath(this.getThumbnailSocialPath());
    this.setDescription(this.getDescription());
    this.setDescriptionSocial(this.getDescriptionSocial());
    this.setTitleSocial(this.getTitleSocial());
    this.setTitle(this.getTitle());
    this.setLang(this.getLang());
    this.setEnableMobile(this.getEnableMobile());
    this.setWebsiteWidth(this.getWebsiteWidth());

    // update text editor with the website custom styles and script
    this.model.head.setHeadStyle(this.model.head.getHeadStyle());
    this.model.head.setHeadScript(this.model.head.getHeadScript());
  }

  /**
   * set/get HEAD tag
   * the head tag edited by the user is a portion of the real head tag
   * it is delimited by specific comments
   * it can not be interpreted while editing, in case it has bad HTML tags, it
   * could break the whole site, insert tags into the body instead of the
   * head...
   * @return the head tag content
   */
  getUserHeadTag(): string {
    return this.userHeadTag;
  }

  /**
   * set/get HEAD tag
   * the head tag edited by the user is a portion of the real head tag
   * it is delimited by specific comments
   * it can not be interpreted while editing, in case it has bad HTML tags, it
   * could break the whole site, insert tags into the body instead of the
   * head...
   */
  setUserHeadTag(str: string) {
    this.userHeadTag = str;
  }

  /**
   * set/get silex editable js scripts
   * @return the string defining the js script
   */
  getHeadScript(): string {
    // get silex scripts from the DOM
    let scriptTag = this.getHeadElement().querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS);
    if (!scriptTag) {
      return '';
    }
    return scriptTag.innerHTML;
  }

  /**
   * set/get silex editable js script
   * @param jsString   the string defining Silex script
   */
  setHeadScript(jsString: string) {
    let scriptTag = this.getHeadElement().querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS) as HTMLScriptElement;
    if (!scriptTag) {
      const doc = this.model.file.getContentDocument();
      scriptTag = doc.createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.className = Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS;
      this.getHeadElement().appendChild(scriptTag);
    }
    scriptTag.innerHTML = jsString;
  }

  /**
   * set/get silex editable css styles
   * @return the css string defining all Silex styles
   */
  getHeadStyle(): string {
    // get silex styles from the DOM
    let silexStyle = this.getHeadElement().querySelector('.' + Constants.SILEX_STYLE_ELEMENT_CSS_CLASS);
    if (!silexStyle) {
      console.warn('no silex editable styles defined');
      return '';
    }
    return window['css_beautify'](silexStyle.innerHTML);
  }

  /**
   * set/get silex editable css styles
   * @param cssString   the css string defining all Silex styles
   */
  setHeadStyle(cssString: string) {
    let silexStyle = this.getHeadElement().querySelector('.' + Constants.SILEX_STYLE_ELEMENT_CSS_CLASS) as HTMLStyleElement;
    if (!silexStyle) {
      const doc = this.model.file.getContentDocument();
      silexStyle = doc.createElement('style');
      silexStyle.type = 'text/css';
      silexStyle.className = Constants.SILEX_STYLE_ELEMENT_CSS_CLASS;
      this.getHeadElement().appendChild(silexStyle);
    }
    silexStyle.innerHTML = cssString;
    // update metrics
    this.view.stageWrapper.redraw();
  }

  /**
   * get/set a meta data
   */
  getMeta(name: string): string {
    let metaNode = this.model.file.getContentDocument().querySelector(
        'meta[name="' + name + '"]');
    if (metaNode) {
      return metaNode.getAttribute('content');
    } else {
      return null;
    }
  }

  /**
   * get/set a meta data
   */
  setMeta(name: string, opt_value?: string) {
    // update the DOM element
    let metaNode = this.model.file.getContentDocument().querySelector('meta[name="' + name + '"]') as HTMLMetaElement;
    if (!metaNode && opt_value && opt_value !== '') {
      // create the DOM element
      const doc = this.model.file.getContentDocument();
      metaNode = doc.createElement('meta');
      metaNode.name = name;
      metaNode.content = opt_value;
      this.getHeadElement().appendChild(metaNode);
    } else {
      if (opt_value && opt_value !== '') {
        // update opt_value
        metaNode.setAttribute('content', opt_value);
      } else {
        // remove the opt_value
        if(metaNode) metaNode.parentElement.removeChild(metaNode);
      }
    }
  }

  /**
   * get/set the publication path
   * publication path is always absolute url
   */
  setPublicationPath(opt_fileInfo?: FileInfo) {
    // TODO: remove meta and store this value in the JSON like components params
    // (see model/property.js)
    this.setMeta(
        'publicationPath',
        opt_fileInfo == null ? null : JSON.stringify(opt_fileInfo));
    this.view.settingsDialog.setPublicationPath(opt_fileInfo);
  }

  /**
   * get/set the publication path
   * publication path is always absolute url
   */
  getPublicationPath(): FileInfo {
    let fileInfo = this.getMeta('publicationPath');
    try {
      return fileInfo == null ? null : (JSON.parse(fileInfo) as FileInfo);
    } catch (e) {
      // this happens with old publication path (just a string)
      return null;
    }
  }

  /**
   * get/set the website URL
   */
  setWebsiteUrl(opt_url?: string) {
    // TODO: remove meta and store this value in the JSON like components params
    // (see model/property.js)
    this.setMeta('websiteUrl', opt_url);
    this.view.settingsDialog.setWebsiteUrl(opt_url);
  }

  /**
   * get/set the website URL
   */
  getWebsiteUrl(): string {
    return this.getMeta('websiteUrl');
  }

  /**
   * get/set the hosting provider
   */
  setHostingProvider(opt_url?: string) {
    // TODO: remove meta and store this value in the JSON like components params
    // (see model/property.js)
    this.setMeta('hostingProvider', opt_url);
  }

  /**
   * get/set the hosting provider
   */
  getHostingProvider(): string {
    return this.getMeta('hostingProvider');
  }

  /**
   * enable/disable the mobile version
   */
  setEnableMobile(enable: boolean) {
    const doc = this.model.file.getContentDocument();
    if (doc.body === null) {
      // body is null, this happens while undoing or redoing
      return;
    }
    let viewport = doc.querySelector('meta[name=viewport]') as HTMLMetaElement;
    if (enable === true) {
      doc.body.classList.add(Constants.ENABLE_MOBILE_CSS_CLASS);
      if (!viewport) {
        viewport = doc.createElement('meta') as HTMLMetaElement;
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1';
        doc.head.appendChild(viewport);
      }
    } else {
      doc.body.classList.remove(Constants.ENABLE_MOBILE_CSS_CLASS);
      if (viewport) {
        doc.head.removeChild(viewport);
      }
    }
    this.view.settingsDialog.setEnableMobile(enable);

    // redraw UI
    let pages = this.model.page.getPages();
    let page = this.model.page.getCurrentPage();
    const selectedElements = this.model.body.getSelection();
    const states = this.view.stageWrapper.getSelection();
    this.view.propertyTool.redraw(states, pages, page);
    this.view.textFormatBar.redraw(selectedElements, pages, page);
  }

  /**
   * enable/disable the mobile version
   */
  getEnableMobile(): boolean {
    const body = this.model.file.getContentDocument().body;
    if (body === null) {
      // body is null, this happens while undoing or redoing
      return false;
    }
    return body.classList.contains(Constants.ENABLE_MOBILE_CSS_CLASS);
  }

  /**
   * get/set the website width
   */
  setWebsiteWidth(opt_value?: number) {
    this.view.settingsDialog.setWebsiteWidth(opt_value);

    const width: string = opt_value ? opt_value.toString() : null;
    this.setMeta('website-width', width);

    let silexStyle = this.getHeadElement().querySelector('.silex-style-settings') as HTMLStyleElement;
    if (width && width !== '') {
      if (!silexStyle) {
        const doc = this.model.file.getContentDocument();
        silexStyle = doc.createElement('style');
        silexStyle.type = 'text/css';
        silexStyle.className = 'silex-style-settings';
        this.getHeadElement().appendChild(silexStyle);
      }
      silexStyle.innerHTML = `
      .${Constants.WEBSITE_WIDTH_CLASS_NAME} {
        width: ${width}px;
      }
    `;
    } else {
      if (silexStyle) {
        this.getHeadElement().removeChild(silexStyle);
      }
    }
  }

  /**
   * get/set the website width
   */
  getWebsiteWidth(): number {
    const width = this.getMeta('website-width');
    return !!width ? parseInt(width) : null;
  }

  /**
   * get/set the description
   */
  setDescription(opt_description?: string) {
    this.setMeta('description', opt_description);
    this.view.settingsDialog.setDescription(opt_description);
  }

  /**
   * get/set the description
   */
  getDescription(): string {
    return this.getMeta('description');
  }

  /**
   * website title
   */
  getTitle(): string {
    let titleNode = this.getHeadElement().querySelector('title');
    if (titleNode) {
      return titleNode.innerHTML;
    } else {
      return null;
    }
  }

  /**
   * website title
   */
  setTitle(name: string) {
    // find or create the title tag in the head section
    let titleNode = this.getHeadElement().querySelector('title') as HTMLTitleElement;
    if (!titleNode) {
      const doc = this.model.file.getContentDocument();
      titleNode = doc.createElement('title');
      this.getHeadElement().appendChild(titleNode);
    }

    // update website title
    titleNode.innerHTML = name || '';

    // update view
    this.view.settingsDialog.setTitle(name);
  }

  /**
   * website default website language
   */
  getLang(): string {
    return this.model.file.getContentDocument().querySelector('html').lang;
  }

  /**
   * website default website language
   */
  setLang(name: string) {
    this.model.file.getContentDocument().querySelector('html').lang =
        name || '';

    // update view
    this.view.settingsDialog.setLang(name || '');
  }

  /**
   * website favicon
   */
  getFaviconPath(): string {
    let faviconTag =
        this.getHeadElement().querySelector('link[rel="shortcut icon"]');
    let url = null;
    if (faviconTag) {
      url = faviconTag.getAttribute('href');
    }
    return url;
  }

  /**
   * website favicon
   */
  setFaviconPath(opt_path?: string) {
    let faviconTag =
        this.getHeadElement().querySelector('link[rel="shortcut icon"]');
    if (!faviconTag) {
      if (opt_path) {
      const doc = this.model.file.getContentDocument();
        faviconTag = doc.createElement('link');
        faviconTag.setAttribute('href', opt_path);
        faviconTag.setAttribute('rel', 'shortcut icon');
        this.getHeadElement().appendChild(faviconTag);
      }
    } else {
      if (!opt_path) {
        faviconTag.parentElement.removeChild(faviconTag);
      }
    }
    if (opt_path) {
      // update website title
      faviconTag.setAttribute('href', opt_path);
    }

    // update view
    this.view.settingsDialog.setFaviconPath(opt_path);
  }

  /**
   * get/set the title for social networks
   */
  setTitleSocial(opt_data?: string) {
    this.setMeta('twitter:card', opt_data ? 'summary' : '');
    this.setMeta('twitter:title', opt_data);
    this.setMeta('og:title', opt_data);
    this.view.settingsDialog.setTitleSocial(opt_data);
  }

  /**
   * get/set the title for social networks
   */
  getTitleSocial(): string {
    return this.getMeta('twitter:title') || this.getMeta('og:title');
  }

  /**
   * get/set the description for social networks
   */
  setDescriptionSocial(opt_data?: string) {
    this.setMeta('twitter:card', opt_data ? 'summary' : '');
    this.setMeta('twitter:description', opt_data);
    this.setMeta('og:description', opt_data);
    this.view.settingsDialog.setDescriptionSocial(opt_data);
  }

  /**
   * get/set the description for social networks
   */
  getDescriptionSocial(): string {
    return this.getMeta('twitter:description') ||
        this.getMeta('og:description');
  }

  /**
   * get/set the thumbnail image for social networks
   */
  setThumbnailSocialPath(opt_path?: string) {
    this.setMeta('twitter:card', opt_path ? 'summary' : '');
    this.setMeta('twitter:image', opt_path);
    this.setMeta('og:image', opt_path);
    this.view.settingsDialog.setThumbnailSocialPath(opt_path);
  }

  /**
   * get/set the thumbnail image for social networks
   */
  getThumbnailSocialPath(): string {
    let url = this.getMeta('og:image') || this.getMeta('twitter:image');
    return url;
  }

  /**
   * get/set the twitter account
   */
  setTwitterSocial(opt_data?: string) {
    this.setMeta('twitter:card', opt_data ? 'summary' : '');
    this.setMeta('twitter:site', opt_data);
    this.view.settingsDialog.setTwitterSocial(opt_data);
  }

  /**
   * get/set the twitter account
   */
  getTwitterSocial(): string {
    return this.getMeta('twitter:site');
  }

  /**
   * @return   head element of the loaded site
   */
  getHeadElement(): HTMLElement {
    // returns the head of the document in the iframe
    return this.model.file.getContentDocument().head;
  }

  /**
   * @return all the fonts for this website
   */
  getFonts(): Font[] {
    return this.model.property.getFonts();
  }

  setFonts(fonts: Font[]) {
    /**
     * @return true if the fonts are the same
     */
    function compareFonts(f1: Font, f2: Font): boolean {
      return f1.family === f2.family && f1.href === f2.href;
    }

    // remove fonts which are not in fonts anymore
    const head = this.getHeadElement();
    const doc = this.model.file.getContentDocument();
    const oldFonts = this.getFonts();
    oldFonts.filter((font) => !fonts.find((f) => compareFonts(f, font)))
        .forEach((font) => {
          const link = head.querySelector(`link[href="${font.href}"]`);
          if (link) {
            head.removeChild(link);
          } else {
            console.warn('Could not remove font from the dom', font, link);
          }
        });

    // add new fonts
    fonts.filter((font) => !oldFonts.find((f) => compareFonts(f, font)))
        .forEach((font) => {
          const link = doc.createElement('link');
          link.href = font.href;
          link.rel = 'stylesheet';
          link.className = Constants.CUSTOM_FONTS_CSS_CLASS;
          head.appendChild(link);
        });

    // store the list in db
    this.model.property.setFonts(fonts);

    // update views
    this.view.settingsDialog.redraw();
  }
}
