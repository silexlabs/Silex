import { Config } from '@silexlabs/silex-plugins'
import { getEditorConfig } from './grapesjs'

/**
 * @fileoverview Silex client side config
 */

const id = new URL(location.href).searchParams.get('id') || 'default'
const rootUrl = '.'

export class SilexConfig extends Config {
  /**
   * debug mode
   */
  debug = false

  /**
   * Grapesjs config
   */
  editor = getEditorConfig(id, rootUrl)
}
