import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  API_PATH,
  API_WEBSITE_CREATE,
  API_WEBSITE_DUPLICATE,
  API_WEBSITE_LIST,
  API_WEBSITE_META_WRITE,
  API_WEBSITE_PATH,
} from '~/common/constants'
import type {
  ApiWebsiteCreateResponse,
  ApiWebsiteDuplicateResponse,
  LastPublication,
  WebsiteId,
  WebsiteMeta,
} from '~/common/types'
import { storedToDisplayed } from '~/editor/assetUrl'
import { i18n } from './i18n'

export type Website = Pick<WebsiteMeta, 'websiteId' | 'name' | 'imageUrl' | 'updatedAt'>

/** A sentence of the locales, and what the system said, which is not translated */
export class Said extends Error {
  constructor(
    readonly sentence?: string,
    readonly params: Record<string, string | number> = {},
    readonly detail = '',
  ) {
    super(detail || sentence)
  }
}

async function request<T>(
  method: string,
  route: string,
  query: Record<string, string> = {},
  body?: unknown,
): Promise<T> {
  const search = Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''
  let response: Response
  try {
    response = await fetch(`${API_PATH}${API_WEBSITE_PATH}${route}${search}`, {
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

/** A sentence as Rust sends it, without what the system said */
export type Words = Pick<Said, 'sentence'> & Partial<Pick<Said, 'params'>>

export function translate({ sentence = '', params = {} }: Words) {
  const { n, t } = i18n.global
  const named = Object.fromEntries(
    Object.entries(params).map(([name, value]) => [name, typeof value === 'number' ? n(value) : value]),
  )
  return typeof params.count === 'number' ? t(sentence, named, params.count) : t(sentence, named)
}

/** What an error dialog says of a failure, under the title */
export function explain(error: unknown): { message?: string; detail?: string } {
  const said = error instanceof Said ? error : new Said(undefined, {}, String((error as Error)?.message ?? error))
  const detail = said.detail || undefined
  if (said.sentence) return { message: translate(said), detail }
  // What the system said alone gives the person nothing to do
  return { message: detail && i18n.global.t('Try again. If the problem continues, report it and include the technical details below.'), detail }
}

export const listWebsites = () => request<Website[]>('GET', API_WEBSITE_LIST)

export const createWebsite = (name: string) =>
  request<ApiWebsiteCreateResponse>('PUT', API_WEBSITE_CREATE, {}, { name }).then(({ websiteId }) => websiteId)

export const renameWebsite = (website: Website, name: string) =>
  request('POST', API_WEBSITE_META_WRITE, { websiteId: website.websiteId }, { name, imageUrl: website.imageUrl })

export const duplicateWebsite = (websiteId: WebsiteId, name: string) =>
  request<ApiWebsiteDuplicateResponse>('POST', API_WEBSITE_DUPLICATE, { websiteId, name })
    .then((copy) => copy.websiteId)

export const createWebsiteFromTemplate = (name: string, repoUrl: string) =>
  call<string>('create_website_from_template', { name, repoUrl })

export const trashWebsite = (websiteId: string) => call<void>('trash_website', { websiteId })

export const showWebsiteFolder = (websiteId: string) => call<void>('show_website_folder', { websiteId })

/** Where a website stands with one of the integrations that send it, in its words */
export interface SyncPlace {
  /** Where the website goes, as the user knows it */
  place: string
  /** The logo of the place, an SVG from the integration */
  icon: string | null
  label: Words
  action: Words | null
  /** Where the changes made elsewhere can be seen, when they keep it from syncing */
  changesUrl: string | null
  /** What the last failed sending through this integration said, until one works */
  failure: (Words & Pick<Said, 'detail'>) | null
}

export const syncPlaces = (websiteId: string) => call<SyncPlace[]>('sync_places', { websiteId })

/** Null for a website made before Silex kept it */
export type Publication = ({ neverPublished: boolean } & Pick<LastPublication, 'url'>) | null

export const readLastPublication = (websiteId: string) => call<Publication>('last_publication', { websiteId })

export const syncWebsite = (websiteId: string) => call<void>('sync_website', { websiteId })

/** Each time where a website stands may have changed, without saying which */
export const onSyncStatus = (then: () => void) => listen('sync-status', () => then())

export const openLink = (url: string) => call<void>('open_link', { url })

// The editor keeps the path of the file in the website, as it does for any image of the website
export function thumbnailOf({ imageUrl, websiteId }: Website) {
  return imageUrl ? storedToDisplayed(imageUrl, websiteId, '') : ''
}

export function openEditor(websiteId: WebsiteId) {
  const query = new URLSearchParams({ id: websiteId, lang: i18n.global.locale.value })
  window.location.href = `/?${query}`
}
