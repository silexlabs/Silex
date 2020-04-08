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
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the element visibility on the pages,
 *   and also the element "link to page" property
 *
 */

import { Constants } from '../../../constants';
import { Dom } from '../../utils/Dom';
import { ElementData, LinkType } from '../../element/types';
import { PageData } from '../../page/types'
import { PaneBase } from './PaneBase';
import { getCurrentPage } from '../../page/filters';
import { getDomElement } from '../../element/dom';
import { getSelectedElements, noSectionContent } from '../../element/filters'
import { getSite } from '../../site/store'
import { getSiteDocument } from '../../components/SiteFrame';
import { getStage } from '../StageWrapper';
import { removeLink, addLink, addToPage, removeFromPage } from '../../element/dispatchers'
import { subscribePages, getPages } from '../../page/store'
import { subscribeUi, getUi } from '../../ui/store'
import { updateElements, getElements } from '../../element/store'

/**
 * on of Silex Editors class
 * const user edit style of components
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class PagePane extends PaneBase {

  /**
   * dropdown list to select a link
   * link, select page or enter custom link
   */
  linkDropdown: HTMLInputElement;

  /**
   * text field used to type an external link
   */
  linkInputTextField: HTMLInputElement;

  /**
   * check box "view on mobile"
   */
  viewOnDeviceEl: HTMLDivElement = null;

  /**
   * check box "view on all pages"
   */
  viewOnAllPagesCheckbox: HTMLInputElement = null;

  /**
   * Array of checkboxes used to add/remove the element from pages
   */
  pageCheckboxes: { checkbox: HTMLInputElement, page: PageData }[] = null;

  constructor(element: HTMLElement) {

    super(element);

    // init the component
    this.buildUi();

    subscribePages(() => {
      if (getStage()) {
        this.redraw(getSelectedElements());
      }
    })
    subscribeUi(() => {
      if (getStage()) {
        this.redraw(getSelectedElements());
      }
    })
  }

  /**
   * build the UI
   */
  buildUi() {
    this.linkDropdown = this.element.querySelector('.link-combo-box');
    this.linkDropdown.onchange = () => this.onLinkChanged();
    this.linkInputTextField = this.element.querySelector('.link-input-text');

    // hide by default
    this.linkInputTextField.style.display = 'none';

    // Watch for field changes, to display below.
    this.linkInputTextField.oninput = () => this.onLinkTextChanged();
    this.viewOnDeviceEl = (this.element.querySelector('.view-on-mobile') as HTMLDivElement);
    this.viewOnDeviceEl.onclick = (e) => {
      const selected: HTMLInputElement = this.element.querySelector('.view-on-mobile input:checked');
      const value = selected.value;
      const desktop = value !== 'mobile'
      const mobile = value !== 'desktop'
      // stopStageObserver() // prevent reset selection
      updateElements(getElements()
        .map((el) => noSectionContent(el))
        .filter((el) => el.selected && (el.visibility.desktop !== desktop || el.visibility.mobile !== mobile))
        .map((el) => ({
          from: el,
          to: {
            ...el,
            selected: getUi().mobileEditor ? mobile : desktop,
            visibility: {
              desktop,
              mobile,
            },
          },
        })));
      // startStageObserver()
    };
    this.viewOnAllPagesCheckbox = this.element.querySelector('.view-on-allpages-check');
    this.viewOnAllPagesCheckbox.onchange = () => {
      updateElements(getElements()
        .map((el) => noSectionContent(el))
        .filter((el) => el.selected)
        .map((el) => ({
          from: el,
          to: {
            ...el,
            pageNames: this.viewOnAllPagesCheckbox.checked ? [] : [getCurrentPage().id],
          },
        })));
      // const elements = this.states.map((state) => state.el);
      // if (this.viewOnAllPagesCheckbox.checked) {
      //   this.controller.propertyToolController.visibleOnAllPages(elements);
      // } else {
      //   this.controller.propertyToolController.addToPage(elements);
      // }
    };
  }

  /**
   * refresh with new pages
   * @param pages   the new list of pages
   */
  setPages(pages: PageData[]) {
    // link selector
    const pageDataWithDefaultOptions = [
      {id: 'none', displayName: '-', linkName: 'none'},
      {id: 'custom', displayName: 'External link', linkName: 'custom'},
    ].concat(pages.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      linkName: p.link.value,
    })));

    const linkContainer = this.element.querySelector('.link-combo-box');
    let templateHtml = this.element.querySelector('.link-template').innerHTML;
    linkContainer.innerHTML = Dom.renderList(templateHtml, pageDataWithDefaultOptions);

    // render page/visibility template
    // init page template
    const pagesContainer = this.element.querySelector('.pages-container');
    templateHtml = this.element.querySelector('.pages-selector-template').innerHTML;
    pagesContainer.innerHTML = Dom.renderList(templateHtml, pages);

    // reset page checkboxes
    if (this.pageCheckboxes) {
      this.pageCheckboxes.forEach((item) => {
        if (item.checkbox.parentElement != null ) {
          item.checkbox.parentElement.removeChild(item.checkbox);
        }
        item.checkbox.onchange = null;
      });
    }

    // create page checkboxes
    const mainContainer = this.element.querySelector('.pages-container');
    const items = (Array.from(mainContainer.querySelectorAll('.page-container')) as HTMLElement[]);
    this.pageCheckboxes = items.map((item, idx) => {
      const checkbox: HTMLInputElement = item.querySelector('.page-check');
      const page = getPages()[idx++];
      checkbox.onchange = () => {
        this.checkPage(page, checkbox);
      };
      return {checkbox, page};
    });
  }

  /**
   * the user changed the link drop down
   */
  onLinkChanged() {
    if (this.linkDropdown.value === 'none') {
      removeLink(getSelectedElements());
      this.linkInputTextField.style.display = 'none';
    } else {
      if (this.linkDropdown.value === 'custom') {
        this.linkInputTextField.value = '';
        this.linkInputTextField.style.display = 'inherit';
      } else {
        addLink(getSelectedElements(), {
          type: LinkType.PAGE,
          value: this.linkDropdown.value,
        });
      }
    }
  }

  /**
   * the user changed the link text field
   */
  onLinkTextChanged() {
    addLink(getSelectedElements(), {
      type: LinkType.URL,
      value: this.linkInputTextField.value,
    });
}

  /**
   * callback for checkboxes click event
   * changes the visibility of the current component for the given page
   */
  checkPage(page: PageData, checkbox: HTMLInputElement) {
    // notify the toolbox
    if (checkbox.checked) {
      addToPage(getSelectedElements(), page);
    } else {
      removeFromPage(getSelectedElements(), page);
    }
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementData[]) {
    super.redraw(selectedElements);

    const selectedElementsNoSectionContent = selectedElements
      .map((el) => noSectionContent(el));

    const states = selectedElementsNoSectionContent
      .map((el) => getStage().getState(getDomElement(getSiteDocument(), el)))
      .filter((state) => !!state); // if the selected element is not visible (on the page or mobile/desktop) => it has no state

    // update page list
    this.setPages(getPages());

    // View on mobile checkbox
    Array.from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => el.disabled = !getSite().enableMobile);

    // not available for the body element
    const statesNoBody = states
      .filter((data) => data.el !== getSiteDocument().body);

    if (statesNoBody.length > 0) {
      // update the "view on mobile" checkbox
      const visibility = this.getCommonProperty(selectedElementsNoSectionContent, (element) => {
        if (!element.visibility.mobile) {
          return 'desktop';
        } else {
          if (!element.visibility.desktop) {
            return 'mobile';
          } else {
            return 'both';
          }
        }
      });
      if (!!visibility) {
        Array.from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => {
          el.checked = visibility === el.value;
          el.indeterminate = false;
        });
      } else {
        Array.from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => el.indeterminate = true);
      }

      // not stage element only
      this.linkDropdown.disabled = false;

      // refresh page checkboxes
      let isInNoPage = true;
      this.pageCheckboxes.forEach((item) => {
        // there is a selection
        item.checkbox.disabled = false;

        // compute common pages
        const page = getPages().find((p) => p.id === item.page.id);
        const isInPage = this.getCommonProperty(selectedElementsNoSectionContent, (el) => el.pageNames.includes(page.id));

        // set visibility
        isInNoPage = isInNoPage && isInPage === false;
        if (isInPage === null) {
          // multiple elements selected with different values
          item.checkbox.indeterminate = true;
        } else {
          item.checkbox.indeterminate = false;
          item.checkbox.checked = isInPage;
        }
      });
      this.viewOnAllPagesCheckbox.disabled = false;

      // this.checkAllPages();
      if (isInNoPage) {
        this.viewOnAllPagesCheckbox.checked = true;
      } else {
        this.viewOnAllPagesCheckbox.checked = false;
      }

      // refresh the link inputs
      // get the link of the element
      const elementLink = this.getCommonProperty(states, (state) => state.el.getAttribute(Constants.LINK_ATTR));

      // default selection
      if (!elementLink || elementLink === '') {
        this.linkDropdown.value = 'none';
        this.linkInputTextField.value = '';
      } else {
        if (elementLink.indexOf('#!') === 0) {
          // case of an internal link
          // select a page
          this.linkDropdown.value = elementLink;
        } else {
          // in case it is a custom link
          this.linkInputTextField.value = elementLink;
          this.linkDropdown.value = 'custom';
        }
      }
      if (this.linkDropdown.value === 'custom') {
        this.linkInputTextField.style.display = 'inherit';
      } else {
        this.linkInputTextField.style.display = 'none';
      }
    } else {
      // body element only
      this.pageCheckboxes.forEach((item) => {
        item.checkbox.disabled = true;
        item.checkbox.indeterminate = true;
      });
      this.linkDropdown.value = 'none';
      this.linkDropdown.disabled = true;
      this.linkInputTextField.style.display = 'none';
      this.viewOnAllPagesCheckbox.disabled = true;
      this.viewOnAllPagesCheckbox.checked = true;

      Array
      .from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
      .forEach((el: HTMLInputElement) => el.disabled = true);
    }
  }
}
