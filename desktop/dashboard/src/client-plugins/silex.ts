/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

// The client config of the desktop app, which the editor loads from /silex.js
import type { Editor } from 'grapesjs'
import type { SsgId } from '~/common/types'
import thumbnail, { type EditorClientConfig } from './thumbnail'

export default async function (config: EditorClientConfig & { ssg: SsgId }) {
  config.ssg = 'zola'
  config.grapesJsConfig.plugins?.push((editor: Editor) => thumbnail(editor, config))
}
