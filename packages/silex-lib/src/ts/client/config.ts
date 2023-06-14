import { Config } from '@silexlabs/silex-plugins'
import { getEditorConfig } from './grapesjs'
import { CLIENT_CONFIG_FILE_NAME } from '../constants'
import { Plugin } from 'grapesjs'

/**
 * @fileoverview Silex client side config
 */

const id = new URL(location.href).searchParams.get('id') || 'default'
const rootUrl = location.href

export class SilexConfig extends Config {
  /**
   * debug mode
   */
  debug = false

  /**
   * Grapesjs config
   */
  editor = getEditorConfig(id, rootUrl)

  /**
   * Client config url
   * This is the url of the config file which is a plugin
   */
  clientConfigUrl = `${rootUrl}${CLIENT_CONFIG_FILE_NAME}`
}
