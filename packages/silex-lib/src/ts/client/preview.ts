/**
 * @fileoverview these functions show preview
 */

import { SilexNotification } from './components/Notification'
import { getCurrentPage } from './page-store/filters'
import { getSite } from './site-store/index'
import { isDirty } from './dirty'
import { save } from './file'

/**
 * view this file in a new window
 */
export function preview() {
  doPreview(false)
}

/**
 * view this file in responsize
 */
export function previewResponsize() {
  doPreview(true)
}

// store the window viewport for later use
let previewWindow: Window

/**
 * open a popup or refresh the allready opened one
 * @param opt_location or null to refresh only
 */
export function setPreviewWindowLocation(opt_location?: string) {
  if (previewWindow && !previewWindow.closed) {
    if (opt_location) {
      previewWindow.close()
      previewWindow = window.open(opt_location)
      previewWindow.focus()
    } else {
      try {
        if (previewWindow.location.href !== 'about:blank') {
          // only when loaded, reload
          previewWindow.location.reload(true)
        }
      } catch (e) {
        // case of responsize
        previewWindow.frames[1].location.reload(true)
      }
    }
    previewWindow.focus()
  } else {
    if (opt_location) {
      previewWindow = window.open(opt_location)
      previewWindow.focus()
    }
  }
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
    const page = getCurrentPage()
    if (inResponsize) {
      setPreviewWindowLocation(
          'http://www.responsize.org/?url=' +
          window.location.origin + getSite().file.absPath + page.link.href)
    } else {
      setPreviewWindowLocation(
          window.location.origin + getSite().file.absPath + page.link.href)
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
        })
  }
  if (getSite().file && !getSite().isTemplate) {
    // open the preview window
    // it is important to do it now, on the user click so that it is not
    // blocked it will be refreshed after save
    doOpenPreview()

    // also save
    if (isDirty()) {
      doSaveTheFile()
    }
  } else {
    SilexNotification.alert(
      'Preview website',
      'You need to save the website before I can show a preview',
      () => {
        doSaveTheFile()
      },
    )
  }
}
