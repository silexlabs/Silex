import { Constants } from '../../constants'
import { LinkType } from '../element-store/types'
import { PageState } from './types'
import { Notification } from '../components/Notification'
import { createPages, getPages, updatePages, deletePages, movePage, fromPageData } from './index'
import { getCurrentPage } from './filters'
import { openPage } from '../ui-store/dispatchers'

/**
 * create a page
 */
export function createPage(): Promise<void> {
  //    tracker.trackAction('controller-events', 'request', 'insert.page', 0);
  return editPageSettings(null)
    .then(({id, displayName}) => {
      // check if a page with this name exists
      const existing = getPages().find((p) => p.id === id)
      if (!!existing) {
        // open the new page
        openPage(existing)
        Notification.notifyError(`Page not created: page already exists`)
      } else {
        // create the page model
        createPages(fromPageData([{
          id,
          displayName,
          link: {
            linkType: LinkType.PAGE,
            href: Constants.PAGE_NAME_PREFIX + id,
          },
          canDelete: true,
          canRename: true,
          canMove: true,
          canProperties: true,
        }]))
      }
    })
    .catch((reason) => {
      // canceled by user
    })
}

/**
 * edit a page properties
 * @param pageData data of the page edited, defaults to current page
 */
export function editPage(pageData: PageState = getCurrentPage()) {
  editPageSettings(pageData)
    .then(({id, displayName}) => {
      if (pageData.canRename) {
        // update model
        updatePages([
          {
            ...pageData,
            id,
            displayName,
            link: {
              linkType: LinkType.PAGE,
              href: Constants.PAGE_NAME_PREFIX + id,
            },
          },
        ])
      } else {
        Notification.alert('Error', 'I can not rename this page because <strong>it is a protected page</strong>.', () => {})
      }
    })
    .catch((reason) => {
      // canceled by user
    })
}

/**
 * remvove a page
 */
export function removePage(page: PageState = getCurrentPage()) {
  // confirm and delete
  Notification.confirm(
    'Delete page',
    `I am about to <strong>delete the page "${page.displayName}"</strong>, are you sure?`,
      (accept) => {
      if (accept) {
        doRemovePage(page)
      }
    }, 'delete', 'cancel',
  )
}

function doRemovePage(pageData: PageState) {
  const pages = getPages()
  if (pages.length < 2) {
    Notification.alert('Error', 'I can not delete this page because <strong>it is the only page</strong>.', () => {})
  } else {
    if (pageData.canDelete) {
      deletePages([pageData])
    } else {
      Notification.alert('Error', 'I can not delete this page because <strong>it is a protected page</strong>.', () => {})
    }
  }
}

/**
 * move a page
 * @param pageName name of the page to be moved
 * @param offset
 */
export function movePageTo(page: PageState, idx: number) {
  movePage({page, idx})
}


/**
 * promp user for page properties
 * @param pageData data of the page edited, defaults to a new page
 */
export function editPageSettings(pageData: PageState = null): Promise<{id: string, displayName: string}> {
  return new Promise((resolve, reject) => {
    const form = document.createElement('div')
    form.innerHTML = `
      Page Name
      <input
        autofocus
        id="page-property-name"
        class="block-dialog"
        placeholder="Your page name here"
        value="${ pageData ? pageData.displayName : '' }"
        ${ !pageData || pageData.canRename ? '' : 'disabled' }
        />
    `
    const nameInput = form.querySelector('#page-property-name') as HTMLInputElement
    Notification.confirm(
      pageData ? 'Page Properties' : 'New page',
      '',
      (accept) => {
        const newName = nameInput.value
        if (accept && newName && newName.length > 0) {
          // cleanup the page name
          // add a prefix to prevent names which start with an dash or number (see css specifications)
          const cleanName = Constants.PAGE_ID_PREFIX + newName.replace(/\W+/g, '-').toLowerCase()
          resolve({id: cleanName, displayName: newName})
        } else {
          reject('Canceled')
        }
      },
    )
    Notification.setContent(form)
  })
}
