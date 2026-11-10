import { Channel, invoke } from '@tauri-apps/api/core'
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
  OptionsForm,
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
  repoUrl: string | null
  label: Words
  action: Words | null
  /** Where the changes made elsewhere can be seen, when they keep it from syncing */
  changesUrl: string | null
  /** What the last failed sending through this integration said, until one works */
  failure: (Words & Pick<Said, 'detail'>) | null
}

export const syncPlaces = (websiteId: string) => call<SyncPlace[]>('sync_places', { websiteId })

export type Tag = 'hosting' | 'storage' | 'team'

/** Of the service an integration relies on, not of the program */
export type Openness = 'digitalCommons' | 'freeSoftware' | 'openSource' | 'openCore' | 'sourceAvailable' | 'proprietary'

/** What a user may not want of the service, after the Anti-Features of F-Droid */
export type AntiFeature = 'tracking' | 'proprietaryCloud' | 'identityVerification' | 'freeLicenseRequired'

/** An integration of the catalog, with what is known of it on this computer */
export interface CatalogEntry {
  id: string
  program: string
  /** The service the user knows, not the program */
  name: string
  /** In English, a key of the locales */
  summary: string
  /** What the user gets, in one line, a key of the locales too */
  tagline: string
  tags: Tag[]
  openness: Openness
  antiFeatures: AntiFeature[]
  /** For when Silex cannot find the program */
  installUrl: string
  /** Whether Silex can install the program itself on this system */
  installable: boolean
  /** The logo of the service, an SVG from the integration */
  icon: string | null
  /** False when the program cannot be installed on this system */
  runsHere: boolean
  /** Offered when adding an account, before any other the user types in */
  servers: string[]
  /** Filled in to add an account, in place of signing in in the browser */
  accountForm: OptionsForm | null
  capacities: ('sync' | 'deploy')[]
  /** Whether the user uses it in Silex */
  enabled: boolean
  /** The ids of the accounts the user chose, among those of the program */
  accounts: string[]
  found: boolean
  broken: boolean
  /** The version Silex needs, when the one found is older */
  needs: string | null
  version: string | null
}

export const integrationCatalog = () => call<CatalogEntry[]>('integration_catalog', {})

export type Asked = { kind: 'checkAgain' } | { kind: 'useAccount' | 'stopUsing'; account: string }

export const askIntegration = (integration: string, asked: Asked) =>
  call<CatalogEntry[]>('integration_asked', { integration, asked })

/** Silex downloads the program into its own folder */
export const installIntegration = (integration: string) => call<CatalogEntry[]>('integration_install', { integration })

/** An account or a server an integration was set up with, kept by its program */
export interface Account {
  id: string
  name: string
  /** What tells it apart, like the server it is on */
  summary: string | null
}

export const integrationAccounts = (integration: string) => call<Account[]>('integration_accounts', { integration })

/**
 * Waits for the user to sign in in their browser, and answers the accounts as they are then, also once stopped.
 * `clientId` is the OAuth application the user made on a server Silex does not know.
 * `onPage` is given the page to sign in on when the browser did not open.
 */
export const connectAccount = (integration: string, server: string, clientId: string | null, onPage: (page: string) => void) => {
  const page = new Channel<string>()
  page.onmessage = onPage
  /** `account` is the one signed in to, null once stopped */
  return call<{ accounts: Account[]; account: string | null }>('connect_account', { integration, server, clientId, onPage: page })
}

/**
 * Tested on its server first and kept only when it works, then answered like `connectAccount`.
 * Every value is a string, as a form sends it: a ticked checkbox is sent with any value, one left empty is not sent.
 */
export const addAccount = (integration: string, values: Record<string, string>) =>
  call<{ accounts: Account[]; account: string }>('add_account', { integration, values })

export const stopConnectingAccount = () => call<void>('stop_connecting_account', {})

/** Signs the account out of its program too */
export const disconnectAccount = (integration: string, id: string) => call<Account[]>('disconnect_account', { integration, id })

/** A website on an account, that this computer can copy */
export interface RemoteWebsite {
  id: string
  name: string
  /** Where it is on its host, as the user knows it */
  place: string
  /** As the host writes it, an ISO date */
  changedAt: string | null
  private: boolean
}

/** Over the network, those changed last first */
export const remoteWebsites = (integration: string, account: string) => call<RemoteWebsite[]>('remote_websites', { integration, account })

/** Copies the website to this computer, and answers its id here */
export const openRemoteWebsite = (integration: string, account: string, website: RemoteWebsite) =>
  call<string>('open_remote_website', { integration, account, id: website.id })

/** Over the network: a new private project for the website of this computer, and the website sent there */
export const linkWebsite = (integration: string, account: string, name: string, websiteId: string) =>
  call<void>('link_website', { integration, account, name, websiteId })

/** Whether the website is sent somewhere, by an integration or not */
export const websiteHasRemote = (websiteId: string) => call<boolean>('website_has_remote', { websiteId })

/** What the server of an account said of its sign-in */
export type SignIn = 'accepted' | 'refused'

/** Over the network, and fails when the server could not be asked */
export const checkAccount = (integration: string, id: string) => call<SignIn>('check_account', { integration, id })

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
