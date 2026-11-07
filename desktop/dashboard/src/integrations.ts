import { computed, ref } from 'vue'
import {
  type Account,
  type CatalogEntry,
  type SignIn,
  askIntegration,
  checkAccount,
  explain,
  integrationAccounts,
  integrationCatalog,
} from './api'

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
