/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

import { SilexNotification } from '../utils/Notification'
import { Url } from '../utils/Url'
import { getUiElements } from '../ui/UiElements'
import { Splitter } from './Splitter'
import { openRecent } from '../api/file'
import { isDirty } from '../api/undo'
import { initMenu } from './Menu'
import { initContextMenu } from './ContextMenu'
import { initBreadCrumbs } from './BreadCrumbs'
import { initPageTool } from './PageTool'
import { initPropertyTool } from './PropertyTool'
import { getSiteIFrame } from './SiteFrame'

/**
 * @fileoverview Silex workspace is in charge of positionning
 *   the main UI elements.
 * It refreshes the view when the window size changes, and also when
 *   it is set as dirty. There is an invalidation mechanism to prevent
 *   redraw many times in the same key frame
 *
 */

export let propSplitter

/**
 * create the workspace, start listening to window events
 */
export function createWorkspace(element: HTMLElement) {
  window.addEventListener('resize', () => resizeWorkspace(element))

  // creation of the view instances
  initMenu()
  initContextMenu()
  initBreadCrumbs()
  initPageTool()
  initPropertyTool()

  // add splitters
  const uiElements = getUiElements()
  propSplitter = new Splitter(uiElements.verticalSplitter, () => resizeWorkspace(element));
  propSplitter.addLeft(uiElements.contextMenu);
  propSplitter.addLeft(uiElements.breadCrumbs);
  propSplitter.addLeft(getSiteIFrame().parentElement);
  propSplitter.addRight(uiElements.propertyTool);
}

export async function initSingleSiteMode() {
  return new Promise((resolve, reject) => {
    // hide menu items
    document.body.classList.add('single-site-mode');
    // open the website from url
    const params = Url.getUrlParams();
    if (params.path && params.service) {
      openRecent({
        path: params.path,
        service: params.service,
        absPath: `/ce/${params.service}/get${params.path}`,
        url: `${Url.getRootUrl()}/ce/${params.service}/get${params.path}`,
      }, () => {
        resolve();
      });
    } else {
      SilexNotification.alert('Open a file', `
          Could not open the file ${params.path}.<br /><br />
          You need to specify which website I am supposed to open with the variables "path" and "service" in the URL. Please <a href="https://github.com/silexlabs/Silex/wiki/Single-site-mode" target="_blank">check this document</a> or <a href="https://github.com/silexlabs/Silex/issues" target="_blank">get in touch in Silex forums"</a>
      `,
      () => {});
      reject();
    }
  })
}

/**
 * handle the "prevent leave page" mechanism
 * listen for the unload event and warn the user
 * prevent quit only when the current website is dirty
 */
export function preventQuit() {
  window.onbeforeunload = () => {
    if (isDirty()) {
      return 'You have unsaved modifications, are you sure you want to leave me?';
    }
    return null;
  };
}

export function warnIfWindowTooSmall() {
  // height must be enough to view the settings pannel
  // width is just arbitrary
  const winSizeWidth = document.documentElement.clientWidth;
  const winSizeHeight = document.documentElement.clientHeight;
  const minWinSizeWidth = 950;
  const minWinSizeHeight = 630;
  if (winSizeHeight < minWinSizeHeight || winSizeWidth < minWinSizeWidth) {
    SilexNotification.alert('Warning',
        `Your window is very small (${winSizeWidth}x${
            winSizeHeight}) and Silex may not display correctly.<br><br>Considere maximizing the window or use a bigger screen to use Silex at its best. A window size of ${
            minWinSizeWidth}x${
            minWinSizeHeight} is considered to be a acceptable.`,
        () => {});
  }
}

/**
 * called on window resize and when the layout changes
 */
function resizeWorkspace(element: HTMLElement) {
  propSplitter.redraw(false)

  // change the number of columns in the properties pannel
  const container = element.querySelector('.silex-property-tool .main-container');
  if (container.clientWidth < 500) {
    container.classList.add('size1');
    container.classList.remove('size2');
    container.classList.remove('size3');
  } else {
    if (container.clientWidth < 750) {
      container.classList.remove('size1');
      container.classList.add('size2');
      container.classList.remove('size3');
    } else {
      if (container.clientWidth < 1000) {
        container.classList.remove('size1');
        container.classList.remove('size2');
        container.classList.add('size3');
      }
    }
  }
}

// store the window viewport for later use
let previewWindow: Window;

/**
 * open a popup or refresh the allready opened one
 * @param opt_location or null to refresh only
 */
export function setPreviewWindowLocation(opt_location?: string) {
  if (previewWindow && !previewWindow.closed) {
    if (opt_location) {
      previewWindow.close();
      previewWindow = window.open(opt_location);
      previewWindow.focus();
    } else {
      try {
        if (previewWindow.location.href !== 'about:blank') {
          // only when loaded, reload
          previewWindow.location.reload(true);
        }
      } catch (e) {
        // case of responsize
        previewWindow.frames[1].location.reload(true);
      }
    }
    previewWindow.focus();
  } else {
    if (opt_location) {
      previewWindow = window.open(opt_location);
      previewWindow.focus();
    }
  }
}

/**
 * input element to get the focus
 * used to blur the UI inputs
 */
let focusInput: HTMLElement;

/**
 * remove the focus from all text fields
 */
export function resetFocus() {
  if (!focusInput) {
    focusInput = document.createElement('input');

    // hide the focus input and attach it to the DOM
    focusInput.style.left = '-1000px';
    focusInput.style.position = 'absolute';
    document.body.appendChild(focusInput);
  }
  // setTimeout because we might need to wait for a click to finish bubbling
  // e.g. when edit text, the UI layer is hidden, click on the stage => focus on the stage iframe
  setTimeout(() => {
    focusInput.focus();
    focusInput.blur();
    document.getSelection().removeAllRanges();
  }, 0);
}
