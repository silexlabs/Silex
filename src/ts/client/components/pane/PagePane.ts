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
import { Dom } from '../../utils/Dom'
import { ElementState, ElementType, LinkType } from '../../element-store/types';
import { PageState } from '../../page-store/types'
import { PaneBase } from './PaneBase'
import {
  getBody,
  getSelectedElements,
  noSectionContent
} from '../../element-store/filters';
import { getCurrentPage } from '../../page-store/filters'
import {
  getElements,
  subscribeElements,
  updateElements
} from '../../element-store/index';
import { getSite } from '../../site-store/index'
import { isVisibleInPage } from '../../element-store/utils';
import { removeLink, addLink, addToPage, removeFromPage } from '../../element-store/dispatchers'
import { subscribePages, getPages } from '../../page-store/index'
import { subscribeUi, getUi } from '../../ui-store/index'

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class PagePane extends PaneBase {
  static linkTemplate = `<option value='{{linkName}}'>{{displayName}}</option>`

  static selectorTemplate = `<div class='page-container'>
    <input class='page-check checkbox' type='checkbox' id='page-check-id-{{id}}' />
    <label class='page-label xsmall-font' for='page-check-id-{{id}}' >{{displayName}}</label>
  </div>
	`

  /**
   * dropdown list to select a link
   * link, select page or enter custom link
   */
  linkDropdown: HTMLInputElement

  /**
   * text field used to type an external link
   */
  linkInputTextField: HTMLInputElement

  /**
   * check box "view on mobile"
   */
  viewOnDeviceEl: HTMLDivElement = null

  /**
   * check box "view on all pages"
   */
  viewOnAllPagesCheckbox: HTMLInputElement = null

  /**
   * Array of checkboxes used to add/remove the element from pages
   */
  pageCheckboxes: { checkbox: HTMLInputElement, page: PageState }[] = []

  constructor(element: HTMLElement) {

    super(element)

    subscribePages(() => {
      this.setPages(getPages())
      this.redraw(getSelectedElements())
    })

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })

    // get dom elements of interest
    this.linkDropdown = this.element.querySelector('.link-combo-box')
    this.linkDropdown.onchange = () => this.onLinkChanged()
    this.linkInputTextField = this.element.querySelector('.link-input-text')

    // hide by default
    this.linkInputTextField.style.display = 'none'

    // Watch for field changes, to display below.
    this.linkInputTextField.oninput = () => this.onLinkTextChanged()
    this.viewOnDeviceEl = (this.element.querySelector('.view-on-mobile') as HTMLDivElement)
    this.viewOnDeviceEl.onclick = (e) => {
      const selected: HTMLInputElement = this.element.querySelector('.view-on-mobile input:checked')
      const value = selected.value
      const desktop = value !== 'mobile'
      const mobile = value !== 'desktop'
      updateElements(getElements()
        .map((el) => noSectionContent(el))
        .filter((el) => el.selected && (el.visibility.desktop !== desktop || el.visibility.mobile !== mobile))
        .map((el) => ({
          ...el,
          selected: getUi().mobileEditor ? mobile : desktop,
          visibility: {
            desktop,
            mobile,
          },
        })))
    }
    this.viewOnAllPagesCheckbox = this.element.querySelector('.view-on-allpages-check')
    this.viewOnAllPagesCheckbox.onchange = () => {
      const pageNames = this.viewOnAllPagesCheckbox.checked ? [] : [getCurrentPage().id]
      updateElements(getSelectedElements()
        .map((el) => noSectionContent(el))
        .map((el) => ({
          ...el,
          pageNames,
        })))
    }
  }

  /**
   * refresh with new pages
   * @param pages   the new list of pages
   */
  setPages(pages: PageState[]) {
    // link selector
    const pageDataWithDefaultOptions = [
      {id: 'none', displayName: '-', linkName: 'none'},
      {id: 'custom', displayName: 'External link', linkName: 'custom'},
    ].concat(pages.map(({id, displayName, link}) => ({
      id,
      displayName,
      linkName: link.value,
    })))

    const linkContainer = this.element.querySelector('.link-combo-box')
    linkContainer.innerHTML = Dom.renderList(PagePane.linkTemplate, pageDataWithDefaultOptions)

    // render page/visibility template
    // init page template
    const pagesContainer = this.element.querySelector('.pages-container')
    pagesContainer.innerHTML = Dom.renderList(PagePane.selectorTemplate, pages)

    // reset page checkboxes
    if (this.pageCheckboxes) {
      this.pageCheckboxes.forEach((item) => {
        if (item.checkbox.parentElement != null ) {
          item.checkbox.parentElement.removeChild(item.checkbox)
        }
        item.checkbox.onchange = null
      })
    }

    // create page checkboxes
    const items = (Array.from(pagesContainer.querySelectorAll('.page-container')) as HTMLElement[])
    this.pageCheckboxes = items.map((item, idx) => {
      const checkbox: HTMLInputElement = item.querySelector('.page-check')
      const page = pages[idx++]
      checkbox.onchange = (e: MouseEvent) => {
        this.checkPage(page, checkbox)
        e.preventDefault()
      }
      return {checkbox, page}
    })
  }

  /**
   * the user changed the link drop down
   */
  onLinkChanged() {
    if (this.linkDropdown.value === 'none') {
      removeLink(getSelectedElements())
      this.linkInputTextField.style.display = 'none'
    } else {
      if (this.linkDropdown.value === 'custom') {
        this.linkInputTextField.value = ''
        this.linkInputTextField.style.display = 'inherit'
      } else {
        addLink(getSelectedElements(), {
          type: LinkType.PAGE,
          value: this.linkDropdown.value,
        })
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
    })
  }

  /**
   * callback for checkboxes click event
   * changes the visibility of the current component for the given page
   */
  checkPage(page: PageState, checkbox: HTMLInputElement) {
    const { currentPageId } = getUi()
    // notify the toolbox
    if (checkbox.checked) {
      addToPage(getSelectedElements(), page)
    } else {
      removeFromPage(getSelectedElements(), page)
    }
    this.updateSelection()
  }

  /**
   * keep selected only if visible in current page
   */
  updateSelection() {
    const { currentPageId } = getUi()
    updateElements(getSelectedElements()
      .map((el) => ({
        ...el,
        selected: isVisibleInPage(el, currentPageId),
      })))
  }

  /**
   * redraw the properties
   */
  redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)

    const body = getBody()
    const noSectionContentNoBody = selectedElements
      .filter((el) => el !== body)
      .map((el) => noSectionContent(el))
    const noSectionNoBody = noSectionContentNoBody
      .filter((el) => el.type !== ElementType.SECTION)

    // View on mobile checkbox
    Array.from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => el.disabled = !getSite().enableMobile)

    if (noSectionContentNoBody.length > 0) {
      // update the "view on mobile" checkbox
      const visibility = this.getCommonProperty(noSectionContentNoBody, (element) => {
        if (!element.visibility.mobile) {
          return 'desktop'
        } else {
          if (!element.visibility.desktop) {
            return 'mobile'
          } else {
            return 'both'
          }
        }
      })
      if (!!visibility) {
        Array.from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => {
          el.checked = visibility === el.value
          el.indeterminate = false
        })
      } else {
        Array.from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => el.indeterminate = true)
      }

      // refresh page checkboxes
      let isInNoPage = true
      this.pageCheckboxes.forEach((item) => {
        // there is a selection
        item.checkbox.disabled = false

        // compute common pages
        const page = getPages().find((p) => p.id === item.page.id)
        const isInPage = this.getCommonProperty(noSectionContentNoBody, (el) => el.pageNames.includes(page.id))

        // set visibility
        isInNoPage = isInNoPage && isInPage === false
        if (isInPage === null) {
          // multiple elements selected with different values
          item.checkbox.indeterminate = true
        } else {
          item.checkbox.indeterminate = false
          item.checkbox.checked = isInPage
        }
      })
      this.viewOnAllPagesCheckbox.disabled = false

      // this.checkAllPages()
      if (isInNoPage) {
        this.viewOnAllPagesCheckbox.checked = true
      } else {
        this.viewOnAllPagesCheckbox.checked = false
      }

      // refresh the link inputs
      // get the link of the element
      const link = this.getCommonProperty(noSectionNoBody, (el) => el.link)

      // link drop down only for elements which are not sections, section content or body
      if(noSectionNoBody.length) this.linkDropdown.disabled = false
      else this.linkDropdown.disabled = true
      // TODO: handle this with link.type instead of guessing from link.value
      if (!link || link.value === '') {
        this.linkDropdown.value = 'none'
        this.linkInputTextField.value = ''
      } else {
        if (link.value.indexOf(Constants.PAGE_NAME_PREFIX) === 0) {
          // case of an internal link
          // select a page
          this.linkDropdown.value =link.value
        } else {
          // in case it is a custom link
          this.linkInputTextField.value =link.value
          this.linkDropdown.value = 'custom'
        }
      }
      if (this.linkDropdown.value === 'custom') {
        this.linkInputTextField.style.display = 'inherit'
      } else {
        this.linkInputTextField.style.display = 'none'
      }
    } else {
      // body element only
      this.pageCheckboxes.forEach((item) => {
        item.checkbox.disabled = true
        item.checkbox.indeterminate = true
      })
      this.linkDropdown.value = 'none'
      this.linkDropdown.disabled = true
      this.linkInputTextField.style.display = 'none'
      this.viewOnAllPagesCheckbox.disabled = true
      this.viewOnAllPagesCheckbox.checked = true

      Array
      .from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
      .forEach((el: HTMLInputElement) => el.disabled = true)
    }
  }
}
