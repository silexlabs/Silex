import { Config, Plugin } from '@silexlabs/silex-plugins'
import { getEditorConfig } from './grapesjs'
import { CLIENT_CONFIG_FILE_NAME } from '../constants'

/**
 * @fileoverview Silex client side config
 */

const id = new URL(location.href).searchParams.get('id') || 'default'
const lang = new URL(location.href).searchParams.get('lang') || 'en'
const rootUrl = `${location.protocol}//${location.host}${location.pathname}`

export class SilexConfig extends Config {
  /**
   * debug mode
   */
  debug = false

  /**
   * language for I18n module
   */
  lang = lang

  /**
   * Grapesjs config
   */
  editor = getEditorConfig(id, rootUrl)

  /**
   * Client config url
   * This is the url of the config file which is a plugin
   */
  clientConfigUrl = `${rootUrl}${CLIENT_CONFIG_FILE_NAME}`

  /**
   * GrapesJs plugins
   */
  grapesJsPlugins: Plugin[] = []
}
