/**
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the element visibility on the pages,
 *   and also the element "link to page" property
 *
 */

import { ElementState, ElementType, Link } from '../../element-store/types'
import { PageState } from '../../page-store/types'
import { PaneBase } from './PaneBase'
import { Notification } from '../Notification'
import { addToPage, removeFromPage } from '../../element-store/dispatchers'
import {
  getBody,
  getChildrenRecursive,
  getSelectedElements,
  noSectionContent
} from '../../element-store/filters'
import { getCurrentPage } from '../../page-store/filters'
import { getSite } from '../../site-store/index'
import { isDialogVisible } from '../../ui-store/utils'
import { isVisibleInPage } from '../../element-store/utils'
import { openLinkDialog } from '../dialog/LinkDialog'
import { renderList } from '../../utils/dom'
import { subscribeElements, updateElements } from '../../element-store/index'
import { subscribePages, getPages } from '../../page-store/index'
import { subscribeUi, getUi } from '../../ui-store/index'

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class PagePane extends PaneBase {
  static selectorTemplate = `<div class='page-container'>
    <input class='page-check checkbox' type='checkbox' id='page-check-id-{{id}}' />
    <label class='page-label xsmall-font' for='page-check-id-{{id}}' >{{displayName}}</label>
  </div>
	`

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

  /**
   * button to open link editor
   */
  linkBtn: HTMLButtonElement = null

  /**
   * display the link
   */
  linkStateEl: HTMLInputElement = null

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

    // link
    this.linkStateEl = this.element.querySelector('.link-state') as HTMLInputElement
    this.linkBtn = this.element.querySelector('.link-button') as HTMLButtonElement
    this.linkBtn.onclick = () => this.editLink()

    // Watch for field changes, to display below.
    this.viewOnDeviceEl = (this.element.querySelector('.view-on-mobile') as HTMLDivElement)
    this.viewOnDeviceEl.onclick = () => {
      const selected: HTMLInputElement = this.element.querySelector('.view-on-mobile input:checked')
      const value = selected.value
      const desktop = value !== 'mobile'
      const mobile = value !== 'desktop'
      updateElements(getSelectedElements()
        .map((el) => noSectionContent(el))
        .filter((el) => el.visibility.desktop !== desktop || el.visibility.mobile !== mobile)
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

  getLinkElements(elements: ElementState[]) {
    const body = getBody()
    return elements
      .filter((el) => el !== body && el.type !== ElementType.SECTION && !el.isSectionContent)
  }

  /**
   * open the link editor and update selection link
   */
  editLink() {
    const elements = this.getLinkElements(getSelectedElements())

    // const hasLink = elements.some((el) => !!el.link)
    const oldLink: Link = elements
    .map((el) => el.link)
    .reduce((prev, cur) => {
      if (prev && cur) {
        if (Object.keys(prev).every((key) => prev[key] === cur[key])
            && Object.keys(cur).every((key) => prev[key] === cur[key])) {
              // both are equal
              return prev
            }
            // not equal
            return null
      }
      // no link or previewly not equal
      return null
    })
    this.openLinkEditor(oldLink, (link) => {
      updateElements(elements
        .map((el: ElementState) => ({
          ...el,
          link,
        })))
    })
  }

  /**
   * refresh with new pages
   * @param pages   the new list of pages
   */
  setPages(pages: PageState[]) {
    // render page/visibility template
    // init page template
    const pagesContainer = this.element.querySelector('.pages-container')
    pagesContainer.innerHTML = renderList(PagePane.selectorTemplate, pages)

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
   * callback for checkboxes click event
   * changes the visibility of the current component for the given page
   */
  checkPage(page: PageState, checkbox: HTMLInputElement) {
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

    if (isDialogVisible('design', 'properties')) {
      this.element.style.display = ''


      const body = getBody()
      const noSectionContentNoBody = selectedElements
      .filter((el) => el !== body)
      .map((el) => noSectionContent(el))

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
      } else {
        // body element only
        this.pageCheckboxes.forEach((item) => {
          item.checkbox.disabled = true
          item.checkbox.indeterminate = true
        })
        this.viewOnAllPagesCheckbox.disabled = true
        this.viewOnAllPagesCheckbox.checked = true

        Array
        .from(this.viewOnDeviceEl.querySelectorAll('.view-on-mobile input'))
        .forEach((el: HTMLInputElement) => el.disabled = true)
      }
    } else {
      this.element.style.display = 'none'
    }
    const linkElements = this.getLinkElements(selectedElements)
    if (linkElements.length > 0) {
      // refresh the link inputs
      // get the link of the element
      const link = this.getCommonProperty<ElementState, Link>(linkElements, (el) => el.link)
      this.linkStateEl.value = link ? link.href : ''
      this.linkStateEl.disabled = false
      this.linkBtn.disabled = false
    } else {
      this.linkBtn.disabled = true
      this.linkStateEl.disabled = true
      this.linkStateEl.value = ''
    }
  }

  hasLink(el: ElementState): boolean {
    return !!el.link || el.innerHtml.includes('<a')
  }

  /**
   * open the link editor, which uses Notification
   */
  openLinkEditor(oldLink: Link, onChange: (link: Link) => void) {
    // check if the selection has links inside it
    if (getSelectedElements()
      .some((el) => el.innerHtml.includes('<a'))
      // check the children of the current selection
      || getSelectedElements()
        .map((el) => getChildrenRecursive(el))
        .some((children) => children
          .some((child) => this.hasLink(child)))) {
      // Warning: this same error message is also in TextFormatBar.ts
      Notification.alert('Link error', 'It is impossible to add a link on this element, because the text inside the element has links. Please remove the links in the element and try again. <a target="_blank" href="https://github.com/silexlabs/Silex/wiki/Errors#link-error">More info here</a>', () => {})
    } else {
      openLinkDialog({
        data: oldLink,
        cbk: (newLink: Link) => {
          // newLink is the same as oldLink when the user canceled the link editor
          // therfore it is undefined when the selection is not a link
          // and it will be undefined when the user clicks "remove link"
          onChange(newLink)
        },
      })
    }
  }
}
