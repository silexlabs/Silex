<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import AccountDialog from '../components/AccountDialog.vue'
import AccountLine from '../components/AccountLine.vue'
import ExternalLink from '../components/ExternalLink.vue'
import IntegrationCard from '../components/IntegrationCard.vue'
import { confirm, showError } from '../components/AppDialogs.vue'
import { toast } from '../components/AppToasts.vue'
import { type Account, type CatalogEntry, type Openness, disconnectAccount, explain } from '../api'
import {
  accountKey,
  accounts,
  ask,
  catalog,
  check,
  checkAccounts,
  chosen,
  busy,
  install,
  installFailed,
  installing,
  once,
  told,
  loadAccounts,
  loadIntegrations,
  needsYou,
  problems,
  signIns,
  usable,
} from '../integrations'

const { t, locale } = useI18n()
const heading = useTemplateRef<HTMLHeadingElement>('heading')

const failed = ref<ReturnType<typeof explain> | null>(null)
const status = ref('')

const adding = ref<{ entry: CatalogEntry; account?: Account; others?: Account[]; from: Element | null } | null>(null)

async function load() {
  failed.value = null
  status.value = t('Loading the integrations…')
  try {
    await loadIntegrations()
    status.value = ''
    await checkAccounts()
  } catch (error) {
    failed.value = explain(error)
    status.value = ''
  }
}

onMounted(load)

/** One line per account the user chose, and one for a used program Silex cannot run */
interface Line {
  entry: CatalogEntry
  account?: Account
}

const lineNeedsYou = (line: Line) => needsYou(line.entry, line.account)

const lines = computed(() => {
  const list: Line[] = []
  for (const entry of catalog.value ?? []) {
    if (!entry.enabled) continue
    if (!usable(entry)) list.push({ entry })
    else for (const account of chosen(entry)) list.push({ entry, account })
  }
  const name = (line: Line) => line.account?.name ?? line.entry.name
  return list.sort((a, b) => Number(lineNeedsYou(b)) - Number(lineNeedsYou(a)) || name(a).localeCompare(name(b), locale.value))
})

const GROUPS: { title: () => string; openness: Openness[] }[] = [
  { title: () => t('Digital commons and free software'), openness: ['digitalCommons', 'freeSoftware'] },
  { title: () => t('Open source'), openness: ['openSource'] },
  { title: () => t('Open core, source available and proprietary'), openness: ['openCore', 'sourceAvailable', 'proprietary'] },
]

const groups = computed(() =>
  GROUPS.map((group) => ({
    title: group.title(),
    entries: (catalog.value ?? [])
      .filter((entry) => group.openness.includes(entry.openness))
      .sort((a, b) => a.name.localeCompare(b.name, locale.value)),
  })).filter((group) => group.entries.length),
)

// The line or the button that had the focus may be gone once the list changed
async function focusPage() {
  await nextTick()
  if (!document.activeElement || document.activeElement === document.body) heading.value?.focus()
}

function checkAgain(entry: CatalogEntry) {
  return once(entry.program, async () => {
    try {
      await told(entry, await ask(entry, { kind: 'checkAgain' }))
      await focusPage()
    } catch (error) {
      await showError({ title: t('Silex could not look for {program}', { program: entry.program }), ...explain(error) })
    }
  })
}

async function installProgram(entry: CatalogEntry, from: Element) {
  try {
    await install(entry)
  } catch (error) {
    await showError({ title: t('Silex could not read the accounts of {name}', { name: entry.name }), ...explain(error) })
  }
  await nextTick()
  const action = from.isConnected ? from : document.querySelector(`[aria-describedby="card-${entry.program}"]`)
  if (action instanceof HTMLElement) action.focus()
  else await focusPage()
}

function add(entry: CatalogEntry, from: Element) {
  return once(entry.program, async () => {
    try {
      await loadAccounts(entry)
      const others = (accounts.value[entry.program] ?? []).filter((account) => !entry.accounts.includes(account.id))
      adding.value = { entry, others, from }
    } catch (error) {
      await showError({ title: t('Silex could not read the accounts of {name}', { name: entry.name }), ...explain(error) })
    }
  })
}

async function closeDialog() {
  const from = adding.value?.from
  adding.value = null
  await nextTick()
  if (from instanceof HTMLElement && from.isConnected) from.focus()
  else await focusPage()
}

async function use(entry: CatalogEntry, account: Account) {
  try {
    const now = await ask(entry, { kind: 'useAccount', account: account.id })
    toast(t('{name}: used in Silex.', { name: account.name }), 'success')
    if (now) await check(now, account)
  } catch (error) {
    await showError({ title: t('Silex could not use {name}', { name: account.name }), ...explain(error) })
  }
}

async function chose(account: Account) {
  const entry = adding.value?.entry
  await closeDialog()
  if (entry) await use(entry, account)
}

async function signedIn(found: Account[], id: string | null) {
  const entry = adding.value?.entry
  const again = adding.value?.account
  await closeDialog()
  if (!entry || !id) return
  accounts.value[entry.program] = found
  const account = found.find((other) => other.id === id)
  if (!account) return
  if (again) await check(entry, account)
  else await use(entry, account)
}

async function notSignedIn(error: ReturnType<typeof explain>) {
  await closeDialog()
  await showError({ title: t('Silex could not sign you in'), ...error })
}

async function stopUsing(entry: CatalogEntry, account: Account) {
  try {
    await ask(entry, { kind: 'stopUsing', account: account.id })
    delete signIns.value[accountKey(entry.program, account.id)]
    toast(t('{name}: not used in Silex anymore. It stays signed in on this computer.', { name: account.name }), 'success')
    await focusPage()
  } catch (error) {
    await showError({ title: t('Silex could not stop using {name}', { name: account.name }), ...explain(error) })
  }
}

async function signOut(entry: CatalogEntry, account: Account) {
  const confirmed = await confirm({
    title: t('Sign out of {name}?', { name: account.name }),
    message: t('{program} signs out of this account on this computer, in Silex and in your terminal. To only stop using it in Silex, choose Stop using in Silex instead.', {
      program: entry.program,
    }),
    confirmLabel: t('Sign out'),
    danger: true,
  })
  if (!confirmed) return
  try {
    accounts.value[entry.program] = await disconnectAccount(entry.program, account.id)
    await ask(entry, { kind: 'stopUsing', account: account.id })
    delete signIns.value[accountKey(entry.program, account.id)]
    toast(t('{name}: signed out.', { name: account.name }), 'success')
    await focusPage()
  } catch (error) {
    await showError({ title: t('Silex could not sign out of {name}', { name: account.name }), ...explain(error) })
  }
}

const lineKey = (line: Line) => `${line.entry.program} ${line.account?.id ?? ''}`
</script>

<template>
  <h1
    ref="heading"
    tabindex="-1"
  >
    {{ $t('Integrations') }}
  </h1>
  <p class="page__lead">
    {{ $t('Publish your websites and back them up to your own accounts. Integrations are programs installed on this computer.') }}
  </p>

  <p
    class="visually-hidden"
    role="status"
  >
    {{ status }}
  </p>

  <div
    v-if="failed"
    class="integrations__problem"
    role="alert"
  >
    <div class="integrations__message">
      <p class="integrations__sentence">
        {{ $t('Silex could not load the integrations.') }} {{ failed.message }}
      </p>
      <pre
        v-if="failed.detail"
        class="technical-detail"
      >{{ failed.detail }}</pre>
    </div>
    <button
      type="button"
      class="button"
      @click="load"
    >
      {{ $t('Try again') }}
    </button>
  </div>

  <template v-else-if="catalog">
    <section
      v-if="lines.length"
      class="integrations__section"
      aria-labelledby="in-use"
    >
      <div class="integrations__head">
        <h2
          id="in-use"
          class="integrations__title"
        >
          {{ $t('In use on this computer') }}
        </h2>
        <p
          v-if="problems"
          class="integrations__attention"
        >
          <span
            class="integrations__dot"
            aria-hidden="true"
          />{{ $t('1 thing needs you | {count} things need you', problems) }}
        </p>
      </div>
      <ul class="account-lines">
        <AccountLine
          v-for="line in lines"
          :key="lineKey(line)"
          :entry="line.entry"
          :account="line.account"
          :busy="busy.has(line.entry.program)"
          :installing="installing.has(line.entry.program)"
          :failed="installFailed[line.entry.program]"
          @check-again="checkAgain(line.entry)"
          @install="(from) => installProgram(line.entry, from)"
          @sign-in-again="(from) => (adding = { entry: line.entry, account: line.account, from })"
          @check="check(line.entry, line.account!)"
          @stop-using="stopUsing(line.entry, line.account!)"
          @sign-out="signOut(line.entry, line.account!)"
        />
      </ul>
    </section>

    <section
      class="integrations__section"
      aria-labelledby="add"
    >
      <h2
        id="add"
        class="integrations__title"
      >
        {{ $t('Add to Silex') }}
      </h2>
      <div
        v-for="group in groups"
        :key="group.title"
        class="integrations__group"
      >
        <h3 class="integrations__group-title">
          {{ group.title }}
        </h3>
        <ul class="card-grid integration-cards">
          <IntegrationCard
            v-for="entry in group.entries"
            :key="entry.program"
            :entry="entry"
            :busy="busy.has(entry.program)"
            :installing="installing.has(entry.program)"
            :to="`/integrations/${entry.program}`"
            :failed="installFailed[entry.program]"
            @check-again="checkAgain(entry)"
            @install="(from) => installProgram(entry, from)"
            @add="(from) => add(entry, from)"
          />
        </ul>
      </div>
      <p class="integrations__suggest">
        {{ $t('Missing a program you use?') }}
        <ExternalLink
          href="https://roadmap.silex.me/?tags=integrations"
          :name="$t('Suggest an integration')"
          arrow
        />
      </p>
    </section>
  </template>

  <AccountDialog
    v-if="adding"
    :integration="adding.entry"
    :account="adding.account"
    :others="adding.others"
    @chose="chose"
    @done="signedIn"
    @failed="notSignedIn"
  />
</template>

<style scoped>
.integrations__section {
  margin-top: var(--silex-space-6);
}

.integrations__head {
  display: flex;
  align-items: baseline;
  gap: var(--silex-space-4);
}

.integrations__title {
  margin-bottom: var(--silex-space-3);
  font-size: 16px;
}

.integrations__attention {
  display: inline-flex;
  align-items: center;
  gap: var(--silex-space-2);
  margin: 0;
  color: var(--silex-text-secondary);
}

.integrations__problem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--silex-space-4);
}

.integrations__message {
  max-width: 60ch;
}

.integrations__sentence {
  margin: 0;
}

.integrations__group + .integrations__group {
  margin-top: var(--silex-space-4);
}

.integrations__group-title {
  margin-bottom: var(--silex-space-2);
  color: var(--silex-text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.integrations__suggest {
  margin-top: var(--silex-space-4);
  color: var(--silex-text-secondary);
}

.account-lines {
  margin: 0;
  padding: 0;
  border: 1px solid var(--silex-border-color);
  border-radius: var(--silex-radius-md);
  list-style: none;
}

.integrations__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--silex-status-error);
}

.integration-cards {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
