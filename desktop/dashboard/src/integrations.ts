import { computed, ref } from 'vue'
import {
  type Account,
  type CatalogEntry,
  type SignIn,
  askIntegration,
  checkAccount,
  linkWebsite,
  explain,
  integrationAccounts,
  integrationCatalog,
} from './api'
import { i18n } from './i18n'
import { promptChoice, showError } from './components/AppDialogs.vue'
import { dismiss, toast } from './components/AppToasts.vue'

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

export const accountKey = (program: string, id: string) => `${program} ${id}`

export const usable = (entry: CatalogEntry) => entry.found && !entry.broken

export const chosen = (entry: CatalogEntry) =>
  (accounts.value[entry.program] ?? []).filter((account) => entry.accounts.includes(account.id))

/** The program of an integration in use that Silex cannot run, or a chosen account its server turned down */
export const needsYou = (entry: CatalogEntry, account?: Account) =>
  account ? signIns.value[accountKey(entry.program, account.id)] === 'refused' : !usable(entry)

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
  const key = (place: Place) => accountKey(place.entry.program, place.account.id)
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
    await linkWebsite(place.entry.program, place.account.id, name, websiteId)
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
  if (usable(entry)) accounts.value[entry.program] = await integrationAccounts(entry.program)
}

export async function check(entry: CatalogEntry, account: Account) {
  const key = accountKey(entry.program, account.id)
  if (signIns.value[key] === 'checking') return
  signIns.value[key] = 'checking'
  try {
    signIns.value[key] = await checkAccount(entry.program, account.id)
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
      const at = checkedAt.get(accountKey(entry.program, account.id))
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
  catalog.value = await askIntegration(entry.program, asked)
  const now = catalog.value.find((other) => other.program === entry.program)
  if (now) await loadAccounts(now)
  return now
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
