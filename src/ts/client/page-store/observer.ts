import { deleteElements, getElements, updateElements } from '../element-store/index'
import { StateChange } from '../store/crud-store'
import { getState } from '../store/index'
import { writeDataToDom } from '../store/dom'
import { getSiteDocument, getSiteWindow } from '../components/SiteFrame'
import { SilexNotification } from '../components/Notification'
import { PageState } from './types'
import { LinkType, ElementState } from '../element-store/types'
import { openPageDom } from './dom'

export function onAddPages(pages: PageState[]) {
  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getState())
}

export function onDeletePages(pages: PageState[]) {
  pages.forEach((page) => {
    const elementsOnThisPage = getElements()
      .filter((element) => element.pageNames.includes(page.id))

    const elementsOnlyOnThisPage = elementsOnThisPage
      .filter((element) => element.pageNames.length === 1)

    // handle elements which should be deleted
    if (elementsOnlyOnThisPage.length > 0) {
      SilexNotification.confirm('Delete elements' , `
        ${elementsOnlyOnThisPage.length} elements were only visible on this page (${page.id}).
        <br /><ul>
          <li>Do you want me to <strong>delete these elements?</strong><br /></li>
          <li>or keep them and <strong>make them visible on all pages?</strong></li>
        </ul>
      `,
      (accept) => {
        if (accept) {
          elementsOnlyOnThisPage.forEach((element) => {
            // remove these elements
            deleteElements([element])
          })
        } else {
          // the element will be made visible on all pages by the code bellow
        }
      }, 'delete', 'keep')
    }

    // FIXME: observer should not update store
    setTimeout(() => {
      // remove "visibility" on this page
      // elements may be deleted afterwards by the code above
      updateElements(elementsOnlyOnThisPage
        .map((element) => ({
          ...element,
          pageNames: element.pageNames.filter((id) => id !== page.id),
        })))
    }, 0)
  })

  // FIXME: observer should not update store
  setTimeout(() => {
    // remove the links to this page
    // TODO: handle links in HTML boxes and texts?
    updateElements(pages
      .reduce((prev, cur) => {
        return prev.concat(getElements()
          .filter((element) => !!element.link && element.link.type === LinkType.PAGE && element.link.value === cur.link.value)
          .map((element) => ({
            from: element,
            to: {
              ...element,
              link: null,
            },
          })))
      }, []))
  }, 0)

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getState())
}

const hasLinkToPage = (element: ElementState, page: PageState) => !!element.link && element.link.type === LinkType.PAGE && element.link.value === page.link.value
const isVisibleOnPage = (element: ElementState, page: PageState) => !!element.pageNames.length && element.pageNames.includes(page.id)

export function onUpdatePages(changes: StateChange<PageState>[]) {
  changes.forEach(({from, to}) => {
    // page ID change
    if (!from || from.id !== to.id) {
      // FIXME: observer should not update store
      setTimeout(() => {
        updateElements(getElements()
          // update elements visibility
          // + update links to this page
          // TODO: handle links in HTML boxes and texts?
          // FIXME: observer should not update store?
          .filter((element) => isVisibleOnPage(element, from) || hasLinkToPage(element, from))
          .map((element) => ({
            ...element,
            link: hasLinkToPage(element, from) ? to.link : element.link,
            pageNames: isVisibleOnPage(element, from) ? element.pageNames.map((name) => name === from.id ? to.id : name) : element.pageNames,
          })))
      }, 0)
    }
  })

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getState())
}
