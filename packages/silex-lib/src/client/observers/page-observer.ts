import { LinkType, PageData } from '../../types';
import { deleteElements, getData, getElements, updateElements } from '../api';
import { getSiteDocument, getSiteWindow } from '../components/UiElements';
import { openPageDom } from '../dom/page-dom';
import { writeDataToDom } from '../dom/site-dom';
import { StateChange } from '../flux/crud-store';
import { SilexNotification } from '../utils/Notification';

export function onAddPages(pages: PageData[]) {}

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
}

export function onUpdatePages(changes: Array<StateChange<PageData>>) {
  changes.forEach(({from, to}) => {
    // page ID change
    if (!from || from.id !== to.id) {
      // update links to this page
      // TODO: handle links in HTML boxes and texts?
      updateElements(getElements()
        .filter((element) => !!element.link && element.link.type === LinkType.PAGE && element.link.value === to.link.value)
        .map((element) => ({
          from: element,
          to: {
            ...element,
            link: to.link,
          },
        })))
    }

    // current opened page
    if (!from || !from.isOpen && to.isOpen) {
      openPageDom(getSiteWindow(), to)
    }
  })

  // save the changed data to the dom for front-end.js
  writeDataToDom(getSiteDocument(), getData())
}
