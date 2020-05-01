import { SilexNotification } from '../utils/Notification'
import { getSite } from '../site-store/index'
import { getUi } from '../ui-store/index';
import { isDirty } from './undo'
import { save } from './file'
import { setPreviewWindowLocation } from '../components/Workspace'


/**
 * view this file in a new window
 */
export function preview() {
  doPreview(false);
}

/**
 * view this file in responsize
 */
export function previewResponsize() {
  doPreview(true);
}


/**
 * preview the website in a new window or in responsize
 * ask the user to save the file if needed
 * @param inResponsize if true this will open the preview in responsize
 *   if false it will open the website in a new window
 */
function doPreview(inResponsize: boolean) {
  //    tracker.trackAction('controller-events', 'request', 'view.file', 0);
  const doOpenPreview = () => {
    if (inResponsize) {
      setPreviewWindowLocation(
          'http://www.responsize.org/?url=' +
          window.location.origin + getSite().file.absPath + '#!' +
          getUi().currentPageId);
    } else {
      setPreviewWindowLocation(
          window.location.origin + getSite().file.absPath + '#!' +
          getUi().currentPageId);
    }
    //    tracker.trackAction('controller-events', 'success', 'view.file', 1);
  }

  // save before preview
  const doSaveTheFile = () => {
    save(
        getSite().file,
        () => {},
        (err) => {
          //    tracker.trackAction('controller-events', 'error', 'view.file', -1);
        });
  };
  if (getSite().file && !getSite().isTemplate) {
    // open the preview window
    // it is important to do it now, on the user click so that it is not
    // blocked it will be refreshed after save
    doOpenPreview();

    // also save
    if (isDirty()) {
      doSaveTheFile();
    }
  } else {
    SilexNotification.alert(
      'Preview website',
      'You need to save the website before I can show a preview',
      () => {
        doSaveTheFile();
      },
    );
  }
}

////////////////////////////////////
// Menu open / close
const SUB_MENU_CLASSES = [
  'page-tool-visible', 'about-menu-visible', 'file-menu-visible',
  'code-menu-visible', 'add-menu-visible',
];

export function closeAllSubMenu() {
  SUB_MENU_CLASSES.forEach((className) => {
    document.body.classList.remove(className);
  });
}

export function toggleSubMenu(classNameToToggle) {
  SUB_MENU_CLASSES.forEach((className) => {
    if (classNameToToggle === className) {
      document.body.classList.toggle(className);
    } else {
      document.body.classList.remove(className);
    }
  });
}

/**
 * open the page pannel
 */
export function showPages() {
  toggleSubMenu('page-tool-visible');
}
