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
 *   This class is used to manage Silex elements
 *   It has methods to manipulate the DOM elements
 *      created by new silex.model.Element().createElement
 */

import { Model, View } from '../types';
import { Dom } from '../utils/dom';
import { Style } from '../utils/style';
import { Url } from '../utils/url';
import { TemplateName } from './Data';
import { Constants } from '../../Constants';
import { getUiElements } from '../view/UiElements';

/**
 * direction in the dom
 */
export class DomDirection {
  static UP = 'UP';
  static DOWN = 'DOWN';
  static TOP = 'TOP';
  static BOTTOM = 'BOTTOM';
};

/**
 * @param model  model class which holds the other models
 * @param view  view class which holds the other views
 */
export class SilexElement {
  /**
   * constant for default size of an element
   */
  static INITIAL_ELEMENT_SIZE = 100;

  /**
   * constant for minimum elements size
   */
  static MIN_HEIGHT: number = 20;

  /**
   * constant for minimum elements size
   */
  static MIN_WIDTH: number = 20;

  static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      var img = new Image();
      img.onload = (e) => {
        img.onload = null;
        img.onerror = null;
        resolve(img);
      }
      img.onerror = (e: Event) => {
        img.onload = null;
        img.onerror = null;
        reject(e);
      }
      img.src = url;
    });
  }

  constructor(public model: Model, public view: View) {}

  /**
   * get num tabs
   * example: getTabs(2) returns '        '
   */
  getTabs(num: number): string {
    let tabs = '';
    for (let n = 0; n < num; n++) {
      tabs += '    ';
    }
    return tabs;
  }

  /**
   * for properties or style which are to be applied to elements
   * but in the case of a section not to the internal container, only the whole
   * section this method will return the element or the section when the element
   * is a section container
   */
  noSectionContent(element) {
    if (this.isSectionContent(element)) {
      return (element.parentElement as HTMLElement);
    }
    return element;
  }

  /**
   * get/set type of the element
   * @param element   created by silex, either a text box, image, ...
   * @return           the type of element
   * example: for a container this will return "container"
   */
  getType(element: HTMLElement): string {
    return element.getAttribute(Constants.TYPE_ATTR);
  }

  /**
   * @param element   created by silex
   * @return true if `element` is a an element's content (the element in an
   *     image, html box, section...)
   */
  isElementContent(element: HTMLElement): boolean {
    return element.classList.contains(Constants.ELEMENT_CONTENT_CLASS_NAME);
  }

  /**
   * @param element   created by silex
   * @return true if `element` is a section
   */
  isSection(element: HTMLElement): boolean {
    if (!element || !element.classList) {
      return false;
    }
    return element.classList.contains(Constants.TYPE_SECTION);
  }

  /**
   * @param element   created by silex
   * @return true if `element` is the content container of a section
   */
  isSectionContent(element: HTMLElement): boolean {
    if (!element || !element.classList) {
      return false;
    }

    // FIXME: this is a workaround, it happens in mobile editor, when
    // dragg/dropping (element is document)
    return element.classList.contains(Constants.TYPE_CONTAINER_CONTENT);
  }

  /**
   * get/set the "hide on mobile" property
   * @return true if the element is hidden on mobile
   */
  getHideOnMobile(element: HTMLElement): boolean {
    if (!element || !element.classList) {
      return false;
    }

    // FIXME: this is a workaround, it happens in mobile editor, when
    // dragg/dropping (element is document)
    return this.noSectionContent(element).classList.contains(
        Constants.HIDE_ON_MOBILE);
  }

  /**
   * get/set the "hide on mobile" property
   * @param hide, true if the element has to be hidden on mobile
   */
  setHideOnMobile(element: HTMLElement, hide: boolean) {
    if (hide) {
      this.noSectionContent(element).classList.add(Constants.HIDE_ON_MOBILE);
    } else {
      this.noSectionContent(element).classList.remove(Constants.HIDE_ON_MOBILE);
    }
  }

  /**
   * get/set the "hide on desktop" property
   * @return true if the element is hidden on desktop
   */
  getHideOnDesktop(element: HTMLElement): boolean {
    if (!element || !element.classList) {
      return false;
    }

    // FIXME: this is a workaround, it happens in mobile editor, when
    // dragg/dropping (element is document)
    return this.noSectionContent(element).classList.contains(
        Constants.HIDE_ON_DESKTOP);
  }

  /**
   * get/set the "hide on desktop" property
   * @param hide, true if the element has to be hidden on desktop
   */
  setHideOnDesktop(element: HTMLElement, hide: boolean) {
    if (hide) {
      this.noSectionContent(element).classList.add(Constants.HIDE_ON_DESKTOP);
    } else {
      this.noSectionContent(element).classList.remove(Constants.HIDE_ON_DESKTOP);
    }
  }

  /**
   * get all the element's styles
   * @param element   created by silex, either a text box, image, ...
   * @return           the styles of the element
   */
  getAllStyles(element: HTMLElement): string {
    let styleObject = this.model.property.getStyle(element);
    let styleStr = Style.styleToString(styleObject);
    return styleStr;
  }

  /**
   * get/set style of the element
   * @param element   created by silex, either a text box, image, ...
   * @param styleName  the style name
   * @return           the style of the element
   */
  getStyle(element: HTMLElement, cssName: string): string {
    const isMobile = this.view.workspace.getMobileEditor();
    let styleObject = this.model.property.getStyle(element, isMobile);
    if (styleObject && styleObject[cssName]) {
      return styleObject[cssName];
    } else {
      if (isMobile) {
        // get the non mobile style if it is not defined in mobile
        styleObject = this.model.property.getStyle(element, false);
        if (styleObject && styleObject[cssName]) {
          return styleObject[cssName];
        }
      }
    }
    return null;
  }

  /**
   * get/set style of element from a container created by silex
   * @param element            created by silex, either a text box, image, ...
   * @param  styleName          the style name, camel case, not css with dashes
   * @param  opt_styleValue     the value for this styleName
   * @param  opt_preserveJustAdded     if true, do not remove the "just added"
   *     css class, default is false
   */
  setStyle(element: HTMLElement, styleName: string, opt_styleValue?: string, opt_preserveJustAdded?: boolean) {
    // convert to css case
    styleName = styleName;

    // retrieve style
    let styleObject = this.model.property.getStyle(element);
    if (!styleObject) {
      styleObject = {};
    }

    // apply the new style
    if (styleObject[styleName] !== opt_styleValue) {
      if (opt_styleValue !== null) {
        styleObject[styleName] = opt_styleValue;
      } else {
        styleObject[styleName] = '';
      }
      this.model.property.setStyle(element, styleObject);
    }
  }

  /**
   * get/set a property of an element from a container created by silex
   * @param element            created by silex, either a text box, image, ...
   * @param  propertyName          the property name
   * @param  opt_propertyValue     the value for this propertyName
   * @param  opt_applyToContent    apply to the element or to its
   *     ".silex-element-content" element
   * example: element.setProperty(imgElement, 'style', 'top: 5px; left: 30px;')
   */
  setProperty(
      element: HTMLElement, propertyName: string,
      opt_propertyValue?: string, opt_applyToContent?: boolean) {
    if (opt_applyToContent) {
      element = this.getContentNode(element);
    }
    if (opt_propertyValue !== null) {
      element.setAttribute(propertyName, (opt_propertyValue as string));
    } else {
      element.removeAttribute(propertyName);
    }
  }

  /**
   * @param url    URL of the image chosen by the user
   */
  setBgImage(element: HTMLElement, url: string) {
    if (url) {
      this.setStyle(element, 'background-image', Url.addUrlKeyword(url));
    } else {
      this.setStyle(element, 'background-image');
    }

    // redraw tools
    this.model.body.setSelection(this.model.body.getSelection());
  }

  /**
   * get/set html from a container created by silex
   * @param element  created by silex, either a text box, image, ...
   * @return  the html content
   */
  getInnerHtml(element: HTMLElement): string {
    let innerHTML = this.getContentNode(element).innerHTML;

    // put back executable scripts
    innerHTML = Dom.reactivateScripts(innerHTML);
    return innerHTML;
  }

  /**
   * get/set element from a container created by silex
   * @param element  created by silex, either a text box, image, ...
   * @param innerHTML the html content
   */
  setInnerHtml(element: HTMLElement, innerHTML: string) {
    // get the container of the html content of the element
    let contentNode = this.getContentNode(element);

    // deactivate executable scripts
    innerHTML = Dom.deactivateScripts(innerHTML);

    // set html
    contentNode.innerHTML = innerHTML;
  }

  /**
   * get/set element from a container created by silex
   * @param element  created by silex, either a text box, image, ...
   * @return  the element which holds the content, i.e. a div, an image, ...
   */
  getContentNode(element: HTMLElement): HTMLElement {
    return element.querySelector(':scope > .' + Constants.ELEMENT_CONTENT_CLASS_NAME) || element;
  }

  /**
   * move the element up/down the DOM
   */
  move(element: HTMLElement, direction: DomDirection) {
    // do not move a section's container content, but the section itself
    element = this.noSectionContent(element);
    switch (direction) {
      case DomDirection.UP:
        let nextSibling = this.getNextElement(element, true);
        if (nextSibling) {
          // insert after
          element.parentElement.insertBefore(nextSibling, element);
        }
        break;
      case DomDirection.DOWN:
        let prevSibling = this.getNextElement(element, false);
        if (prevSibling) {
          // insert before
          element.parentElement.insertBefore(prevSibling, element.nextSibling);
        }
        break;
      case DomDirection.TOP:
        element.parentElement.appendChild(element);
        break;
      case DomDirection.BOTTOM:
        element.parentElement.insertBefore(
            element, element.parentElement.childNodes[0]);
        break;
    }
    this.view.stageWrapper.redraw();
  }

  /**
   * get the previous or next element in the DOM, which is a Silex element
   * @param forward if true look for the next element, if false for the previous
   */
  getNextElement(element: HTMLElement, forward: boolean): HTMLElement {
    let node = (element as Node);
    while (node = forward ? node.nextSibling : node.previousSibling) {
      if (node.nodeType === 1) {
        const el = (node as HTMLElement);

        // candidates are the elements which are visible in the current page, or
        // visible everywhere (not paged)
        if (this.getType(el) !== null &&
            (this.model.page.isInPage(el) ||
             this.model.page.getPagesForElement(el).length === 0)) {
          return el;
        }
      }
    }
    return null;
  }

  /**
   * set/get the image URL of an image element
   * @param element  container created by silex which contains an image
   * @return  the url of the image
   */
  getImageUrl(element: HTMLElement): string {
    let url = '';
    if (element.getAttribute(Constants.TYPE_ATTR) === Constants.TYPE_IMAGE) {
      // get the image tag
      let img = this.getContentNode(element);
      if (img) {
        url = img.getAttribute('src');
      } else {
        console.error(
            'The image could not be retrieved from the element.', element);
      }
    } else {
      console.error('The element is not an image.', element);
    }
    return url;
  }

  /**
   * set/get the image URL of an image element
   * @param element  container created by silex which contains an image
   * @param url  the url of the image
   * @param opt_callback the callback to be notified when the image is loaded
   * @param opt_errorCallback the callback to be notified of errors
   */
  async setImageUrl(
      element: HTMLElement, url: string,
      opt_callback?: ((p1: HTMLElement, p2: HTMLElement) => void),
      opt_errorCallback?: ((p1: HTMLElement, p2: string) => void)) {
    if (element.getAttribute(Constants.TYPE_ATTR) === Constants.TYPE_IMAGE) {
      // get the image tag
      const img = this.getContentNode(element) as HTMLImageElement;
      if (img) {
        // add loading asset
        element.classList.add(Constants.LOADING_ELEMENT_CSS_CLASS);

        // remove previous img tag
        let imgTags = element.querySelectorAll('img.' + Constants.ELEMENT_CONTENT_CLASS_NAME);
        while (imgTags.length > 0) {
          imgTags[0].parentElement.removeChild(imgTags[0]);
        }

        try {
          // load the new image
          const loadedImg: HTMLImageElement = await SilexElement.loadImage(url);

          // update element size
          this.setStyle(element, 'width', Math.max(SilexElement.MIN_WIDTH, loadedImg.naturalWidth) + 'px', true);
          this.setStyle(element, this.getHeightStyleName(element), Math.max(SilexElement.MIN_HEIGHT, loadedImg.naturalHeight) + 'px', true);

          // callback
          if (opt_callback) {
            opt_callback(element, loadedImg);
          }

          // add the image to the element
          element.appendChild(loadedImg);

          // add a marker to find the inner content afterwards, with
          // getContent
          loadedImg.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);

          // remove loading asset
          element.classList.remove(Constants.LOADING_ELEMENT_CSS_CLASS);

          // redraw tools
          this.model.body.setSelection(this.model.body.getSelection());
          this.view.stageWrapper.redraw();
        }
        catch(e) {
          console.error('An error occured while loading the image.', element, e);

          // callback
          if (opt_errorCallback) {
            opt_errorCallback(element, 'An error occured while loading the image.');
          }
        }
      } else {
        console.error(
            'The image could not be retrieved from the element.', element);
        if (opt_errorCallback) {
          opt_errorCallback(
              element, 'The image could not be retrieved from the element.');
        }
      }
    } else {
      console.error('The element is not an image.', element);
      if (opt_errorCallback) {
        opt_errorCallback(element, 'The element is not an image.');
      }
    }
  }

  /**
   * remove a DOM element and its styles as well as its children's
   * @param element   the element to remove
   */
  removeElement(rootElement: HTMLElement) {
    // never delete sections container content, but the section itself
    rootElement = this.noSectionContent(rootElement);

    const children = Array.from(rootElement.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`));

    children.concat([rootElement])
    .forEach((element: HTMLElement) => {
      // check this is allowed, i.e. an element inside the stage container
      if (this.model.body.getBodyElement() !== element && !!element.parentElement) {
        // remove style and component data
        this.model.property.setElementComponentData(element);
        this.model.property.setStyle(element, null, true);
        this.model.property.setStyle(element, null, false);

        // remove the element
        element.parentElement.removeChild(element);

        // update stage store
        this.view.stageWrapper.removeElement(element);
      } else {
        // could not delete element because it is not in the stage element
        // this happens when you select an element and its children and delete them all
      }
    });
    // update all metrics in case this new element has moved other elements
    this.view.stageWrapper.redraw();
  }

  /**
   * append an element to the stage
   * handles undo/redo
   */
  addElement(container: HTMLElement, element: HTMLElement) {
    // for sections, force body
    if (this.isSection(element)) {
      container = this.model.body.getBodyElement();
    }
    container.appendChild(element);

    // resize the body
    // call the method defined in front-end.js
    // this will resize the body according to its content
    // it will also trigger a "silex.resize" event
    this.model.file.getContentWindow()['silex']['resizeBody']();

    // update all metrics in case this new element has moved other elements
    this.view.stageWrapper.redraw();
  }

  /**
   * add an element at the center of the stage
   * and move it into the container beneeth it
   * @param element    the element to add
   * @param opt_offset an offset to apply to its position (x and y)
   */
  addElementDefaultPosition(element: HTMLElement, opt_offset: number = 0) {
    const scrollData = this.view.stageWrapper.getScroll();

    // find the container (main background container or the stage)
    const stageSize = getUiElements().stage.getBoundingClientRect();
    const bb = this.model.property.getBoundingBox([element]);
    const posX = Math.round(stageSize.width / 2 - bb.width / 2);
    const posY = Math.round(stageSize.height / 2 - bb.height / 2);
    const container = this.view.stageWrapper.getDropZone(posX, posY, element) || this.model.body.getBodyElement();
    // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
    const bbContainer = element.getBoundingClientRect();
    const offsetX = posX + scrollData.x - bbContainer.left;
    const offsetY = posY + scrollData.y - bbContainer.top;

    // add to stage
    this.addElement(container, element);

    // apply the style (force desktop style, not mobile)
    const styleObject = this.model.property.getStyle(element, false);
    styleObject.top = opt_offset + offsetY + 'px';
    styleObject.left = opt_offset + offsetX + 'px';
    this.model.property.setStyle(element, styleObject, false);
  }

  /**
   * init the element depending on its type
   */
  initElement(element: HTMLElement) {
    // default style
    let defaultStyle = {};
    defaultStyle['width'] = SilexElement.INITIAL_ELEMENT_SIZE + 'px';
    defaultStyle[this.getHeightStyleName(element)] = SilexElement.INITIAL_ELEMENT_SIZE + 'px';

    // init the element depending on its type
    switch (this.getType(element)) {
      case Constants.TYPE_CONTAINER:
      case Constants.TYPE_HTML:
        if (!this.isSection(element)) {
          defaultStyle['background-color'] = 'rgb(255, 255, 255)';
        }
        break;
      case Constants.TYPE_TEXT:
      case Constants.TYPE_IMAGE:
        break;
    }

    // special case of section content
    if (this.isSectionContent(element)) {
      // no bg color for the content container
      defaultStyle['background-color'] = '';

      // no width either, it will take the .website-width
      // the default one from front-end.css or the one in the settings
      defaultStyle['width'] = '';
    }

    // default style to the element style
    // keep the style if there is one, usually set by component::initComponent
    const finalStyle = this.model.property.getStyle(element, false) || {};
    for (let name in defaultStyle) {
      finalStyle[name] = finalStyle[name] || defaultStyle[name];
    }

    // apply the style (force desktop style, not mobile)
    this.model.property.setStyle(element, finalStyle, false);

    // add the element to the stage
    if (this.isSection(element)) {
      this.addElement(this.model.body.getBodyElement(), element);
      // send the scroll to the target
      this.view.stageWrapper.center([element]);
    } else {
      if (!this.isElementContent(element)) {
        // add to the stage at the right position
        // and in the right container
        this.addElementDefaultPosition(element);
      }
    }

    // update stage store
    this.view.stageWrapper.addElement(element);
  }

  /**
   * element creation
   * create a DOM element, attach it to this container
   * and returns a new component for the element
   * @param type  the type of the element to create,
   *    see TYPE_* constants of the class @see silex.model.Element
   * @return   the newly created element
   */
  createElement(type: string): HTMLElement {
    // create the element
    let element = null;
    switch (type) {
      // container
      case Constants.TYPE_CONTAINER:
        element = this.createContainerElement();
        break;

      // section
      case Constants.TYPE_SECTION:
        element = this.createSectionElement();
        break;

      // text
      case Constants.TYPE_TEXT:
        element = this.createTextElement();
        break;

      // HTML box
      case Constants.TYPE_HTML:
        element = this.createHtmlElement();
        break;

      // Image
      case Constants.TYPE_IMAGE:
        element = this.createImageElement();
        break;
    }
    // init the element
    element.classList.add(Constants.EDITABLE_CLASS_NAME);
    this.model.property.initSilexId(element, this.model.file.getContentDocument());

    // add css class for Silex styles
    element.classList.add(type);

    // return the element
    return element;
  }

  /**
   * element creation method for a given type
   * called from createElement
   */
  createContainerElement(): HTMLElement {
    // create the conatiner
    let element = this.model.file.getContentDocument().createElement('div');
    element.setAttribute(Constants.TYPE_ATTR, Constants.TYPE_CONTAINER);
    return element;
  }

  createElementWithContent(className: string): HTMLElement {
    // create the element
    let element = this.model.file.getContentDocument().createElement('div');
    element.setAttribute(Constants.TYPE_ATTR, className);

    // create the container for text content
    let content = this.model.file.getContentDocument().createElement('div');

    // add empty content
    element.appendChild(content);

    // add a marker to find the inner content afterwards, with getContent
    content.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);

    // done
    return element;
  }

  /**
   * element creation method for a given type
   * called from createElement
   */
  createSectionElement(): HTMLElement {
    // create the element
    let element = this.model.file.getContentDocument().createElement('div');
    element.setAttribute(Constants.TYPE_ATTR, Constants.TYPE_CONTAINER);
    element.classList.add(Constants.PREVENT_DRAGGABLE_CLASS_NAME);
    element.classList.add(Constants.PREVENT_RESIZABLE_CLASS_NAME);
    element.classList.add(Constants.TYPE_CONTAINER);

    // content element is both a container and a content element
    let content = this.createElement(Constants.TYPE_CONTAINER);
    content.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);
    content.classList.add(Constants.TYPE_CONTAINER_CONTENT);
    content.classList.add(Constants.WEBSITE_WIDTH_CLASS_NAME);
    content.classList.add(Constants.PREVENT_DRAGGABLE_CLASS_NAME);
    element.appendChild(content);
    this.initElement(content);

    // done
    return element;
  }

  /**
   * element creation method for a given type
   * called from createElement
   */
  createTextElement(): HTMLElement {
    // create the element
    let element = this.createElementWithContent(Constants.TYPE_TEXT);

    // add default content
    let content = this.getContentNode(element);
    content.innerHTML = '<p>New text box</p>';

    // add normal class for default text formatting
    // sometimes there is only in text node in content
    // e.g. whe select all + remove formatting
    content.classList.add('normal');

    // done
    return element;
  }

  /**
   * element creation method for a given type
   * called from createElement
   */
  createHtmlElement(): HTMLElement {
    // create the element
    let element = this.model.file.getContentDocument().createElement('div');
    element.setAttribute(Constants.TYPE_ATTR, Constants.TYPE_HTML);

    // create the container for html content
    let htmlContent = this.model.file.getContentDocument().createElement('div');
    htmlContent.innerHTML = '<p>New HTML box</p>';
    element.appendChild(htmlContent);

    // add a marker to find the inner content afterwards, with getContent
    htmlContent.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);
    return element;
  }

  /**
   * element creation method for a given type
   * called from createElement
   */
  createImageElement(): HTMLElement {
    // create the element
    let element = this.model.file.getContentDocument().createElement('div');
    element.setAttribute(Constants.TYPE_ATTR, Constants.TYPE_IMAGE);
    return element;
  }

  /**
   * set/get a "silex style link" on an element
   * @param opt_link an URL
   *         or an internal link (beginning with #!)
   *         or null to remove the link
   */
  setLink(element: HTMLElement, opt_link?: string) {
    if (opt_link) {
      element.setAttribute(Constants.LINK_ATTR, opt_link);
    } else {
      element.removeAttribute(Constants.LINK_ATTR);
    }
  }

  /**
   * set/get a "silex style link" on an element
   */
  getLink(element: HTMLElement): string {
    return element.getAttribute(Constants.LINK_ATTR);
  }

  /**
   * get/set class name of the element of a container created by silex
   * remove all silex internal classes
   * @param element   created by silex, either a text box, image, ...
   * @return           the value for this styleName
   */
  getClassName(element: HTMLElement): string {
    const pages = this.model.page.getPages();
    let componentCssClasses = [];
    if (this.model.component.isComponent(element)) {
      const templateName =
          (this.model.property.getElementComponentData(
               element)['templateName'] as TemplateName);
      componentCssClasses = this.model.component.getCssClasses(templateName);
    }
    return element.className.split(' ')
        .filter((name) => {
          if (name === '' ||
              Constants.SILEX_CLASS_NAMES.indexOf(name) > -1 ||
              pages.indexOf(name) > -1 ||
              componentCssClasses.indexOf(name) > -1 ||
              this.model.property.getSilexId(element) === name) {
            return false;
          }
          return true;
        })
        .join(' ');
  }

  /**
   * get/set class name of the element of a container created by silex
   * remove all silex internal classes
   * @param element   created by silex, either a text box, image, ...
   * @param opt_className  the class names, or null to reset
   */
  setClassName(element: HTMLElement, opt_className?: string) {
    // compute class names to keep, no matter what
    // i.e. the one which are in element.className + in Silex internal classes
    let pages = this.model.page.getPages();
    let classNamesToKeep =
        element.className.split(' ').map((name) => {
          if (Constants.SILEX_CLASS_NAMES.indexOf(name) > -1 ||
              pages.indexOf(name) > -1 ||
              this.model.property.getSilexId(element) === name) {
            return name;
          }
        });

    // reset element class name
    element.className = classNamesToKeep.join(' ');
    if (opt_className) {
      // apply classes from opt_className
      opt_className.split(' ').forEach((name) => {
        name = name.trim();
        if (name && name !== '') {
          element.classList.add(name);
        }
      });
    }
  }

  /**
   * get the name of the style to be used to set the height of the element
   * returns 'height' or 'minHeight' depending on the element type
   * @return 'height' or 'minHeight' depending on the element type
   */
  getHeightStyleName(element: HTMLElement): string {
    if (element.classList.contains(Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT)) {
      return 'height';
    }
    return 'min-height';
  }
}
