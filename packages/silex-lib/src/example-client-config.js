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

import directusStorage from 'https://unpkg.com/@silexlabs/grapesjs-directus-storage'
console.log('directusStorage', directusStorage, directusStorage?.default)

// Use the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config to override the default config with this file
export default async function (config, options) {
  console.log('In example config')
  //await config.addPlugin('gjs-blocks-basic', 'https://unpkg.com/grapesjs-blocks-basic', {
  //    blocks: ['text', 'image', 'video', 'map'],
  //})

  // Optional plugins
  await config.addPlugin([
    '@silexlabs/grapesjs-directus-storage',
    './plugins/@silexlabs/grapesjs-directus-storage/dist/index.js',
  ], {
    '@silexlabs/grapesjs-directus-storage': {
      directusUrl: 'http://localhost:8055',
    },
    './plugins/@silexlabs/grapesjs-directus-storage/dist/index.js': {
      directusUrl: 'http://localhost:8055',
    },
  })

  // Return an object to override default config
  return {
    ...config,
    ...options,
    editor: {
      ...config.editor,
      storageManager: {
        autoload: false,
        type: 'directus',
      },
      plugins: [
        ...config.editor.plugins,
        directusStorage,
      ],
      pluginsOpts: {
        ...config.editor.pluginsOpts,
        [directusStorage]: {
          directusUrl: 'http://localhost:8055',
        },
      },
    },
  }
}

