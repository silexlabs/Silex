/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

// The client config of the desktop app, which the editor loads from /silex.js
import type { EditorConfig } from 'grapesjs'
import thumbnail from './thumbnail'

export default async function (config: { grapesJsConfig: EditorConfig }) {
  config.grapesJsConfig.plugins?.push(thumbnail)
}
