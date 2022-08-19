/**
 * @fileoverview Silex workspace is in charge of initialization of
 *   the main UI elements.
 * It refreshes the view when the window size changes
 */

import { Notification } from './Notification'
import { Url } from '../utils/Url'
import { getPropertySplitter } from './PropSplitter'
import { getSiteIFrame } from './SiteFrame'
import { getUiElements } from '../ui-store/UiElements'
import { initBreadCrumbs } from './BreadCrumbs'
import { initContextMenu } from './ContextMenu'
import { initMenu } from './Menu'
import { initPageTool } from './PageTool'
import { initProdotype } from '../element-store/component'
import { initPropertyTool } from './PropertyTool'
import { isDirty } from '../dirty'
import { openRecent } from '../file'

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

  // init style editor and component editor
  initProdotype()

  // // code editors need to start listening to store
  // // was done in the Workspace component but the later the better
  // initCssEditor()
  // initJsEditor()
  // initHtmlEditor()

  // add splitters
  const uiElements = getUiElements()
  const propSplitter = getPropertySplitter()
  propSplitter.addLeft(uiElements.contextMenu)
  propSplitter.addLeft(uiElements.breadCrumbs)
  propSplitter.addLeft(getSiteIFrame().parentElement)
  propSplitter.addRight(uiElements.propertyTool)
}

export async function initSingleSiteMode(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // hide menu items
    document.body.classList.add('single-site-mode')
    // open the website from url
    const params = Url.getUrlParams()
    const { path, service }: { path: string, service: string } = params
    if (path && service) {
      openRecent({
        path,
        service,
        absPath: `${ Url.getPath() }/ce/${service}/get${path}`,
        name: path.split('/').pop(),
        mime: '',
        isDir: false,
        // url: `${Url.getRootUrl()}/ce/${params.service}/get${params.path}`,
      }, () => {
        resolve()
      })
    } else {
      Notification.alert('Open a file', `
          Could not open the file ${params.path}.<br /><br />
          You need to specify which website I am supposed to open with the variables "path" and "service" in the URL. Please <a href="https://github.com/silexlabs/Silex/wiki/Single-site-mode" target="_blank">check this document</a> or <a href="https://github.com/silexlabs/Silex/issues" target="_blank">get in touch in Silex forums"</a>
      `,
      () => {})
      reject()
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
      return 'You have unsaved modifications, are you sure you want to leave me?'
    }
    return null
  }
}

export function warnIfWindowTooSmall() {
  // height must be enough to view the settings pannel
  // width is just arbitrary
  const winSizeWidth = document.documentElement.clientWidth
  const winSizeHeight = document.documentElement.clientHeight
  const minWinSizeWidth = 950
  const minWinSizeHeight = 630
  if (winSizeHeight < minWinSizeHeight || winSizeWidth < minWinSizeWidth) {
    Notification.alert('Warning',
        `Your window is very small (${winSizeWidth}x${
            winSizeHeight}) and Silex may not display correctly.<br><br>Considere maximizing the window or use a bigger screen to use Silex at its best. A window size of ${
            minWinSizeWidth}x${
            minWinSizeHeight} is considered to be a acceptable.`,
        () => {})
  }
}
