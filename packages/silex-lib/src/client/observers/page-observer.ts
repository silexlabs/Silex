import { LinkType, PageData } from '../../types';
import { deleteElements, getElements, openPage, updateElements } from '../api';
import { SilexNotification } from '../utils/Notification';

export function onAddPage(page: PageData) {
  // useless now: console.log('Adding a page to the DOM')
  // useless now: createPage(page.id, page.displayName)
}

export function onDeletePage(page: PageData) {
  // remove the links to this page
  // TODO: handle links in HTML boxes and texts?
  updateElements(getElements()
    .filter((element) => !!element.link && element.link.type === LinkType.PAGE && element.link.value === page.link.value)
    .map((element) => ({
      from: element,
      to: {
        ...element,
        link: null,
      },
    })))

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
  // FIXME: useless now? removePage(page)
}

export function onUpdatePage(oldPage: PageData, page: PageData) {
  console.log('Updating page to the DOM')
  if (!oldPage || !oldPage.isOpen && page.isOpen) {
    openPage(page)
  }
  if (!oldPage || oldPage.id !== page.id) {
    // update links to this page
    // TODO: handle links in HTML boxes and texts?
    updateElements(getElements()
      .filter((element) => !!element.link && element.link.type === LinkType.PAGE && element.link.value === page.link.value)
      .map((element) => ({
        from: element,
        to: {
          ...element,
          link: page.link,
        },
      })))
    // rename the page in the DOM
    // useless now: renamePage(oldPage, page.id, page.displayName)
  }
  // FIXME: useless now? reorder pages
}
