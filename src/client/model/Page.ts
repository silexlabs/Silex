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
 *   This class represents a the page model of the html file being edited
 *   It has methods to manipulate the pages
 *
 */

import { Constants } from '../../Constants';
import { Model, View } from '../types';
import { SilexNotification } from '../utils/Notification';

/**
 * structure to store all of a page data
 * @struct
 */
export class PageData {
  name: string = '';
  displayName: string = '';
  linkName: string = '';
  idx: number = -1;
}

/**
 * @param model  model class which holds the other models
 * @param view  view class which holds the other views
 */
export class Page {
  constructor(public model: Model, public view: View) {}

  /**
   * retrieve the first parent which is visible only on some pages
   * @return null or the element or one of its parents which has the css class
   *     silex.model.Constants.PAGED_CLASS_NAME
   */
  getParentPage(element: HTMLElement): HTMLElement {
    let parent = element.parentElement as HTMLElement;
    while (parent && !parent.classList.contains(Constants.PAGED_CLASS_NAME)) {
      parent = parent.parentElement as HTMLElement;
    }
    return (parent as HTMLElement | null);
  }

  /**
   * get the pages from the dom
   * @return an array of the page names I have found in the DOM
   */
  getPages(): string[] {
    // retrieve all page names from the head section
    const pages = [];
    const bodyElement = this.model.body.getBodyElement();
    if (!bodyElement) {
      console.warn('Can not get pages, the body element is null');
      return [];
    }
    const elements = bodyElement.querySelectorAll(`a[data-silex-type="${Constants.TYPE_PAGE}"]`);
    elements.forEach((element) => {
      pages.push(element.getAttribute('id'));
    });
    return pages;
  }

  /**
   * get the currently opened page from the dom
   * @return name of the page currently opened
   */
  getCurrentPage(): string {
    // tslint:disable:no-string-literal
    if (!this.model.file.getContentWindow()['jQuery']) {
      throw new Error('JQuery not loaded in the opened website');
    }
    const bodyElement = this.model.body.getBodyElement();
    let pageName = null;
    try {
      if (this.model.file.getContentWindow()['jQuery'](bodyElement).pageable) {
        pageName = this.model.file.getContentWindow()['jQuery'](bodyElement).pageable('option', 'currentPage');
      }
    } catch (e) {
      // there was a problem in the pageable plugin, return the first page
      console.warn(
          `warning, could not retrieve the current page, I will return the first page (${
              this.getPages()})`);
      pageName = this.getPages()[0];
    }
    return pageName;
  }

  /**
   * refresh the view
   */
  refreshView() {
    const pages = this.getPages();
    const currentPage = this.getCurrentPage();
    const selectedElements = this.model.body.getSelection();
    const states = this.view.stageWrapper.getSelection();
    this.view.contextMenu.redraw(selectedElements, pages, currentPage);
    this.view.pageTool.redraw(selectedElements, pages, currentPage);
    this.view.propertyTool.redraw(states, pages, currentPage);
    this.view.textFormatBar.redraw(selectedElements, pages, currentPage);

    // visibility of elements has changed
    this.view.stageWrapper.reset();
  }

  /**
   * open the page
   * this is a static method, a helper
   * @param pageName   name of the page to open
   */
  setCurrentPage(pageName: string) {
    // tslint:disable:no-string-literal
    const bodyElement = this.model.body.getBodyElement();
    if (this.model.file.getContentWindow()['jQuery'](bodyElement).pageable) {
      this.model.file.getContentWindow()['jQuery'](bodyElement).pageable({
        currentPage: pageName,
      });
    }
    this.refreshView();
  }

  /**
   * get a page from the dom by its name
   * @param pageName  a page name
   * @return the page corresponding to the given page name
   */
  getDisplayName(pageName: string): string {
    let displayName = '';
    const pageElement = this.model.file.getContentDocument().getElementById(pageName);
    if (pageElement) {
      displayName = pageElement.innerHTML;
    }
    return displayName;
  }

  /**
   * remove a page from the dom
   * elements which are only in this page should be deleted
   */
  removePage(pageName: string) {
    let pages = this.getPages();
    if (pages.length < 2) {
      SilexNotification.alert('Error', 'I can not delete this page because <strong>it is the only page</strong>.', () => {});
    } else {
      const pageElement = this.model.body.getBodyElement()
        .querySelector(`a[data-silex-type="${Constants.TYPE_PAGE}"][id="${pageName}"]`) as HTMLAnchorElement;
      if (pageElement) {
        if (pageElement.hasAttribute(Constants.PAGE_PREVENT_DELETE)) {
          SilexNotification.alert('Error', 'I can not delete this page because <strong>it is a protected page</strong>.', () => {});
        } else {
          // remove the DOM element
          pageElement.parentElement.removeChild(pageElement);

          // remove the links to this page
          const linkElements = Array.from(this.model.body.getBodyElement().querySelectorAll('*[data-silex-href="#!' + pageName + '"]'));
          linkElements.forEach((element) => {
            element.removeAttribute('data-silex-href');
          });

          // check elements which were only visible on this page
          // and returns them in this case
          const elementsOnlyOnThisPage = [];
          const elementsOfThisPage = Array.from(this.model.body.getBodyElement().getElementsByClassName(pageName));
          elementsOfThisPage.forEach((element: HTMLElement) => {
            element.remove();
            const pagesOfElement = this.getPagesForElement(element);
            if (pagesOfElement.length <= 0) {
              elementsOnlyOnThisPage.push(element);
            }
          });

          // update the page list
          pages = this.getPages();

          // open default/first page
          this.setCurrentPage(pages[0]);

          // handle elements which should be deleted
          if (elementsOnlyOnThisPage.length > 0) {
            const pageDisplayName = this.getDisplayName(pageName);
            SilexNotification.confirm('Delete elements' , `
          ${elementsOnlyOnThisPage.length} elements were only visible on this page (${pageDisplayName}).
          <br /><ul>
            <li>Do you want me to <strong>delete these elements?</strong><br /></li>
            <li>or keep them and <strong>make them visible on all pages?</strong></li>
          </ul>
        `,
              (accept) => {
                elementsOnlyOnThisPage.forEach((element) => {
                  if (accept) {
                    // remove these elements
                    this.model.element.removeElement(element);
                  } else {
                    // remove from this page
                    this.removeFromAllPages(element);
                  }
                });
              },
              'delete', 'keep');
          }
        }
      } else {
        SilexNotification.alert('Error', `I could not delete this page: page ${pageName} not found.`, () => {});
      }
    }
  }

  /**
   * move a page in the dom
   * @param direction up or down
   */
  movePage(pageName: string, direction: string) {
    if (direction !== 'up' && direction !== 'down') {
      throw new Error('wrong direction ' + direction + ', can not move page');
    }
    const elements = this.model.body.getBodyElement().querySelectorAll(`a[data-silex-type="${Constants.TYPE_PAGE}"]`);
    let prevEl = null;
    for (const el of elements) {
      if (prevEl
        && (el.id === pageName && direction === 'up'
        || prevEl.id === pageName && direction === 'down')) {
        el.parentElement.insertBefore(el, prevEl);
        const pages = this.getPages();
        const currentPage = this.getCurrentPage();
        this.view.pageTool.redraw(this.model.body.getSelection(), pages, currentPage);
        return;
      }
      prevEl = el;
    }
    console.error('page could not be moved', pageName, direction, prevEl);
  }

  /**
   * add a page to the dom
   */
  createPage(name: string, displayName: string) {
    const container = this.model.body.getBodyElement().querySelector('.' + Constants.PAGES_CONTAINER_CLASS_NAME);

    // create the DOM element
    const aTag = this.model.file.getContentDocument().createElement('a');
    aTag.setAttribute('id', name);
    aTag.setAttribute('href', '#!' + name);
    aTag.setAttribute('data-silex-type', Constants.TYPE_PAGE);
    aTag.innerHTML = displayName;
    container.appendChild(aTag);

    // for coherence with other silex elements
    aTag.classList.add(Constants.TYPE_PAGE);

    // select this page
    this.setCurrentPage(name);
  }

  /**
   * rename a page in the dom
   */
  renamePage(oldName: string, newName: string, newDisplayName: string) {
    const bodyElement = this.model.body.getBodyElement();

    // update the DOM element
    const pageElement = this.model.body.getBodyElement()
      .querySelector(`a[data-silex-type="${Constants.TYPE_PAGE}"][id="${oldName}"]`) as HTMLAnchorElement;
    if (pageElement.hasAttribute(Constants.PAGE_PREVENT_RENAME)) {
      SilexNotification.alert('Error', 'I can not rename this page because <strong>it is a protected page</strong>.', () => {});
    } else {
      pageElement.setAttribute('id', newName);
      pageElement.setAttribute('href', '#!' + newName);
      pageElement.innerHTML = newDisplayName;

      // update the links to this page
      const linkElements = Array.from(bodyElement.querySelectorAll(`*[data-silex-href="#!${oldName}"]`));
      linkElements.forEach((element) => {
        element.setAttribute('data-silex-href', '#!' + newName);
      });

      // update the visibility of the compoents
      const componentElements = Array.from(bodyElement.getElementsByClassName(oldName));
      componentElements.forEach((element) => {
        element.classList.remove(oldName);
        element.classList.add(newName);
      });

      // wait until the dom reflects the changes
      setTimeout(() => {
        // select this page
        this.setCurrentPage(newName);
      }, 100);
    }
  }

  /**
   * set/get a the visibility of an element in the given page
   * remove from all pages if visible in all pages
   */
  addToPage(element: HTMLElement, pageName: string) {
    if (this.isInPage(element, pageName)) {
      console.error('Element is already in page', element, pageName);
      return;
    }
    element = this.model.element.noSectionContent(element);
    const pages = this.getPagesForElement(element);
    if (pages.length + 1 === this.getPages().length) {
      // from visible in some pages to visible everywhere
      this.removeFromAllPages(element);
    } else {
      element.classList.add(pageName);
      element.classList.add(Constants.PAGED_CLASS_NAME);
      if (pages.length === 0) {
        // from visible visible everywhere to visible in some pages
        if (pageName !== this.getCurrentPage()) {
          this.view.stageWrapper.removeElement(element);
        } else {
          this.refreshView();
        }
      } else if (pageName === this.getCurrentPage()) {
        // from visible in some pages to visible in this page
        console.warn('How is this possible?');
        this.view.stageWrapper.addElement(element);
      } else {
        console.warn('How is this possible?');
        this.refreshView();
      }
    }
  }

  /**
   *
   */
  removeFromPage(element: HTMLElement, pageName: string) {
    if (!this.isInPage(element, pageName)) {
      console.error('Element is not in page', element, pageName);
      return;
    }
    element = this.model.element.noSectionContent(element);
    const pages = this.getPagesForElement(element);
    if (pages.length - 1 === 0) {
      // from visible in some pages to visible everywhere
      this.removeFromAllPages(element);
    } else {
      if (pageName === this.getCurrentPage()) {
        // update stage store
        this.view.stageWrapper.removeElement(element);
      } else {
        this.refreshView();
      }
      element.classList.add(Constants.PAGED_CLASS_NAME);
      element.classList.remove(pageName);
    }
  }

  /**
   *
   */
  removeFromAllPages(element: HTMLElement) {
    element = this.model.element.noSectionContent(element);
    const wasVisible = this.isVisible(element);
    const pages = this.getPagesForElement(element);
    pages.forEach((pageName) => {
      element.classList.remove(pageName);
    });

    // the element is not "paged" anymore
    element.classList.remove(Constants.PAGED_CLASS_NAME);

    if (!wasVisible) {
      // update stage store
      this.view.stageWrapper.addElement(element);
    } else {
      this.refreshView();
    }
  }

  /**
   * get the pages on which this element is visible
   */
  getPagesForElement(element: HTMLElement): string[] {
    element = this.model.element.noSectionContent(element);
    return this.getPages().filter(
        (pageName) => element.classList.contains(pageName));
  }

  /**
   * get all elements visible when the given page is opened
   */
  getElementsForPage(page: string = this.getCurrentPage(), includeHideDesktop = this.view.workspace.getMobileEditor(), includeHideMobile = !this.view.workspace.getMobileEditor()): HTMLElement[] {
    return (Array.from(this.model.file.getContentDocument().querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`)) as HTMLElement[])
    .filter((el) => this.isVisible(el, page) &&
      (includeHideDesktop || !this.model.element.getHideOnDesktop(el)) &&
      (includeHideMobile || !this.model.element.getHideOnMobile(el)));
  }

  /**
   * check if an element is in the given page (current page by default)
   */
  isInPage(element: HTMLElement, opt_pageName: string = this.getCurrentPage()): boolean {
    element = this.model.element.noSectionContent(element);
    return element.classList.contains(opt_pageName);
  }

  /**
   * check if an element is visible in the given page
   * this means that the element is allways visible or it is visible in this page
   */
  isVisible(element: HTMLElement, opt_pageName: string = this.getCurrentPage()) {
    if (element.classList.contains(Constants.PAGED_CLASS_NAME) && !this.isInPage(element, opt_pageName)) {
      return false;
    }
    const parentPaged = this.getParentPage(element);
    return !parentPaged || (this.isInPage(parentPaged, opt_pageName) && this.isVisible(parentPaged, opt_pageName));
  }
}
