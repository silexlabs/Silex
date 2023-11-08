/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Config } from '@silexlabs/silex-plugins'
import { getEditor, getEditorConfig } from './grapesjs'
import { CLIENT_CONFIG_FILE_NAME, DEFAULT_LANGUAGE, DEFAULT_WEBSITE_ID } from '../constants'
import { ConnectorId, WebsiteId } from '../types'
import { Editor, EditorConfig, Page } from 'grapesjs'
import { PublicationTransformer, publicationTransformerDefault, validatePublicationTransformer } from './publication-transformers'
import * as api from './api'
import { assetsPublicationTransformer } from './assetUrl'

/**
 * @fileoverview Silex client side config
 */

export class ClientConfig extends Config {
  api = api

  /**
   * The website to load
   * This is the id of the website in the storage connector
   */
  websiteId: WebsiteId = new URL(location.href).searchParams.get('id') ?? DEFAULT_WEBSITE_ID

  /**
   * The storage connector to use
   * If not found in the URL and the user is not logged in to any storage, use the first storage
   */
  storageId: ConnectorId = new URL(location.href).searchParams.get('connectorId')

  /**
   * language for I18n module
   */
  lang = new URL(location.href).searchParams.get('lang') ?? DEFAULT_LANGUAGE

  /**
   * root url of Silex app
   */
  rootUrl = window.location.origin + window.location.pathname.replace(/\/$/, '')

  /**
   * debug mode
   */
  debug = false

  /**
   * Grapesjs config
   */
  grapesJsConfig: EditorConfig = {
    plugins: [],
    pluginsOpts: {},
  }

  /**
   * Client config url
   * This is the url of the config file which is a plugin
   */
  clientConfigUrl = `${this.rootUrl}/${CLIENT_CONFIG_FILE_NAME}`

  /**
   * Init GrapesJS config which depend on the config file properties
   */
  initGrapesConfig() {
    // Get the initial config
    const config = getEditorConfig(this.websiteId, this.storageId, this.rootUrl)

    // Merge with the config modified by plugins
    this.grapesJsConfig = {
      ...this.grapesJsConfig,
      ...config,
      plugins: [
        ...this.grapesJsConfig.plugins,
        ...config.plugins,
      ],
      pluginsOpts: {
        ...this.grapesJsConfig.pluginsOpts,
        ...config.pluginsOpts,
      },
    }
  }

  /**
   * Get grapesjs editor
   */
  getEditor(): Editor {
    return getEditor()
  }

  /**
   * Publication transformers let plugins change files before they are published
   */
  publicationTransformers: Array<PublicationTransformer> = [assetsPublicationTransformer, publicationTransformerDefault]

  /**
   * Reset publication transformers
   */
  resetPublicationTransformers() {
    this.publicationTransformers = [assetsPublicationTransformer]
  }

  /**
   * Add a publication transformer(s)
   */
  addPublicationTransformers(transformers: PublicationTransformer | PublicationTransformer[]) {
    // Make sure it is an array
    if (!Array.isArray(transformers)) {
      transformers = [transformers]
    }
    // Validate
    transformers.forEach(transformer => {
      validatePublicationTransformer(transformer)
    })
    // Add to the list
    this.publicationTransformers = this.publicationTransformers.concat(transformers)
  }
}
