/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */

import 'simplebar'
import { detect } from 'detect-browser'

import { config } from './ClientConfig'
import { LOADING } from './ui-store/types'
import { Notification } from './components/Notification'
import { createWorkspace, initSingleSiteMode, preventQuit, warnIfWindowTooSmall } from './components/Workspace'
import { getUi, updateUi } from './ui-store/index'
import { getUiElements } from './ui-store/UiElements'
import { initObservers } from './store/observer'
import { openDashboardToLoadAWebsite } from './file'
import { resetDirty } from './dirty'

let initDone = false

// called when Silex has started
// hide loading and show the UI
// not called when single site mode
function afterInit() {
  updateUi({
    ...getUi(),
    loading: LOADING.NONE,
  })
  resetDirty()
}

export function init() { console.warn('calling window.silex.init() is deprecated') }

// start Silex, called from host HTML page with window.silex.start()
export function start() {
  // make sure Silex is instanciated only once
  if (initDone) throw new Error('Silex has already been instanciated')
  initDone = true

  if (config.debug) {
    console.warn('Silex starting in debug mode.')
  }

  // warning when not ff or chrome
  const browser = detect()
  const isFirefox = browser && browser.name === 'firefox'
  const isChrome = browser && browser.name === 'chrome'

  if (!isFirefox && !isChrome) {
    Notification.alert('Warning',
      `Your browser is not supported yet.
      <br><br>
      Considere using <a href="https://www.mozilla.org/firefox/" target="_blank">Firefox</a>
      or <a href="https://www.google.com/chrome/" target="_blank">chrome</a>.
      <br><br>
      <small>Note: I believe you use ${ browser ? browser.name : 'Unknown' }</small>
      `,
      () => {})
  }

  // create all the components of Silex app
  createWorkspace(getUiElements().workspace)

  // start observers
  initObservers()

  // the build type
  if (!config.debug) {
    // warn when closing window if changes are not saved yet
    preventQuit()

    // warning small screen size
    warnIfWindowTooSmall()
  }

  // application start, open a file
  if (config.singleSiteMode) {
    resetDirty()
    initSingleSiteMode()
  } else {
    openDashboardToLoadAWebsite(() => afterInit(), () => afterInit())
  }
}
