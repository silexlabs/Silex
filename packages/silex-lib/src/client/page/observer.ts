import { deleteElements, getElements, updateElements } from '../element/store';
import { StateChange } from '../flux/crud-store';
import { getData } from '../flux/store';
import { writeDataToDom } from '../site/dom';
import { getSiteDocument, getSiteWindow } from '../ui/UiElements';
import { SilexNotification } from '../utils/Notification';
import { PageData } from './types';
import { LinkType, ElementData } from '../element/types'
import { openPageDom } from './dom'

export function onAddPages(pages: PageData[]) {
  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getData())
}

export function onDeletePages(pages: PageData[]) {
  pages.forEach((page) => {
    // remove the elements which were only visible on this page
    // getElementsForPage(page)
    //   .filter(element => element.classList.contains(Constants.PAGED_CLASS_NAME))
    //   .forEach((element: HTMLElement) => element.remove())
    const elementsOnlyOnThisPage = getElements()
      .filter((element) => element.pageNames.length === 1 && element.pageNames.find((name) => name === page.id))

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
                // make it visible in all pages
                updateElements(elementsOnlyOnThisPage
                  .map((element) => ({
                    from: element,
                    to: {
                      ...element,
                      pageNames: [],
                    },
                  })))
                }
              }, 'delete', 'keep')
    }
  })
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

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getData())
}

const hasLinkToPage = (element: ElementData, page: PageData) => !!element.link && element.link.type === LinkType.PAGE && element.link.value === page.link.value
const isVisibleOnPage = (element: ElementData, page: PageData) => !!element.pageNames.length && element.pageNames.includes(page.id)

export function onUpdatePages(changes: StateChange<PageData>[]) {
  changes.forEach(({from, to}) => {
    // page ID change
    if (!from || from.id !== to.id) {
      // about the `setTimeout`: need to re-dispatch after this round of listeners
      // this is needed to avoid silent crash
      setTimeout(() => {
        updateElements(getElements()
          // update elements visibility
          // + update links to this page
          // TODO: handle links in HTML boxes and texts?
          .filter((element) => isVisibleOnPage(element, from) || hasLinkToPage(element, from))
          .map((element) => ({
            from: element,
            to: {
              ...element,
              link: hasLinkToPage(element, from) ? to.link : element.link,
              pageNames: isVisibleOnPage(element, from) ? element.pageNames.map((name) => name === from.id ? to.id : name) : element.pageNames,
            },
          })))
      }, 0);
    }

    // current opened page
    if (!from || !from.opened && to.opened) {
      openPageDom(getSiteWindow(), to)
    }
  })

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getData())
}
