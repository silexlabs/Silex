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

/**
 * @fileoverview Run Silex with publication transformers
 * Start silex with the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config set to this file
 */

export default async function (config) {
  config.addPublicationTransformers({
    // Override how components render at publication by grapesjs
    renderComponent(component, toHtml) {
      return toHtml()
    },
    // Override how styles render at publication by grapesjs
    renderCssRule(rule, initialCss) {
      return initialCss()
    },
    // Define how files are named
    transformPath(path) {
      return path
    },
    // Difine files URLs
    transformPermalink(link, type, initiator) {
      return link
    },
    // Transform files after they are rendered and before they are published
    transformFile(file) {
      throw new Error('test publication transformer error')
      return file
    }
  })
}

