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

import { SilexNotification } from './Notification'
import { Url } from '../utils/Url'
import { getPropertySplitter } from './PropSplitter';
import { getSiteIFrame } from './SiteFrame'
import { getUiElements } from '../ui-store/UiElements';
import { initBreadCrumbs } from './BreadCrumbs'
import { initContextMenu } from './ContextMenu'
import { initMenu } from './Menu'
import { initPageTool } from './PageTool'
import { initPropertyTool } from './PropertyTool'
import { isDirty } from '../dirty';
import { openRecent } from '../file'

/**
 * @fileoverview Silex workspace is in charge of positionning
 *   the main UI elements.
 * It refreshes the view when the window size changes, and also when
 *   it is set as dirty. There is an invalidation mechanism to prevent
 *   redraw many times in the same key frame
 *
 */

/**
 * create the workspace, start listening to window events
 */
export function createWorkspace(element: HTMLElement) {
  // creation of the view instances
  initMenu()
  initContextMenu()
  initBreadCrumbs()
  initPageTool()
  initPropertyTool()

  // // code editors need to start listening to store
  // // was done in the Workspace component but the later the better
  // initCssEditor()
  // initJsEditor()
  // initHtmlEditor()

  // add splitters
  const uiElements = getUiElements()
  const propSplitter = getPropertySplitter()
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
    const { path, service }: { path: string, service: string } = params;
    if (path && service) {
      openRecent({
        path,
        service,
        absPath: `/ce/${service}/get${path}`,
        name: path.split('/').pop(),
        mime: '',
        isDir: false,
        // url: `${Url.getRootUrl()}/ce/${params.service}/get${params.path}`,
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

// /**
//  * called on window resize and when the layout changes
//  */
// function resizeWorkspace(element: HTMLElement) {
//   resizeWindow()
//
//   // // change the number of columns in the properties pannel
//   // const container = element.querySelector('.silex-property-tool .main-container');
//   // if (container.clientWidth < 500) {
//   //   container.classList.add('size1');
//   //   container.classList.remove('size2');
//   //   container.classList.remove('size3');
//   // } else {
//   //   if (container.clientWidth < 750) {
//   //     container.classList.remove('size1');
//   //     container.classList.add('size2');
//   //     container.classList.remove('size3');
//   //   } else {
//   //     if (container.clientWidth < 1000) {
//   //       container.classList.remove('size1');
//   //       container.classList.remove('size2');
//   //       container.classList.add('size3');
//   //     }
//   //   }
//   // }
