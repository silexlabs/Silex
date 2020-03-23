import { getPages } from '../page/store'
import { SilexNotification } from '../utils/Notification'
import { updateElements } from '../element/store'
import { getBody, getSelectedElements } from '../element/filters'
import { getSite } from '../site/store'


/**
 * edit Silex editable css styles
 */
export function openCssEditor() {
  // undo checkpoint
    //  this.undoCheckPoint();

  // open the editor
  this.view.cssEditor.open();
}

/**
 * edit HTML head tag
 */
export function openHtmlHeadEditor() {
  // undo checkpoint
    //  this.undoCheckPoint();

  // deselect all elements but select the body
  const selection = getSelectedElements()
  const body = getBody()
  const selectionWithBody = selection.includes(body) ? selection : selection.concat(body)
  updateElements(selectionWithBody
    .map((el) => ({
      from: el,
      to: {
        ...el,
        selected: el === body,
      },
    })))

  // open the editor
  this.view.htmlEditor.open();
}

/**
 * edit Silex editable js scripts
 */
export function openJsEditor() {
  // undo checkpoint
    //  this.undoCheckPoint();

  // open the editor
  this.view.jsEditor.open();
}

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
  //    this.tracker.trackAction('controller-events', 'request', 'view.file', 0);
  const doOpenPreview = function() {
    if (inResponsize) {
      this.view.workspace.setPreviewWindowLocation(
          'http://www.responsize.org/?url=' +
          window.location.origin + getSite().file.absPath + '#!' +
          getPages().find((p) => p.opened).id);
    } else {
      this.view.workspace.setPreviewWindowLocation(
          window.location.origin + getSite().file.absPath + '#!' +
          getPages().find((p) => p.opened).id);
    }
    //    this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
  }.bind(this);

  // save before preview
  const doSaveTheFile = () => {
    this.save(
        getSite().file,
        () => {},
        (err) => {
          //    this.tracker.trackAction('controller-events', 'error', 'view.file', -1);
        });
  };
  if (getSite().file && !this.model.file.isTemplate) {
    // open the preview window
    // it is important to do it now, on the user click so that it is not
    // blocked it will be refreshed after save
    doOpenPreview();

    // also save
    if (this.isDirty()) {
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
  this.toggleSubMenu('page-tool-visible');
}
