<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type Licenses from '../licenses.json'
// A file next to the app, not a module: parsed only on this page, and out of the bundle
import licensesUrl from '../licenses.json?url'

const { locale } = useI18n()
const licenses = ref<typeof Licenses>({ packages: [], texts: [] })
fetch(licensesUrl).then(async (response) => { licenses.value = await response.json() })

const query = ref('')
const shown = computed(() => {
  const words = query.value.trim().toLocaleLowerCase(locale.value)
  return licenses.value.packages.filter((pkg) => pkg.name.toLocaleLowerCase(locale.value).includes(words))
})
</script>

<template>
  <RouterLink
    to="/settings"
    class="licenses__back"
  >
    <span aria-hidden="true">←</span> {{ $t('Settings') }}
  </RouterLink>
  <h1 tabindex="-1">
    {{ $t('Open source licenses') }}
  </h1>
  <p
    v-if="licenses.packages.length"
    class="page__lead"
  >
    {{ $t('Silex Desktop includes these {count} free software packages, each under its own license.', { count: licenses.packages.length }) }}
  </p>
  <input
    v-model="query"
    type="search"
    class="licenses__search"
    :aria-label="$t('Search packages by name')"
    :placeholder="$t('Search by name')"
  >
  <p
    v-if="query && !shown.length"
    class="page__lead"
  >
    {{ $t('No package has “{query}” in its name.', { query }) }}
  </p>
  <ul class="licenses__list">
    <li
      v-for="pkg in shown"
      :key="`${pkg.name}@${pkg.version}`"
    >
      <details class="licenses__item">
        <summary class="licenses__summary">
          <span class="licenses__name">{{ pkg.name }}</span>
          <span class="licenses__meta">{{ pkg.version }}</span>
          <span class="licenses__meta licenses__license">{{ pkg.license }}</span>
        </summary>
        <a
          v-if="pkg.repository"
          class="licenses__link"
          :href="pkg.repository"
          target="_blank"
          rel="noopener"
        >{{ $t('Source code') }} <span aria-hidden="true">↗</span><span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span></a>
        <pre
          v-for="text in pkg.texts"
          :key="text"
          class="licenses__text"
        >{{ licenses.texts[text] }}</pre>
        <p
          v-if="!pkg.texts.length"
          class="licenses__meta"
        >
          {{ $t('This package comes without a license file.') }}
        </p>
      </details>
    </li>
  </ul>
</template>

<style scoped>
.licenses__back {
  display: inline-block;
  margin-bottom: var(--silex-space-2);
  color: var(--silex-text-secondary);
  text-decoration: none;
}

.licenses__back:hover {
  color: var(--silex-text-primary);
}

.licenses__search {
  width: 100%;
  max-width: 320px;
  margin: var(--silex-space-4) 0;
  padding: var(--silex-space-2) var(--silex-space-3);
  border: 1px solid var(--silex-input-border);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-input-bg);
}

.licenses__list {
  max-width: 820px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.licenses__item {
  border-bottom: 1px solid var(--silex-border-color);
}

.licenses__summary {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--silex-space-3);
  align-items: baseline;
  padding: var(--silex-space-2);
  border-radius: var(--silex-radius-sm);
  cursor: pointer;
}

.licenses__summary::before {
  content: '▸' / '';
  width: 1ch;
  color: var(--silex-text-secondary);
}

.licenses__item[open] > .licenses__summary::before {
  content: '▾' / '';
}

.licenses__summary:hover {
  background: var(--silex-hover-bg);
}

.licenses__name {
  font-weight: 500;
  overflow-wrap: break-word;
  min-width: 0;
}

.licenses__meta {
  color: var(--silex-text-secondary);
  font-size: 13px;
}

.licenses__license {
  margin-left: auto;
  text-align: right;
}

.licenses__link {
  display: inline-block;
  margin: 0 var(--silex-space-2) var(--silex-space-2);
  color: var(--silex-text-primary);
}

.licenses__text {
  margin: 0 var(--silex-space-2) var(--silex-space-3);
  padding: var(--silex-space-3);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-bg-main);
  color: var(--silex-text-secondary);
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.licenses__item > .licenses__meta {
  margin: 0 var(--silex-space-2) var(--silex-space-3);
}
</style>
