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

import type { Editor, Page } from 'grapesjs'

interface WebsiteMeta {
  name: string
  imageUrl?: string
  connectorUserSettings?: unknown
}

type Website = { websiteId: string; connectorId?: string }

// What the editor exposes on `window.silex`, as far as this plugin uses it
declare global {
  interface Window {
    silex: {
      api: {
        getServerUrl(): string
        websiteMetaRead(website: Website): Promise<WebsiteMeta>
        websiteMetaWrite(website: Website & { data: WebsiteMeta }): Promise<void>
      }
      page: { getPageSlug(name?: string): string }
    }
  }
}

type Settings = { head?: string }

const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 800
const THUMBNAIL_WIDTH = 640
const LOAD_TIMEOUT_MS = 10000

export default function thumbnailPlugin(editor: Editor) {
  editor.on('silex:publish:end', ({ success }: { success: boolean }) => {
    if (!success) return
    updateThumbnail(editor).catch((e) => console.warn('Could not update the website thumbnail', e))
  })
}

async function updateThumbnail(editor: Editor) {
  const { websiteId, storageId } = editor.getModel().get('config')
  const { websiteMetaRead, websiteMetaWrite } = window.silex.api
  const meta = await websiteMetaRead({ websiteId, connectorId: storageId })
  if (meta.imageUrl && !meta.imageUrl.startsWith('/assets/silex-thumbnail.')) return
  const image = await capture(editor, homePage(editor))
  const url = await upload(image, websiteId, storageId)
  if (meta.imageUrl === url) return
  await websiteMetaWrite({
    websiteId,
    connectorId: storageId,
    data: { name: meta.name, imageUrl: url, connectorUserSettings: meta.connectorUserSettings },
  })
}

function homePage(editor: Editor): Page {
  const pages = editor.Pages.getAll()
  return pages.find((page) => window.silex.page.getPageSlug(page.get('name')) === 'index') ?? pages[0]
}

async function capture(editor: Editor, page: Page): Promise<Blob> {
  const body = page.getMainComponent()
  const siteSettings: Settings = editor.getModel().get('settings') ?? {}
  const pageSettings: Settings = page.get('settings') ?? {}
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.inert = true
  iframe.style.cssText = `position: fixed; left: -${VIEWPORT_WIDTH * 2}px; top: 0; width: ${VIEWPORT_WIDTH}px; height: ${VIEWPORT_HEIGHT}px; border: 0;`
  // Not a sandbox, which would also silence the load events html2canvas waits for: the
  // analytics or custom code of the site must not run here
  iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="script-src 'none'; frame-src 'none'; object-src 'none'">
${siteSettings.head ?? ''}
${pageSettings.head ?? ''}
<style>${editor.getCss({ component: body })}</style>
</head>${editor.getHtml({ component: body })}</html>`
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('The home page took too long to load')), LOAD_TIMEOUT_MS)
      iframe.onload = () => {
        clearTimeout(timeout)
        resolve()
      }
      document.body.appendChild(iframe)
    })
    const doc = iframe.contentDocument
    if (!doc) throw new Error('The home page could not be rendered')
    await doc.fonts.ready
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(doc.documentElement, {
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      windowWidth: VIEWPORT_WIDTH,
      windowHeight: VIEWPORT_HEIGHT,
      scale: THUMBNAIL_WIDTH / VIEWPORT_WIDTH,
      logging: false,
    })
    const webp = await toBlob(canvas, 'image/webp')
    // WebKit, hence the desktop app on Linux and macOS, cannot encode WebP and silently gives a PNG
    return webp.type === 'image/webp' ? webp : toBlob(canvas, 'image/jpeg')
  } finally {
    iframe.remove()
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('Could not encode the thumbnail')),
    type,
    0.8,
  ))
}

async function upload(image: Blob, websiteId: string, storageId?: string): Promise<string> {
  const name = `silex-thumbnail.${image.type === 'image/webp' ? 'webp' : 'jpg'}`
  const form = new FormData()
  form.append('files[]', image, name)
  const query = new URLSearchParams({ websiteId, ...(storageId ? { connectorId: storageId } : {}) })
  const response = await fetch(`${window.silex.api.getServerUrl()}/api/website/assets?${query}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  // The server keeps the name it is given, in the assets folder of the website
  return `/assets/${name}`
}
