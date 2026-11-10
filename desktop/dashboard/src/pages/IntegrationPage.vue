<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ExternalLink from '../components/ExternalLink.vue'
import { explain } from '../api'
import {
  ANTI_FEATURES,
  OPENNESS,
  TAGS,
  catalog,
  loadIntegrations,
  usable,
} from '../integrations'

const route = useRoute()
const entry = computed(() => catalog.value?.find((other) => other.program === route.params.program))
const failed = ref<ReturnType<typeof explain> | null>(null)

async function load() {
  failed.value = null
  try {
    await loadIntegrations()
  } catch (error) {
    failed.value = explain(error)
  }
}

onMounted(() => {
  if (!catalog.value) load()
})
</script>

<template>
  <RouterLink
    to="/integrations"
    class="integration__back"
  >
    <span aria-hidden="true">←</span> {{ $t('Integrations') }}
  </RouterLink>
  <div class="integration__head">
    <span
      v-if="entry"
      class="tile tile--large logo"
      aria-hidden="true"
      v-html="entry.icon"
    />
    <h1 tabindex="-1">
      {{ entry?.name ?? $t('Integrations') }}
    </h1>
  </div>
  <div
    v-if="failed"
    role="alert"
  >
    <p class="page__lead">
      {{ $t('Silex could not load the integrations.') }}
    </p>
    <button
      type="button"
      class="button"
      @click="load"
    >
      {{ $t('Try again') }}
    </button>
  </div>
  <p
    v-else-if="!catalog"
    role="status"
    class="page__lead"
  >
    {{ $t('Loading the integrations…') }}
  </p>
  <p
    v-else-if="!entry"
    class="page__lead"
  >
    {{ $t('Silex has no integration named {program}.', { program: route.params.program }) }}
  </p>
  <template v-else>
    <p class="page__lead">
      {{ $t(entry.summary) }}
    </p>
    <ul
      v-if="entry.tags.length"
      class="integration__tags"
      :aria-label="$t('Tags')"
    >
      <li
        v-for="tag in entry.tags"
        :key="tag"
      >
        {{ TAGS[tag]() }}
      </li>
    </ul>
    <p>{{ $t('Service: {type}', { type: OPENNESS[entry.openness]() }) }}</p>
    <template v-if="entry.antiFeatures.length">
      <h2>{{ $t('What you may not want') }}</h2>
      <ul>
        <li
          v-for="anti in entry.antiFeatures"
          :key="anti"
        >
          {{ ANTI_FEATURES[anti]() }}
        </li>
      </ul>
    </template>
    <template v-if="!entry.runsHere">
      <p>{{ $t('Not available on this system') }}</p>
    </template>
    <template v-else-if="!usable(entry)">
      <h2>{{ $t('Install it yourself') }}</h2>
      <p>
        <ExternalLink
          :href="entry.installUrl"
          :name="$t('How to install {program}', { program: entry.program })"
          arrow
        />
      </p>
    </template>
  </template>
</template>

<style scoped>
.integration__back {
  display: inline-block;
  margin-bottom: var(--silex-space-2);
  color: var(--silex-text-secondary);
  text-decoration: none;
}

.integration__back:hover {
  color: var(--silex-text-primary);
}

.integration__head {
  display: flex;
  align-items: center;
  gap: var(--silex-space-3);
}

.integration__tags {
  display: flex;
  gap: var(--silex-space-1);
  padding: 0;
  list-style: none;
}

.integration__tags li {
  padding: 2px var(--silex-space-2);
  border-radius: 999px;
  background: var(--silex-badge-bg);
  color: var(--silex-badge-text);
  font-size: 12px;
}

h2 {
  margin-top: var(--silex-space-6);
  font-size: 16px;
}
</style>
