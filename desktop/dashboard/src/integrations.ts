import { computed, ref } from 'vue'
import {
  type Account,
  type AntiFeature,
  type CatalogEntry,
  type Openness,
  type SignIn,
  type Tag,
  askIntegration,
  installIntegration,
  checkAccount,
  linkWebsite,
  explain,
  integrationAccounts,
  integrationCatalog,
} from './api'
import { i18n } from './i18n'
import { promptChoice, showError } from './components/AppDialogs.vue'
import { dismiss, toast } from './components/AppToasts.vue'

/** Of the service, shown on its card and its page */
export const OPENNESS: Record<Openness, () => string> = {
  digitalCommons: () => i18n.global.t('Digital commons'),
  freeSoftware: () => i18n.global.t('Free software'),
  openSource: () => i18n.global.t('Open source'),
  openCore: () => i18n.global.t('Open core'),
  sourceAvailable: () => i18n.global.t('Source available'),
  proprietary: () => i18n.global.t('Proprietary'),
}

export const TAGS: Record<Tag, () => string> = {
  hosting: () => i18n.global.t('Hosting'),
  storage: () => i18n.global.t('Storage'),
  team: () => i18n.global.t('Team'),
}

export const ANTI_FEATURES: Record<AntiFeature, () => string> = {
  tracking: () => i18n.global.t('Tracks you'),
  proprietaryCloud: () => i18n.global.t('Runs on a proprietary cloud'),
  identityVerification: () => i18n.global.t('May ask to verify your identity'),
  freeLicenseRequired: () => i18n.global.t('Your content must have a free license'),
}

/** What the integrations screen and the sidebar share, for as long as the app runs */
export const catalog = ref<CatalogEntry[] | null>(null)

/** Every account of each program, chosen or not */
export const accounts = ref<Record<string, Account[]>>({})

export type Check = SignIn | 'checking' | { unreachable: ReturnType<typeof explain> }

/** What the server of each chosen account said, by `accountKey` */
export const signIns = ref<Record<string, Check>>({})

const checkedAt = new Map<string, number>()

/** A check older than this is made again when the screen opens */
const STALE = 5 * 60 * 1000

export const accountKey = (integration: string, id: string) => `${integration} ${id}`

export const usable = (entry: CatalogEntry) => entry.found && !entry.broken

export const chosen = (entry: CatalogEntry) =>
  (accounts.value[entry.id] ?? []).filter((account) => entry.accounts.includes(account.id))

/** The program of an integration in use that Silex cannot run, or a chosen account its server turned down */
export const needsYou = (entry: CatalogEntry, account?: Account) =>
  account ? signIns.value[accountKey(entry.id, account.id)] === 'refused' : !usable(entry)

export const problems = computed(() =>
  (catalog.value ?? []).reduce((count, entry) => {
    if (!entry.enabled) return count
    if (!usable(entry)) return count + 1
    return count + chosen(entry).filter((account) => needsYou(entry, account)).length
  }, 0),
)

/** An account a website can sync with: one the user chose, of an integration that syncs */
export interface Place {
  entry: CatalogEntry
  account: Account
}

export const places = computed(() =>
  (catalog.value ?? [])
    .filter((entry) => entry.capacities.includes('sync'))
    .flatMap((entry) => chosen(entry).map((account) => ({ entry, account }))),
)

export const placeLabel = (place: Place) => place.account.summary ?? place.account.name

/** A label asks the name of a new website, which may stay on this computer; without one the website exists and has a name */
export async function askPlace(options: { title: string; label?: string; value: string; confirmLabel: string }) {
  const { t } = i18n.global
  const key = (place: Place) => accountKey(place.entry.id, place.account.id)
  const accountsToChoose = places.value.map((place) => ({
    value: key(place),
    label: placeLabel(place),
    tag: place.entry.name,
    detail: t('New private project. Updated each time you save.'),
  }))
  const answer = await promptChoice({
    ...options,
    choices: accountsToChoose.length
      ? {
          legend: t('Where to save it'),
          options: options.label
            ? [{ value: '', label: t('Only on this computer'), detail: t('You can sync it later.') }, ...accountsToChoose]
            : accountsToChoose,
          initial: options.label ? '' : accountsToChoose[0].value,
          note: (name) =>
            options.label
              ? t('If you choose an account, Silex creates a new private project there, named silex_{name}. Each time you save, Silex updates it. Nothing is public until you publish.', { name })
              : t('Silex creates a new private project, named silex_{name}, on the account you choose. Then it sends your website there, and again each time you save. Nothing is public until you publish.', { name }),
        }
      : undefined,
  })
  return answer && { name: answer.name, place: places.value.find((place) => key(place) === answer.choice) ?? null }
}

/** Answers what the user should read when it failed */
export async function sendToPlace(place: Place, name: string, websiteId: string) {
  const sending = toast(i18n.global.t('Creating the project on {server}…', { server: placeLabel(place) }))
  try {
    await linkWebsite(place.entry.id, place.account.id, name, websiteId)
    return null
  } catch (error) {
    return explain(error)
  } finally {
    dismiss(sending)
  }
}

/** Sends a website just made where the user chose, and says whether it can be opened */
export async function sendNewWebsite({ name, place }: { name: string; place: Place | null }, websiteId: string) {
  if (!place) return true
  const failure = await sendToPlace(place, name, websiteId)
  if (failure) {
    await showError({
      title: i18n.global.t('“{name}” is on this computer, but Silex could not send it to {server}', { name, server: placeLabel(place) }),
      ...failure,
    })
  }
  return !failure
}

export async function loadAccounts(entry: CatalogEntry) {
  if (usable(entry)) accounts.value[entry.id] = await integrationAccounts(entry.id)
}

export async function check(entry: CatalogEntry, account: Account) {
  const key = accountKey(entry.id, account.id)
  if (signIns.value[key] === 'checking') return
  signIns.value[key] = 'checking'
  try {
    signIns.value[key] = await checkAccount(entry.id, account.id)
  } catch (error) {
    signIns.value[key] = { unreachable: explain(error) }
  }
  checkedAt.set(key, Date.now())
}

/** Asks the server of every chosen account, those checked a while ago only unless `all` */
export async function checkAccounts(all = false) {
  const asked: Promise<void>[] = []
  for (const entry of catalog.value ?? []) {
    for (const account of chosen(entry)) {
      const at = checkedAt.get(accountKey(entry.id, account.id))
      if (all || at === undefined || Date.now() - at > STALE) asked.push(check(entry, account))
    }
  }
  await Promise.all(asked)
}

export async function loadIntegrations() {
  catalog.value = await integrationCatalog()
  await Promise.all(catalog.value.map(loadAccounts))
}

export async function ask(entry: CatalogEntry, asked: Parameters<typeof askIntegration>[1]) {
  catalog.value = await askIntegration(entry.id, asked)
  const now = catalog.value.find((other) => other.id === entry.id)
  if (now) await loadAccounts(now)
  return now
}

/** What runs, one key per line or card, so that a second click waits for the first */
export const busy = ref(new Set<string>())

export async function once(key: string, action: () => Promise<void>) {
  if (busy.value.has(key)) return
  busy.value.add(key)
  try {
    await action()
  } finally {
    busy.value.delete(key)
  }
}

/** The programs being installed */
export const installing = ref(new Set<string>())

/** Why the last install of each program failed, until one works */
export const installFailed = ref<Record<string, ReturnType<typeof explain>>>({})

/** What the user is told once Silex looked for the program again */
export async function told(entry: CatalogEntry, now?: CatalogEntry) {
  const { t } = i18n.global
  if (now && usable(now)) {
    toast(t('{program} found.', { program: entry.program }), 'success')
    await checkAccounts()
  } else toast(now?.broken ? t('{program} is on this computer but does not start.', { program: entry.program }) : t('{program} is still not found.', { program: entry.program }))
}

/** Silex downloads the program, then looks for it again */
export function install(entry: CatalogEntry) {
  return once(entry.id, async () => {
    installing.value.add(entry.id)
    delete installFailed.value[entry.id]
    try {
      catalog.value = await installIntegration(entry.id)
    } catch (error) {
      installFailed.value[entry.id] = explain(error)
      return
    } finally {
      installing.value.delete(entry.id)
    }
    const now = catalog.value.find((other) => other.id === entry.id)
    if (now) await loadAccounts(now)
    await told(entry, now)
  })
}

/** At the start of the app, so that the sidebar tells of an account turned down before anyone opens the screen */
export async function startIntegrations() {
  try {
    await loadIntegrations()
    await checkAccounts(true)
  } catch {
    // The screen says it when it opens
  }
}
