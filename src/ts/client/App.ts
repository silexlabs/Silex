/**
 * @preserve
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview This file defines the entry point of Silex
 *
 * a view holds a reference to the controllers so that it can order changes on
 * the models a controller holds a reference to the models so that it can change
 * them a model holds a reference to the views so that it can update them
 *
 */

import { detect } from 'detect-browser'

import { Config } from './ClientConfig'
import { LOADING } from './ui-store/types'
import { SilexNotification } from './utils/Notification'
import { createWorkspace, initSingleSiteMode, preventQuit, warnIfWindowTooSmall } from './components/Workspace'
import { getUi, updateUi } from './ui-store/index'
import { getUiElements } from './ui-store/UiElements'
import { initObservers } from './store/observer';
import { openDashboardToLoadAWebsite } from './api/file'
import { init } from './api'

/**
 * Defines the entry point of Silex client application
 * TODO: why a class? should be a function
 *
 */
export class App {
  /**
   * Entry point of Silex client application
   * create all views and models and controllers
   *
   */
  constructor(debug = false) {
    // the debug flag comes from index.jade or debug.jade
    Config.debug.debugMode = debug;
    if (Config.debug.debugMode) {
      console.warn('Silex starting in debug mode.');
    }

    // warning when not ff or chrome
    const browser = detect();
    const isFirefox = browser && browser.name === 'firefox';
    const isChrome = browser && browser.name === 'chrome';

    if (!isFirefox && !isChrome) {
      SilexNotification.alert('Warning',
          `
            Your browser is not supported yet.
            <br><br>
            Considere using <a href="https://www.mozilla.org/firefox/" target="_blank">Firefox</a>
             or <a href="https://www.google.com/chrome/" target="_blank">chrome</a>.
             <br><br>
             <small>Note: I believe you use ${ browser ? browser.name : 'Unknown' }</small>
             `,
          () => {});
    }

    // create all the components of Silex app
    createWorkspace(getUiElements().workspace)

    // start observers
    initObservers();

    // the build type
    if (!Config.debug.debugMode) {
      // warn when closing window if changes are not saved yet
      preventQuit()

      // warning small screen size
      warnIfWindowTooSmall()
    }

    // application start, open a file
    if (Config.singleSiteMode) {
      initSingleSiteMode()
      .then(() => this.initDone())
    } else {
      openDashboardToLoadAWebsite(() => this.initDone(), () => this.initDone());
    }
  }

  initDone() {
    updateUi({
      ...getUi(),
      loading: LOADING.NONE,
    });
  }
}

// TODO: why start and init?
init(window, () => {
  // tslint:disable:no-string-literal
  window['silex']['app'] = new App();
}, () => {
  window['silex']['config'] = Config;
})
