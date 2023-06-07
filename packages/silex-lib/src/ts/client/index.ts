/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */

// Get env vars from webpack (see plugin in webpack.config.js)
declare const CONFIG_URL: string

import { SilexConfig } from './config'
import { initEditor, getEditor } from './grapesjs/index'

/**
 * Start Silex, called from host HTML page with window.silex.start()
 */
export async function start(options = {}) {
  const config = new SilexConfig()
  Object.assign(config, options)

  // Initial config file
  if(CONFIG_URL) {
    await config.addPlugin(CONFIG_URL, {})
  }

  // Debug mode
  if (config.debug) {
    console.warn('Silex starting in debug mode.', {config})
  }

  // Start grapesjs
  initEditor(config.editor)

  // End of loading
  getEditor().on('load', () => {
    document.querySelector('.silex-loader').classList.add('silex-dialog-hide')
    document.querySelector('#gjs').classList.remove('silex-dialog-hide')
  })
}
