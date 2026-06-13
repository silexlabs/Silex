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

const path = require('path');
const webpack = require("webpack")

// Monorepo: compile the grapesjs-* plugins from their SOURCE in a single pass,
// instead of pulling each plugin's pre-built dist/. This removes the per-plugin
// build step (the plugins are now plain source folders in the monorepo).
// `$` = exact match, so subpath imports (e.g. .../src/commands) still resolve normally.
const pluginSrc = {
  '@silexlabs/grapesjs-filter-styles$': '../../plugins/grapesjs-filter-styles/src/index.js',
  '@silexlabs/grapesjs-symbols$': '../../plugins/grapesjs-symbols/src/index.ts',
  '@silexlabs/grapesjs-loading$': '../../plugins/grapesjs-loading/src/index.ts',
  '@silexlabs/grapesjs-fonts$': '../../plugins/grapesjs-fonts/src/index.js',
  '@silexlabs/grapesjs-css-variables$': '../../plugins/grapesjs-css-variables/src/index.js',
  '@silexlabs/grapesjs-advanced-selector$': '../../plugins/grapesjs-advanced-selector/src/index.ts',
  '@silexlabs/grapesjs-storage-rate-limit$': '../../plugins/grapesjs-storage-rate-limit/src/index.js',
  '@silexlabs/grapesjs-notifications$': '../../plugins/grapesjs-notifications/src/index.ts',
  '@silexlabs/grapesjs-keymaps-dialog$': '../../plugins/grapesjs-keymaps-dialog/src/index.ts',
  '@silexlabs/grapesjs-ai-capabilities$': '../../plugins/grapesjs-ai-capabilities/src/index.js',
  '@silexlabs/grapesjs-data-source$': '../../plugins/grapesjs-data-source/src/index.ts',
  '@silexlabs/expression-input$': '../../plugins/expression-input/src/index.ts',
}
const pluginAliases = Object.fromEntries(
  Object.entries(pluginSrc).map(([k, v]) => [k, path.resolve(__dirname, v)])
)

module.exports = {
  entry: './src/ts/client/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        // Bundling only: type-checking is a separate CI job (tsc/lint).
        // Required to transpile the plugin sources (compiled here, not pre-built).
        // experimentalDecorators + useDefineForClassFields:false: the lit-based
        // plugins (data-source, advanced-selector, expression-input) use legacy
        // decorators (@property/@state); ESNext target would otherwise break them.
        options: {
          transpileOnly: true,
          compilerOptions: {
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            useDefineForClassFields: false,
          },
        },
      },
    ]
  },
  resolve: {
  extensions: ['.tsx', '.ts', '.js'],
  // TS ESM sources (e.g. expression-input) import siblings as "./x.js" while the
  // file is "x.ts"; let webpack resolve a ".js" specifier to its ".ts" source.
  extensionAlias: { '.js': ['.ts', '.js'], '.mjs': ['.mts', '.mjs'] },
  alias: pluginAliases,
  modules: [
    path.resolve(__dirname, 'src'), // default src directory
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, 'node_modules'),
  ],
},

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/client/js'),
    library: 'silex',
  },
  plugins: [
    new webpack.DefinePlugin({
      SILEX_VERSION_ENV: JSON.stringify(require("./package.json").version),
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^jquery$/,
      contextRegExp: /backbone/
    })
  ]
};
