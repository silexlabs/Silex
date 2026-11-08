<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ExternalLink from './ExternalLink.vue'
import type { AntiFeature, CatalogEntry, Openness, Tag } from '../api'
import { chosen, usable } from '../integrations'

defineProps<{
  entry: CatalogEntry
  busy: boolean
}>()

const emit = defineEmits<{
  checkAgain: []
  add: [from: Element]
}>()

const { t } = useI18n()

const OPENNESS: Record<Openness, () => string> = {
  digitalCommons: () => t('Digital commons'),
  freeSoftware: () => t('Free software'),
  openSource: () => t('Open source'),
  openCore: () => t('Open core'),
  sourceAvailable: () => t('Source available'),
  proprietary: () => t('Proprietary'),
}

const TAGS: Record<Tag, () => string> = {
  hosting: () => t('Hosting'),
  storage: () => t('Storage'),
  team: () => t('Team'),
}

const ANTI_FEATURES: Record<AntiFeature, () => string> = {
  tracking: () => t('Tracks you'),
  proprietaryCloud: () => t('Runs on a proprietary cloud'),
  identityVerification: () => t('May ask to verify your identity'),
  freeLicenseRequired: () => t('Your content must have a free license'),
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
        {{ entry.name }}
      </h4>
    </div>
    <p class="integration-card__summary">
      {{ $t(entry.summary) }}
    </p>
    <ul
      v-if="entry.tags.length"
      class="integration-card__tags"
      :aria-label="$t('Tags')"
    >
      <li
        v-for="tag in entry.tags"
        :key="tag"
        class="integration-card__tag"
      >
        {{ TAGS[tag]() }}
      </li>
    </ul>
    <ul
      v-if="entry.antiFeatures.length"
      class="integration-card__tags"
      :aria-label="$t('What you may not want')"
    >
      <li
        v-for="anti in entry.antiFeatures"
        :key="anti"
        class="integration-card__anti"
      >
        {{ ANTI_FEATURES[anti]() }}
      </li>
    </ul>
    <div class="integration-card__foot">
      <span class="integration-card__service">{{ $t('Service: {type}', { type: OPENNESS[entry.openness]() }) }}</span>
      <span v-if="!entry.runsHere">{{ $t('Not available on this system') }}</span>
      <template v-else-if="!usable(entry) && !entry.enabled">
        <ExternalLink
          :href="entry.installUrl"
          :name="$t('How to install {program}', { program: entry.program })"
          arrow
        />
        <button
          type="button"
          class="button"
          :aria-describedby="`card-${entry.program}`"
          :aria-disabled="busy"
          @click="emit('checkAgain')"
        >
          {{ $t('Check again') }}
        </button>
      </template>
      <template v-else-if="usable(entry)">
        <span v-if="!chosen(entry).length">{{ $t('Found on this computer') }}</span>
        <button
          type="button"
          class="button card__open integration-card__use"
          :aria-describedby="`card-${entry.program}`"
          :aria-disabled="busy"
          @click="emit('add', $event.currentTarget as Element)"
        >
          {{ chosen(entry).length ? $t('Add an account…') : $t('Use') }}
        </button>
      </template>
    </div>
  </li>
</template>

<style scoped>
.integration-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-2);
  padding: var(--silex-space-4);
  border: 1px solid var(--silex-border-color);
  border-radius: var(--silex-radius-md);
  background: var(--silex-bg-main);
}

.integration-card:has(.integration-card__use):hover {
  border-color: var(--silex-border-color-strong);
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

.integration-card__summary {
  margin: 0;
  color: var(--silex-text-secondary);
}

.integration-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--silex-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.integration-card__tag {
  padding: 2px var(--silex-space-2);
  border-radius: 999px;
  background: var(--silex-badge-bg);
  color: var(--silex-badge-text);
  font-size: 12px;
}

.integration-card__anti {
  color: var(--silex-status-warning);
  font-size: 12px;
}

.integration-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--silex-space-2);
  margin-top: auto;
  padding-top: var(--silex-space-2);
  color: var(--silex-text-secondary);
  font-size: 12px;
}

.integration-card__service {
  margin-right: auto;
}

[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
}
</style>
