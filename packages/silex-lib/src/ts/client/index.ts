/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */

import { defaultConfig } from './config'
import { initEditor } from './grapesjs/index'

/**
 * Start Silex, called from host HTML page with window.silex.start()
 */
export function start(config = defaultConfig) {
  if (config.debug) {
    console.warn('Silex starting in debug mode.', {config})
  }

  initEditor(config.editor)

  window.onload = () => {
    document.querySelector('.silex-loader').classList.add('silex-dialog-hide')
    document.querySelector('#gjs').classList.remove('silex-dialog-hide')
  }
}
