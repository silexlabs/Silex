<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import AppTooltip from './AppTooltip.vue'
import ExternalLink from './ExternalLink.vue'
import type { CatalogEntry } from '../api'
import { ANTI_FEATURES, OPENNESS, chosen, usable } from '../integrations'

defineProps<{
  entry: CatalogEntry
  busy: boolean
  installing: boolean
  /** Why the last install failed, until one works */
  failed?: string
  /** The page of the integration */
  to: RouteLocationRaw
}>()

const emit = defineEmits<{
  checkAgain: []
  install: []
  add: [from: Element]
}>()

const ICONS: Record<CatalogEntry['antiFeatures'][number], string> = {
  tracking: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  proprietaryCloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
  identityVerification: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>',
  freeLicenseRequired: '<path d="M14 2H6v20h12V6z"/><path d="M14 2v4h4"/>',
}
</script>

<template>
  <li class="integration-card">
    <div class="integration-card__head">
      <span
        class="tile tile--large logo"
        aria-hidden="true"
        v-html="entry.icon"
      />
      <h4
        :id="`card-${entry.program}`"
        class="integration-card__name"
      >
        <AppTooltip :text="$t('Details about {name}', { name: entry.name })">
          <RouterLink
            :to="to"
            :aria-label="$t('Details about {name}', { name: entry.name })"
          >
            {{ entry.name }}
            <svg
              class="integration-card__info"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            ><circle
              cx="12"
              cy="12"
              r="10"
            /><path d="M12 16v-4M12 8h.01" /></svg>
          </RouterLink>
        </AppTooltip>
      </h4>
    </div>
    <p
      v-if="failed !== undefined"
      class="integration-card__line integration-card__line--failed"
      role="alert"
    >
      {{ $t('Silex could not install {name}.', { name: entry.name }) }} {{ failed }}
      <ExternalLink
        :href="entry.installUrl"
        :name="$t('How to install {program}', { program: entry.program })"
        arrow
      />
    </p>
    <p
      v-else
      class="integration-card__line"
    >
      {{ $t(entry.tagline) }}
    </p>
    <div class="integration-card__row">
      <span class="integration-card__service">{{ OPENNESS[entry.openness]() }}</span>
      <ul
        v-if="entry.antiFeatures.length"
        class="integration-card__anti"
        :aria-label="$t('What you may not want')"
      >
        <li
          v-for="anti in entry.antiFeatures"
          :key="anti"
        >
          <AppTooltip :text="ANTI_FEATURES[anti]()">
            <span
              class="integration-card__icon"
              tabindex="0"
              role="img"
              :aria-label="ANTI_FEATURES[anti]()"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                v-html="ICONS[anti]"
              />
            </span>
          </AppTooltip>
        </li>
      </ul>
      <span
        v-if="!entry.runsHere"
        class="integration-card__action"
      >{{ $t('Not available on this system') }}</span>
      <button
        v-else-if="usable(entry)"
        type="button"
        class="button integration-card__action"
        :aria-describedby="`card-${entry.program}`"
        :aria-disabled="busy"
        @click="emit('add', $event.currentTarget as Element)"
      >
        {{ chosen(entry).length ? $t('Add an account…') : $t('Use') }}
      </button>
      <button
        v-else-if="entry.installable"
        type="button"
        class="button integration-card__action"
        :aria-describedby="`card-${entry.program}`"
        :aria-disabled="busy"
        @click="emit('install')"
      >
        {{ installing ? $t('Installing…') : failed !== undefined ? $t('Try again') : $t('Install') }}
      </button>
      <button
        v-else
        type="button"
        class="button integration-card__action"
        :aria-describedby="`card-${entry.program}`"
        :aria-disabled="busy"
        @click="emit('checkAgain')"
      >
        {{ $t('Check again') }}
      </button>
    </div>
  </li>
</template>

<style scoped>
.integration-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-3);
  padding: var(--silex-space-4);
  border: 1px solid var(--silex-border-color);
  border-radius: var(--silex-radius-md);
  background: var(--silex-bg-main);
}

.integration-card__head {
  display: flex;
  align-items: center;
  gap: var(--silex-space-3);
}

.integration-card__name {
  margin: 0;
  font-size: 16px;
}

.integration-card__name a {
  display: inline-flex;
  align-items: center;
  gap: var(--silex-space-2);
  color: inherit;
  text-decoration: none;
}

.integration-card__name a:hover {
  text-decoration: underline;
}

.integration-card__info {
  width: 15px;
  height: 15px;
  color: var(--silex-text-secondary);
}

.integration-card__name a:hover .integration-card__info {
  color: var(--silex-text-primary);
}

.integration-card__line {
  margin: 0;
  color: var(--silex-text-secondary);
}

.integration-card__line--failed {
  color: var(--silex-status-error);
}

.integration-card__row {
  display: flex;
  align-items: center;
  gap: var(--silex-space-2);
  margin-top: auto;
}

.integration-card__service {
  padding: 2px var(--silex-space-2);
  border-radius: 999px;
  background: var(--silex-badge-bg);
  color: var(--silex-badge-text);
  font-size: 12px;
}

.integration-card__anti {
  display: flex;
  gap: var(--silex-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.integration-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--silex-badge-bg);
  color: var(--silex-text-secondary);
}

.integration-card__icon svg {
  width: 12px;
  height: 12px;
}

.integration-card__action {
  margin-left: auto;
}

[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
}
</style>
