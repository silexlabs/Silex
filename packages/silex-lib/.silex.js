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
 * @fileoverview This file is loaded by Silex at startup, after the user config if you specify one
 */

const SslPlugin = require('./dist/plugins/server/plugins/server/SslPlugin').default
const StaticPlugin = require('./dist/plugins/server/plugins/server/StaticPlugin').default
const { join } = require('path')
const nodeModules = require('node_modules-path')

module.exports = async function(config, options) {
  try {
    await config.addPlugin([
      SslPlugin,
      StaticPlugin,
    ], {
      [StaticPlugin]: {
        routes: [
          {
            route: '/',
            path: join(__dirname, 'public'),
          }, {
            route: '/css/',
            path: nodeModules('@fortawesome/fontawesome-free') + '/@fortawesome/fontawesome-free/css/',
          }, {
            route: '/webfonts/',
            path: nodeModules('@fortawesome/fontawesome-free') + '/@fortawesome/fontawesome-free/webfonts/',
          }, {
            route: '/css/files/',
            path: nodeModules('@fontsource/ubuntu') + '/@fontsource/ubuntu/files/',
          }, {
            route: '/lottie-player/',
            path: nodeModules('@lottiefiles/lottie-player') + '/@lottiefiles/lottie-player/dist/',
          }, {
            route: '/',
            path: join(__dirname, 'dist', 'client'),
          }, {
            route: '/',
            path: join(__dirname, 'dist', 'plugins', 'client'),
          },
        ]
          // add project route for source maps
          .concat(config.debug ? [{
            route: '/',
            path: './',
          }, {
            // why is this needed when running locally?
            route: '/css/',
            path: 'node_modules/@fortawesome/fontawesome-free/css/',
          }, {
            // why is this needed when running locally?
            route: '/webfonts/',
            path: 'node_modules/@fortawesome/fontawesome-free/webfonts/',
          }] : []),
      },
    })
  } catch(e) {
    console.error(e)
  }

  // Return an object to be merged with Silex config
  return {}
}
