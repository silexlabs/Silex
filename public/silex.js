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

// This file is loaded by Silex when the user opens the editor
// Unless you override the default config with the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config
export default async function (config) {
  // // For example add a GrapesJs plugin like this
  // config.editor.plugins.push(plugin)
  // config.editor.pluginsOpts[plugin] = {
  // }
  // // Or like this to override the default options
  // // See the docs for the list of options
  // return {
  //   ...config,
  //   editor: {
  //     ...config.editor,
  //     plugins: [
  //       ...config.editor.plugins,
  //       plugin,
  //     ],
  //     pluginsOpts: {
  //       ...config.editor.pluginsOpts,
  //       [plugin]: {
  //       },
  //     },
  //   },
  // }
}
