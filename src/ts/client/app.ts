/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */

import 'simplebar'

import * as defaultConfig from './config'

/**
 * Start Silex, called from host HTML page with window.silex.start()
 */
export function start(customConfig) {
  const config = {
    ...defaultConfig,
    ...customConfig,
  }
  if (config.debug) {
    console.warn('Silex starting in debug mode.')
  }
  document.querySelector('.silex-loader').classList.add('silex-dialog-hide')
}
