<script setup lang="ts">
import { computed, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Account, type CatalogEntry, type RemoteWebsite, explain, remoteWebsites, openRemoteWebsite } from '../api'

const props = defineProps<{
  integration: CatalogEntry
  /** The accounts the user chose, at least one */
  accounts: Account[]
}>()

const emit = defineEmits<{
  opened: [websiteId: string]
  closed: []
  failed: [title: string, error: ReturnType<typeof explain>]
}>()

const { t, locale } = useI18n()
const element = useTemplateRef<HTMLDialogElement>('element')
const titleId = useId()

const account = ref(props.accounts[0].id)
const websites = ref<RemoteWebsite[] | null>(null)
const query = ref('')
const opening = ref<RemoteWebsite | null>(null)

const accountOf = (id: string) => props.accounts.find((other) => other.id === id)

// « ete » finds « Été »: people type names without their accents
const folded = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase(locale.value)

const shown = computed(() => (websites.value ?? []).filter((website) => folded(website.name).includes(folded(query.value.trim()))))

const changed = (website: RemoteWebsite) =>
  website.changedAt ? t('Updated {date}', { date: new Date(website.changedAt).toLocaleDateString(locale.value, { dateStyle: 'medium' }) }) : ''

async function load() {
  websites.value = null
  const from = account.value
  try {
    const found = await remoteWebsites(props.integration.program, from)
    // Another account chosen while this one answered
    if (account.value === from) websites.value = found
  } catch (error) {
    emit('failed', t('Silex could not list the websites of {name}', { name: accountOf(from)?.summary ?? from }), explain(error))
  }
}

watch(account, load)

onMounted(() => {
  element.value?.showModal()
  load()
})

async function open(website: RemoteWebsite) {
  opening.value = website
  try {
    emit('opened', await openRemoteWebsite(props.integration.program, account.value, website))
  } catch (error) {
    opening.value = null
    emit('failed', t('Silex could not open {name}', { name: website.name }), explain(error))
  }
}

function close() {
  if (!opening.value) emit('closed')
}
</script>

<template>
  <dialog
    ref="element"
    class="dialog remote-websites"
    :aria-labelledby="titleId"
    @cancel.prevent="close"
  >
    <h2
      :id="titleId"
      class="dialog__title"
    >
      {{ t('Open a website from {name}', { name: integration.name }) }}
    </h2>

    <p
      v-if="opening"
      class="dialog__message"
      role="status"
    >
      {{ t('Downloading {name}…', { name: opening.name }) }}
    </p>

    <template v-else>
      <label
        v-if="accounts.length > 1"
        class="field remote-websites__account"
      >
        {{ t('Account') }}
        <select
          v-model="account"
          class="select"
        >
          <option
            v-for="other in accounts"
            :key="other.id"
            :value="other.id"
          >
            {{ [other.name, other.summary].filter(Boolean).join(' · ') }}
          </option>
        </select>
      </label>

      <input
        v-model="query"
        type="search"
        class="field__input remote-websites__search"
        :aria-label="t('Search your websites')"
        :placeholder="t('Search your websites')"
      >

      <p
        v-if="!websites"
        class="dialog__message"
        role="status"
      >
        {{ t('Loading your websites…') }}
      </p>
      <p
        v-else-if="!websites.length"
        class="dialog__message"
      >
        {{ t('No Silex website on this account.') }}
      </p>
      <p
        v-else-if="!shown.length"
        class="dialog__message"
        role="status"
      >
        {{ t('No website has “{query}” in its name.', { query: query.trim() }) }}
      </p>
      <ul
        v-else
        class="remote-websites__list"
      >
        <li
          v-for="website in shown"
          :key="website.id"
        >
          <button
            type="button"
            class="remote-websites__website"
            @click="open(website)"
          >
            <span class="remote-websites__name">{{ website.name }}</span>
            <span class="remote-websites__detail">{{ [website.place, changed(website), website.private ? t('Private') : ''].filter(Boolean).join(' · ') }}</span>
          </button>
        </li>
      </ul>
    </template>

    <div class="dialog__actions">
      <button
        type="button"
        class="button"
        :aria-disabled="!!opening"
        @click="close"
      >
        {{ t('Cancel') }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.remote-websites__account,
.remote-websites__search {
  margin-bottom: var(--silex-space-3);
}

.remote-websites__search {
  width: 100%;
}

.remote-websites__list {
  display: grid;
  gap: var(--silex-space-2);
  max-height: 320px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.remote-websites__website {
  display: grid;
  width: 100%;
  gap: 2px;
  padding: var(--silex-space-3);
  border: 1px solid var(--silex-border-color);
  border-radius: var(--silex-radius-sm);
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.remote-websites__website:hover {
  background: var(--silex-hover-bg);
}

.remote-websites__detail {
  color: var(--silex-text-secondary);
  font-size: 12px;
}

[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
}
</style>
