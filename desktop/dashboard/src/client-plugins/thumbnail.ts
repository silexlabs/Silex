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

import type { Editor, EditorConfig } from 'grapesjs'
import {
  API_PATH,
  API_WEBSITE_ASSETS_WRITE,
  API_WEBSITE_META_READ,
  API_WEBSITE_META_WRITE,
  API_WEBSITE_PATH,
} from '~/common/constants'
import type {
  ApiWebsiteMetaReadResponse,
  ApiWebsiteMetaWriteBody,
  ConnectorId,
  WebsiteId,
} from '~/common/types'
import { ClientEvent } from '~/editor/events'

/**
 * What this plugin reads of the editor's `ClientConfig`
 *
 * Importing `ClientConfig` would type-check the whole editor, which does not
 * pass the dashboard's strict settings.
 */
export interface EditorClientConfig {
  grapesJsConfig: EditorConfig
  websiteId: WebsiteId
  storageId?: ConnectorId | null
  rootUrl: string
}

const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 800
const THUMBNAIL_WIDTH = 640
// The outlines the editor draws on the canvas
const EDITOR_CLASSES = ['gjs-dashed', 'gjs-selected', 'gjs-selected-parent', 'gjs-hovered']

export default function thumbnailPlugin(editor: Editor, config: EditorClientConfig) {
  editor.on(ClientEvent.PUBLISH_END, ({ success }: { success: boolean }) => {
    if (!success) return
    updateThumbnail(editor, config).catch((e) => console.warn('Could not update the website thumbnail', e))
  })
}

async function updateThumbnail(editor: Editor, config: EditorClientConfig) {
  const meta = await request<ApiWebsiteMetaReadResponse>(config, API_WEBSITE_META_READ, { method: 'GET' })
  if (meta.imageUrl && !meta.imageUrl.startsWith('/assets/silex-thumbnail.')) return
  const image = await capture(editor)
  const url = await upload(image, config)
  if (meta.imageUrl === url) return
  const data: ApiWebsiteMetaWriteBody = {
    name: meta.name,
    imageUrl: url,
    connectorUserSettings: meta.connectorUserSettings,
  }
  await request(config, API_WEBSITE_META_WRITE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

async function request<T>({ rootUrl, websiteId, storageId }: EditorClientConfig, route: string, init: RequestInit): Promise<T> {
  const query = new URLSearchParams({ websiteId, ...(storageId ? { connectorId: storageId } : {}) })
  const response = await fetch(`${rootUrl}${API_PATH}${API_WEBSITE_PATH}${route}?${query}`, {
    ...init,
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`${route}: ${response.status} ${response.statusText}`)
  return response.json()
}

async function capture(editor: Editor): Promise<Blob> {
  const doc = editor.Canvas.getDocument()
  if (!doc) throw new Error('The canvas is not ready')
  await doc.fonts.ready
  const { default: html2canvas } = await import('html2canvas')
  // html2canvas renders a copy of the page in a window of its own size, so the
  // device and the scroll of the editor are not the ones captured
  const canvas = await html2canvas(doc.documentElement, {
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    windowWidth: VIEWPORT_WIDTH,
    windowHeight: VIEWPORT_HEIGHT,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    scale: THUMBNAIL_WIDTH / VIEWPORT_WIDTH,
    useCORS: true,
    logging: false,
    onclone: (copy) => {
      copy.querySelectorAll(EDITOR_CLASSES.map((name) => `.${name}`).join(','))
        .forEach((element) => element.classList.remove(...EDITOR_CLASSES))
    },
  })
  const webp = await toBlob(canvas, 'image/webp')
  // WebKit, hence the desktop app on Linux and macOS, cannot encode WebP and silently gives a PNG
  return webp.type === 'image/webp' ? webp : toBlob(canvas, 'image/jpeg')
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('Could not encode the thumbnail')),
    type,
    0.8,
  ))
}

async function upload(image: Blob, config: EditorClientConfig): Promise<string> {
  const name = `silex-thumbnail.${image.type === 'image/webp' ? 'webp' : 'jpg'}`
  const form = new FormData()
  form.append('files[]', image, name)
  await request(config, API_WEBSITE_ASSETS_WRITE, { method: 'POST', body: form })
  // The server keeps the name it is given, in the assets folder of the website
  return `/assets/${name}`
}
