<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import WebsiteCard from '../components/WebsiteCard.vue'
import { confirm, prompt, showError } from '../components/AppDialogs.vue'
import { toast } from '../components/AppToasts.vue'
import {
  type Website,
  createWebsite,
  duplicateWebsite,
  hostOf,
  listWebsites,
  renameWebsite,
  showWebsiteFolder,
  trashWebsite,
} from '../api'

const { t, locale } = useI18n()

const websites = ref<Website[] | null>(null)
const failed = ref('')
const query = ref('')
const order = ref<'edited' | 'name'>('edited')

const edited = (website: Website) => new Date(website.updatedAt ?? 0).getTime()

// The search field only shows from 8 websites: below that, what it holds would filter out of sight
const searchable = computed(() => (websites.value?.length ?? 0) >= 8)

const shown = computed(() => {
  const words = searchable.value ? query.value.trim().toLocaleLowerCase(locale.value) : ''
  return (websites.value ?? [])
    .filter((website) => website.name.toLocaleLowerCase(locale.value).includes(words))
    .sort((a, b) =>
      order.value === 'name' ? a.name.localeCompare(b.name, locale.value) : edited(b) - edited(a),
    )
})

async function load() {
  failed.value = ''
  try {
    websites.value = await listWebsites()
  } catch (error) {
    failed.value = (error as Error).message
  }
}

onMounted(load)

function edit(website: { websiteId: string }) {
  window.location.href = `/?id=${encodeURIComponent(website.websiteId)}&lang=${locale.value}`
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
    edit({ websiteId: await createWebsite(name) })
  } catch (error) {
    await showError({ title: t('Silex could not create the website'), message: (error as Error).message })
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
    await showError({ title: t('Silex could not rename the website'), message: (error as Error).message })
  }
}

const duplicating = new Set<string>()

async function duplicate(website: Website) {
  if (duplicating.has(website.websiteId)) return
  duplicating.add(website.websiteId)
  const name = t('{name} (copy)', { name: website.name })
  const before = new Set(websites.value?.map((other) => other.websiteId))
  try {
    await duplicateWebsite(website.websiteId, name)
    await load()
    toast(t('“{name}” created. It stays on this computer until you publish it.', { name }), 'success')
    const copy = websites.value?.find((other) => !before.has(other.websiteId))
    await nextTick()
    if (copy) document.querySelector<HTMLElement>(`[data-website-id="${CSS.escape(copy.websiteId)}"] button`)?.focus()
  } catch (error) {
    await showError({ title: t('Silex could not duplicate the website'), message: (error as Error).message })
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
    document.querySelector<HTMLElement>('main h1')?.focus()
  } catch (error) {
    await showError({ title: t('Silex could not delete the website'), message: (error as Error).message })
  }
}

async function showFolder(website: Website) {
  try {
    await showWebsiteFolder(website.websiteId)
  } catch (error) {
    await showError({ title: t('Silex could not open the folder'), message: (error as Error).message })
  }
}
</script>

<template>
  <div class="page__head">
    <div>
      <h1 tabindex="-1">
        {{ $t('Your websites') }}
      </h1>
      <p
        v-if="websites?.length !== 0"
        class="page__lead"
      >
        {{ $t('Choose a website to edit.') }}
      </p>
    </div>
    <button
      v-if="websites?.length !== 0"
      type="button"
      class="button button--primary"
      @click="create"
    >
      <svg
        class="websites__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      ><path d="M12 5v14M5 12h14" /></svg>
      {{ $t('New website…') }}
    </button>
  </div>

  <div
    v-if="failed"
    class="websites__problem"
    role="alert"
  >
    <p class="websites__message">
      {{ $t('Silex could not load your websites.') }} {{ failed }}
    </p>
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
    <p class="visually-hidden">
      {{ $t('Loading your websites…') }}
    </p>
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
        v-model="query"
        type="search"
        class="websites__search"
        :aria-label="$t('Search websites by name')"
        :placeholder="$t('Search by name')"
      >
      <label class="websites__order">
        {{ $t('Sort by') }}
        <select
          v-model="order"
          class="select"
        >
          <option value="edited">{{ $t('Last edited') }}</option>
          <option value="name">{{ $t('Name') }}</option>
        </select>
      </label>
    </div>
    <p
      v-if="!shown.length"
      class="page__lead"
    >
      {{ $t('No website has “{query}” in its name.', { query: query.trim() }) }}
    </p>
    <div class="card-grid">
      <WebsiteCard
        v-for="website in shown"
        :key="website.websiteId"
        :data-website-id="website.websiteId"
        :website="website"
        @open="edit(website)"
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
  margin: 0;
  max-width: 60ch;
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

.websites__search {
  padding: var(--silex-space-2) var(--silex-space-3);
  border: 1px solid var(--silex-input-border);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-input-bg);
  flex: 1;
  max-width: 320px;
}

.websites__order {
  display: flex;
  align-items: center;
  gap: var(--silex-space-2);
}
</style>
