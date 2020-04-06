import { createPages, getPages, updatePages, deletePages, movePage, openPage } from '../page/store'
import { crudIdKey } from '../flux/crud-store'
import { LinkType } from '../element/types'
import { PageData } from '../page/types'
import { SilexNotification } from '../utils/Notification'

/**
 * create a page
 */
export function createPage(): Promise<void> {
  //    tracker.trackAction('controller-events', 'request', 'insert.page', 0);
  return editPageSettings(null)
    .then(({id, displayName}) => {
      // undo checkpoint
        //  undoCheckPoint();

      // create the page model
      createPages([{
        [crudIdKey]: Symbol(),
        id,
        displayName,
        link: {
          type: LinkType.PAGE,
          value: '#!' + name,
        },
        opened: false,
        canDelete: true,
        canRename: true,
        canMove: true,
        canProperties: true,
      }]);

      // tracking
      //    tracker.trackAction('controller-events', 'success', 'insert.page', 1);
    })
    .catch((e) => {
      // tracking
      //    tracker.trackAction('controller-events', 'cancel', 'insert.page', 0);
    });
}

/**
 * edit a page properties
 * @param pageData data of the page edited, defaults to current page
 */
export function editPage(pageData: PageData = getPages().find((p) => p.opened)) {
  editPageSettings(pageData)
    .then(({id, displayName}) => {
      // undo checkpoint
        //  undoCheckPoint();

      // update model
      if (pageData.id !== id && pageData.canRename) {
        updatePages([
          {
            from: pageData,
            to: {
              ...pageData,
              id,
              displayName,
              link: {
                type: LinkType.PAGE,
                value: '#!' + id,
              },
            },
          }
        ]);
      }
    })
    .catch((e) => {
    });
}

/**
 * remvove a page
 */
export function removePage(page: PageData = getPages().find((p) => p.opened)) {
  // confirm and delete
  SilexNotification.confirm(
    'Delete page',
    `I am about to <strong>delete the page "${page.displayName}"</strong>, are you sure?`,
      (accept) => {
      if (accept) {
        // undo checkpoint
          //  undoCheckPoint();

        // update model
        doRemovePage(page);
      }
    }, 'delete', 'cancel',
  );
}

function doRemovePage(pageData: PageData) {
  const pages = getPages()
  if (pages.length < 2) {
    SilexNotification.alert('Error', 'I can not delete this page because <strong>it is the only page</strong>.', () => {})
  } else {
    if (pageData.canDelete) {
      deletePages([pageData])
    } else {
      SilexNotification.alert('Error', 'I can not delete this page because <strong>it is a protected page</strong>.', () => {})
    }
  }
}

/**
 * move a page
 * @param pageName name of the page to be moved
 * @param offset
 */
export function movePageTo(page: PageData, idx: number) {
  movePage({page, idx});
}


/**
 * promp user for page properties
 * @param pageData data of the page edited, defaults to a new page
 */
export function editPageSettings(pageData: PageData = null): Promise<{id: string, displayName: string}> {
  return new Promise((resolve, reject) => {
    const form = document.createElement('div');
    form.innerHTML = `
      Page Name
      <input
        id="page-property-name"
        class="block-dialog"
        placeholder="Your page name here"
        value="${ pageData ? pageData.displayName : '' }"
        ${ !pageData || pageData.canRename ? '' : 'disabled' }
        />
    `;
    const nameInput = form.querySelector('#page-property-name') as HTMLInputElement;
    SilexNotification.confirm(
      pageData ? 'Page Properties' : 'New page',
      '',
      (accept) => {
        const newName = nameInput.value;
        if (accept && newName && newName.length > 0) {
          // cleanup the page name
          // add a prefix to prevent names which start with an dash or number (see css specifications)
          const cleanName = 'page-' + newName.replace(/\W+/g, '-').toLowerCase();

          // check if a page with this name exists
          const existing = getPages().find((p) => p.id === newName);
          if (!!existing) {
            // open the new page
            openPage(existing);
            reject('Page already exists');
          } else {
            resolve({id: cleanName, displayName: newName});
          }
        } else {
          reject('Canceled');
        }
      },
    );
    SilexNotification.setContent(form);
  });
}