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

module.exports = {
  entry: './src/ts/client/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
    ]
  },
  resolve: {
  extensions: ['.tsx', '.ts', '.js'],
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
