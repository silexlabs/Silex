<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import WebsiteCard from '../components/WebsiteCard.vue'
import AppTooltip from '../components/AppTooltip.vue'
import { ariaKeys, keyLabel, useShortcuts } from '../shortcuts'
import { confirm, prompt, showError } from '../components/AppDialogs.vue'
import { toast } from '../components/AppToasts.vue'
import {
  type Website,
  createWebsite,
  duplicateWebsite,
  explain,
  hostOf,
  listWebsites,
  openEditor,
  renameWebsite,
  showWebsiteFolder,
  trashWebsite,
} from '../api'

const { t, locale } = useI18n()

const websites = ref<Website[] | null>(null)
const failed = ref<ReturnType<typeof explain> | null>(null)
const query = ref('')
const order = ref<'edited' | 'name'>('edited')
const status = ref('')
const heading = useTemplateRef<HTMLHeadingElement>('heading')
const cards = useTemplateRef<InstanceType<typeof WebsiteCard>[]>('cards')

const edited = (website: Website) => new Date(website.updatedAt ?? 0).getTime()

// The search field only shows from 8 websites: below that, what it holds would filter out of sight
const searchable = computed(() => (websites.value?.length ?? 0) >= 8)

// « ete » finds « Été »: people type names without their accents
function folded(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase(locale.value)
}

const shown = computed(() => {
  const words = searchable.value ? folded(query.value.trim()) : ''
  return (websites.value ?? [])
    .filter((website) => folded(website.name).includes(words))
    .sort((a, b) =>
      order.value === 'name' ? a.name.localeCompare(b.name, locale.value) : edited(b) - edited(a),
    )
})

async function load() {
  failed.value = null
  if (!websites.value) status.value = t('Loading your websites…')
  try {
    websites.value = await listWebsites()
    status.value = ''
  } catch (error) {
    failed.value = explain(error)
    status.value = ''
  }
}

onMounted(load)

const refreshing = ref(false)

async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  status.value = ''
  // The list of this computer comes back in a few milliseconds, too fast to see that anything happened
  await Promise.all([load(), new Promise((resolve) => setTimeout(resolve, 600))])
  refreshing.value = false
  if (!failed.value) status.value = t('List updated.')
}

async function create() {
  const name = await prompt({
    title: t('New website'),
    label: t('Name'),
    value: t('My website'),
    confirmLabel: t('Create and open'),
  })
  if (!name) return
  try {
    openEditor(await createWebsite(name))
  } catch (error) {
    await showError({ title: t('Silex could not create the website'), ...explain(error) })
  }
}

async function rename(website: Website) {
  const name = await prompt({
    title: t('Rename “{name}”', { name: website.name }),
    label: t('New name'),
    value: website.name,
    confirmLabel: t('Rename'),
  })
  if (!name || name === website.name) return
  try {
    await renameWebsite(website, name)
    website.name = name
    toast(t('Website renamed.'), 'success')
  } catch (error) {
    await showError({ title: t('Silex could not rename the website'), ...explain(error) })
  }
}

const duplicating = new Set<string>()

async function duplicate(website: Website) {
  if (duplicating.has(website.websiteId)) return
  duplicating.add(website.websiteId)
  const name = t('{name} (copy)', { name: website.name })
  try {
    const copy = await duplicateWebsite(website.websiteId, name)
    await load()
    toast(t('“{name}” created. It stays on this computer until you publish it.', { name }), 'success')
    await nextTick()
    cards.value?.find((card) => card.websiteId === copy)?.focus()
  } catch (error) {
    await showError({ title: t('Silex could not duplicate the website'), ...explain(error) })
  } finally {
    duplicating.delete(website.websiteId)
  }
}

async function remove(website: Website) {
  const host = hostOf(website)
  const confirmed = await confirm({
    title: t('Delete “{name}”?', { name: website.name }),
    message: host
      ? t('Silex moves its folder to the trash of this computer. The copy on {host} and the published website stay in place. You can restore it from the trash.', { host })
      : t('Silex moves its folder to the trash of this computer. You can restore it from there.'),
    confirmLabel: t('Delete'),
    danger: true,
  })
  if (!confirmed) return
  try {
    await trashWebsite(website.websiteId)
    websites.value = websites.value?.filter((other) => other.websiteId !== website.websiteId) ?? null
    toast(t('“{name}” is in the trash of this computer.', { name: website.name }), 'success')
    // Its menu button, where the focus would go back, is gone
    await nextTick()
    heading.value?.focus()
  } catch (error) {
    await showError({ title: t('Silex could not delete the website'), ...explain(error) })
  }
}

const search = useTemplateRef<HTMLInputElement>('search')

useShortcuts({
  'Mod+N': create,
  'Mod+F': () => search.value?.focus(),
  F5: refresh,
  'Mod+R': refresh,
})

async function showFolder(website: Website) {
  try {
    await showWebsiteFolder(website.websiteId)
  } catch (error) {
    await showError({ title: t('Silex could not open the folder'), ...explain(error) })
  }
}
</script>

<template>
  <div class="page__head">
    <div>
      <h1
        ref="heading"
        tabindex="-1"
      >
        {{ $t('Your websites') }}
      </h1>
      <p
        v-if="websites?.length !== 0"
        class="page__lead"
      >
        {{ $t('Choose a website to edit.') }}
      </p>
    </div>
    <div class="websites__actions">
      <AppTooltip :text="$t('Refresh ({keys})', { keys: keyLabel('F5') })">
        <button
          type="button"
          class="websites__refresh"
          :aria-label="$t('Refresh')"
          :aria-keyshortcuts="`F5 ${ariaKeys('Mod+R')}`"
          :aria-disabled="refreshing"
          @click="refresh"
        >
          <svg
            class="websites__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          ><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5" /></svg>
        </button>
      </AppTooltip>
      <AppTooltip
        v-if="websites?.length !== 0"
        :text="keyLabel('Mod+N')"
      >
        <button
          type="button"
          class="button button--primary"
          :aria-keyshortcuts="ariaKeys('Mod+N')"
          @click="create"
        >
          <svg
            class="websites__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          ><path d="M12 5v14M5 12h14" /></svg>
          {{ $t('New website…') }}
        </button>
      </AppTooltip>
    </div>
  </div>

  <p
    class="visually-hidden"
    role="status"
  >
    {{ status }}
  </p>

  <div
    v-if="failed"
    class="websites__problem"
    role="alert"
  >
    <div class="websites__message">
      <p class="websites__sentence">
        {{ $t('Silex could not load your websites.') }} {{ failed.message }}
      </p>
      <pre
        v-if="failed.detail"
        class="websites__detail"
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

  <div
    v-else-if="!websites"
    class="card-grid"
  >
    <div
      v-for="index in 3"
      :key="index"
      class="websites__skeleton"
      aria-hidden="true"
    >
      <div class="websites__bar" />
      <div class="websites__bar websites__bar--short" />
    </div>
  </div>

  <div
    v-else-if="!websites.length"
    class="websites__empty"
  >
    <h2 class="websites__title">
      {{ $t('Create your first website') }}
    </h2>
    <div class="websites__row">
      <button
        type="button"
        class="button button--primary"
        @click="create"
      >
        {{ $t('Blank website…') }}
      </button>
      <RouterLink
        to="/templates"
        class="button"
      >
        {{ $t('See the templates') }}
      </RouterLink>
    </div>
  </div>

  <template v-else>
    <div
      v-if="searchable"
      class="websites__tools"
    >
      <input
        ref="search"
        v-model="query"
        :aria-keyshortcuts="ariaKeys('Mod+F')"
        type="search"
        class="websites__search"
        :aria-label="$t('Search websites by name')"
        :placeholder="$t('Search by name')"
      >
      <label class="websites__sort">
        {{ $t('Sort by') }}
        <select
          v-model="order"
          class="select"
        >
          <option value="edited">
            {{ $t('Last edited') }}
          </option>
          <option value="name">
            {{ $t('Name') }}
          </option>
        </select>
      </label>
    </div>
    <p
      v-if="!shown.length"
      class="page__lead"
    >
      {{ $t('No website has “{query}” in its name.', { query: query.trim() }) }}
    </p>
    <p
      class="visually-hidden"
      role="status"
    >
      <template v-if="query.trim()">
        {{ shown.length ? $t('1 website | {count} websites', shown.length) : $t('No website has “{query}” in its name.', { query: query.trim() }) }}
      </template>
    </p>
    <div class="card-grid">
      <WebsiteCard
        v-for="website in shown"
        ref="cards"
        :key="website.websiteId"
        :website="website"
        @open="openEditor(website.websiteId)"
        @show-folder="showFolder(website)"
        @rename="rename(website)"
        @duplicate="duplicate(website)"
        @delete="remove(website)"
      />
    </div>
  </template>
</template>

<style scoped>
.websites__icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
}

.websites__actions {
  display: flex;
  align-items: center;
  gap: var(--silex-space-2);
}

.websites__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--silex-radius-sm);
  background: none;
  color: var(--silex-text-secondary);
  cursor: pointer;
}

.websites__refresh:hover {
  background: var(--silex-hover-bg);
  color: var(--silex-text-primary);
}

/* Not `disabled`, which would take the focus away from the keyboard */
.websites__refresh[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
}

.websites__refresh[aria-disabled='true'] .websites__icon {
  animation: websites-turn 0.6s linear infinite;
}

@keyframes websites-turn {
  to {
    transform: rotate(360deg);
  }
}

.websites__skeleton {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--silex-space-2);
  aspect-ratio: 216 / 190;
  padding: var(--silex-space-4);
  border: 1px solid var(--silex-border-color);
  border-radius: var(--silex-radius-md);
  background: var(--silex-bg-main);
}

.websites__bar {
  width: 60%;
  height: 10px;
  border-radius: var(--silex-radius-sm);
  background: var(--silex-hover-bg);
}

.websites__bar--short {
  width: 35%;
}

.websites__problem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--silex-space-4);
}

.websites__message {
  max-width: 60ch;
}

.websites__sentence {
  margin: 0;
}

.websites__detail {
  margin: var(--silex-space-2) 0 0;
  padding: var(--silex-space-2) var(--silex-space-3);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-bg-darker);
  color: var(--silex-text-secondary);
  font: 12px / 1.5 ui-monospace, 'Ubuntu Mono', Menlo, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.websites__empty {
  display: grid;
  gap: var(--silex-space-4);
}

.websites__title {
  font-size: 20px;
  line-height: 1.4;
}

.websites__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--silex-space-2);
}

.websites__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--silex-space-4);
  margin-bottom: var(--silex-space-4);
}

.websites__sort {
  display: flex;
  align-items: center;
  gap: var(--silex-space-2);
  color: var(--silex-text-secondary);
}

.websites__sort .select {
  color: var(--silex-text-primary);
}

.websites__search {
  padding: var(--silex-space-2) var(--silex-space-3);
  border: 1px solid var(--silex-input-border);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-input-bg);
  flex: 1;
  max-width: 320px;
}
</style>
