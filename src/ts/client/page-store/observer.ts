import { Constants } from '../../constants'
import { ElementState, ElementType, LinkType } from '../element-store/types'
import { PageState } from './types'
import { Notification } from '../components/Notification'
import { StateChange } from '../store/crud-store'
import { deleteElements, getElements, updateElements } from '../element-store/index'
import { getElementByDomElement } from '../element-store/filters'
import { getInnerHtml } from '../element-store/dom'
import { getSiteDocument } from '../components/SiteFrame'
import { getState, store } from '../store/index'
import { getUi, updateUi } from '../ui-store/index'
import { writeDataToDom } from '../store/dom'

export function onAddPages(pages: PageState[]) {
  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getState())
}

export function onDeletePages(pages: PageState[], preventConfirm = false, elements = getElements(), dispatch = store.dispatch) {
  function doDelete(elementsOnlyOnThisPage) {
    elementsOnlyOnThisPage.forEach((element) => {
      // remove these elements
      deleteElements([element], dispatch)
    })
  }

  pages.forEach((page) => {
    const elementsOnThisPage = elements
      .filter((element) => element.pageNames.includes(page.id))

    const elementsOnlyOnThisPage = elementsOnThisPage
      .filter((element) => element.pageNames.length === 1)

    // handle elements which should be deleted
    if (elementsOnlyOnThisPage.length > 0) {
      if (!preventConfirm) {
        Notification.confirm('Delete elements' , `
          ${elementsOnlyOnThisPage.length} elements were only visible on this page (${page.id}).
          <br /><ul>
            <li>Do you want me to <strong>delete these elements?</strong><br /></li>
            <li>or keep them and <strong>make them visible on all pages?</strong></li>
          </ul>
        `, (accept) => {
          if (accept) doDelete(elementsOnlyOnThisPage)
          // else: the element will be made visible on all pages by the code bellow
        }, 'delete', 'keep')
      } else {
        doDelete(elementsOnlyOnThisPage)
      }
    }

    // FIXME: observer should not update store
    setTimeout(() => {
      // remove "visibility" on this page
      // elements may be deleted afterwards by the code above
      updateElements(elementsOnThisPage
        .map((element) => ({
          ...element,
          pageNames: element.pageNames.filter((id) => id !== page.id),
        })), dispatch)

      // update the links to this page
      updateElements(pages
        .reduce((prev, cur) => {
          return prev.concat(getElements()
            .filter((element) => !!element.link && element.link.linkType === LinkType.PAGE && element.link.href === cur.link.href)
            .map((element) => ({
              from: element,
              to: {
                ...element,
                link: null,
              },
            })))
        }, []))
      // FIXME: handle links in texts
    }, 0)
  })

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getState())
}

const hasLinkToPage = (element: ElementState, page: PageState) => !!element.link && element.link.linkType === LinkType.PAGE && element.link.href === page.link.href

const isVisibleOnPage = (element: ElementState, page: PageState) => !!element.pageNames.length && element.pageNames.includes(page.id)

export function onUpdatePages(changes: StateChange<PageState>[], elements = getElements(), dispatch = store.dispatch) {
  changes.forEach(({from, to}) => {
    // page ID change
    if (!from || from.id !== to.id || from.link !== to.link) {
      // FIXME: observer should not update store
      setTimeout(() => {
        const updateEl: ElementState[] = elements
          // update elements visibility
          // + update links to this page
          .filter((element) => isVisibleOnPage(element, from) || hasLinkToPage(element, from))
          .map((element) => ({
            ...element,
            link: hasLinkToPage(element, from) ? to.link : element.link,
            pageNames: isVisibleOnPage(element, from) ? element.pageNames.map((name) => name === from.id ? to.id : name) : element.pageNames,
          }))
        // handle links in texts
        const updateDom = []
        const doc = getSiteDocument()
        // links which starts with the page link (could be an anchor after the page id)
        Array.from(doc.querySelectorAll(`[href="${from.link.href}"], [href^="${from.link.href}#"]`))
          .forEach((domEl: HTMLElement) => {
            // replace in the dom
            domEl.setAttribute('href', domEl.getAttribute('href').replace(from.link.href, to.link.href))
            updateDom.push(domEl)
          })
        // unique DOM elements only (a link to a page may be in an element which is visible on the same page)
        const changedDom: HTMLElement[] = [...new Set(updateDom)]
        changedDom.forEach((domEl: HTMLElement) => {
            // update in the model
            const [silexEl, silexDomEl]: [ElementState, HTMLElement] = getSilexElement(doc, domEl, elements)
            if (!!silexEl && (silexEl.type === ElementType.HTML || silexEl.type === ElementType.TEXT)) {
              // unique DOM elements only (several links may be in the same silex element)
              const found: ElementState = updateEl.find((el: ElementState) => el.id === silexEl.id)
              if (!!found) {
                // mutate the object
                found.innerHtml = getInnerHtml(silexDomEl)
              } else {
                updateEl.push({
                  ...silexEl,
                  innerHtml: getInnerHtml(silexDomEl),
                })
              }
            }
          })
        if (updateEl.length) {
          updateElements(updateEl, dispatch)
        }
      }, 0)

      // update the current page with the new page id
      if (from.id === getUi().currentPageId) {
        updateUi({
          ...getUi(),
          currentPageId: to.id,
        })
      }
    }
  })

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getState())
}

/**
 * @returns silex element which contanis the HTML DOM element
 */
function getSilexElement(doc: HTMLDocument, domEl: HTMLElement, elements: ElementState[]): [ElementState, HTMLElement] {
  // get the first element in the dom
  // which is a silex element
  let tmp: HTMLElement = domEl
  do {
    const beTheOne: ElementState = getElementByDomElement(doc, tmp, elements)
    if (beTheOne) return [beTheOne, tmp]
      tmp = tmp.parentElement
  } while (tmp)

  return [null, null]
}
