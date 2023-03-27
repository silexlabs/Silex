/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */

import { defaultConfig } from './config'
import { initEditor, getEditor } from './grapesjs/index'

/**
 * Start Silex, called from host HTML page with window.silex.start()
 */
export function start(config = defaultConfig) {
  if (config.debug) {
    console.warn('Silex starting in debug mode.', {config})
  }

  initEditor(config.editor)

  getEditor().on('load', () => {
    document.querySelector('.silex-loader').classList.add('silex-dialog-hide')
    document.querySelector('#gjs').classList.remove('silex-dialog-hide')
  })
}
