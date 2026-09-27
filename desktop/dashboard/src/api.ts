import { invoke } from '@tauri-apps/api/core'
import { i18n } from './i18n'

export interface Website {
  websiteId: string
  name: string
  imageUrl?: string
  updatedAt?: string
  repoUrl?: string
}

/** A sentence of the locales, and what the system said, which is not translated */
export class Said extends Error {
  constructor(
    readonly sentence?: string,
    readonly params: Record<string, string> = {},
    readonly detail = '',
  ) {
    super(detail || sentence)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/website${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // WebKit's "Load failed" says nothing to the person
    throw new Said('Silex is not answering. Restart it, then try again.', {}, (error as Error).message)
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.sentence) throw new Said(data.sentence, data.params, data.detail)
    // "Forbidden" alone reads like a sentence left untranslated
    throw new Said(undefined, {}, data.message ?? `HTTP ${response.status} ${response.statusText}`)
  }
  return data
}

// Tauri rejects with the error of the command as it is, a plain string for its own
const call = <T>(command: string, args: Record<string, unknown>) =>
  invoke<T>(command, args).catch((error: unknown) => {
    if (typeof error === 'string') throw new Said(undefined, {}, error)
    const { sentence, params, detail } = error as Partial<Said>
    throw new Said(sentence, params, detail)
  })

/** What an error dialog says of a failure, under the title */
export function explain(error: unknown): { message?: string; detail?: string } {
  const said = error instanceof Said ? error : new Said(undefined, {}, String((error as Error)?.message ?? error))
  const detail = said.detail || undefined
  if (said.sentence) return { message: i18n.global.t(said.sentence, said.params), detail }
  // What the system said alone gives the person nothing to do
  return { message: detail && i18n.global.t('Try again. If the problem goes on, report it with this detail.'), detail }
}

export const listWebsites = () => request<Website[]>('GET', '')

export const createWebsite = (name: string) =>
  request<{ websiteId: string }>('PUT', '', { name }).then(({ websiteId }) => websiteId)

export const renameWebsite = (website: Website, name: string) =>
  request('POST', `/meta?websiteId=${encodeURIComponent(website.websiteId)}`, { name, imageUrl: website.imageUrl })

export const duplicateWebsite = (websiteId: string, name: string) =>
  request('POST', `/duplicate?websiteId=${encodeURIComponent(websiteId)}&name=${encodeURIComponent(name)}`)

export const createWebsiteFromTemplate = (name: string, repoUrl: string) =>
  call<string>('create_website_from_template', { name, repoUrl })

export const trashWebsite = (websiteId: string) => call<void>('trash_website', { websiteId })

export const showWebsiteFolder = (websiteId: string) => call<void>('show_website_folder', { websiteId })

// The editor keeps the path of the file in the website, as it does for any image of the website
export function thumbnailOf(website: Website) {
  const { imageUrl, websiteId } = website
  if (!imageUrl?.startsWith('/assets/')) return imageUrl ?? ''
  return `/api/website${imageUrl}?websiteId=${encodeURIComponent(websiteId)}`
}

// A website no integration looks after has a file:// link, which says nothing to the user
export function hostOf(website: Website) {
  try {
    const url = new URL(website.repoUrl ?? '')
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.host : ''
  } catch {
    return ''
  }
}
