<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVersion } from '@tauri-apps/api/app'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from 'reka-ui'
import { type Language, savedLanguage, setLanguage, systemLanguage } from '../i18n'
import contributors from '../contributors.json'
import thanks from '../thanks.json'
import ExternalLink from '../components/ExternalLink.vue'
import LocalizedList from '../components/LocalizedList.vue'

const { t } = useI18n()
const languageNames = { en: 'English', fr: 'Français' }
const options = computed(() => ({
  system: t('Same as this computer ({language})', { language: languageNames[systemLanguage] }),
  ...languageNames,
}))
const languageId = useId()
const helpId = useId()
const aboutId = useId()
const thanksId = useId()
const softwareId = useId()
const author = 'Alex Hoyau'
const credits = contributors
  .map(({ year, people }) => ({ year, people: people.filter(({ name }) => name !== author) }))
  .filter(({ people }) => people.length)
const others = new Set(credits.flatMap(({ people }) => people.map(({ name }) => name)))
const upstream = [
  { name: 'GrapesJS', href: 'https://github.com/GrapesJS/grapesjs' },
  { name: 'Tauri', href: 'https://tauri.app/' },
  { name: 'Vue', href: 'https://vuejs.org/' },
  { name: 'Eleventy', href: 'https://www.11ty.dev/' },
]
// Reka refuses an empty value on an item
const language = ref<Language | 'system'>(savedLanguage() ?? 'system')

function choose(value: Language | 'system') {
  language.value = value
  setLanguage(value === 'system' ? null : value)
}

const version = ref('')
// Outside the app window there is no Tauri to ask
getVersion().then((value) => { version.value = value }, () => {})
const releaseNotes = computed(() => (version.value.includes('-dev')
  ? 'https://github.com/silexlabs/Silex/releases'
  : `https://github.com/silexlabs/Silex/releases/tag/v${version.value}`))
</script>

<template>
  <h1 tabindex="-1">
    {{ $t('Settings') }}
  </h1>
  <section
    class="settings__section"
    :aria-labelledby="languageId"
  >
    <h2
      :id="languageId"
      class="settings__title"
    >
      {{ $t('Language') }}
    </h2>
    <SelectRoot
      :model-value="language"
      @update:model-value="choose"
    >
      <SelectTrigger
        class="select settings__select"
        :aria-labelledby="languageId"
        :aria-describedby="helpId"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          class="menu settings__options"
          position="popper"
          :side-offset="4"
        >
          <SelectItem
            v-for="(languageName, code) in options"
            :key="code"
            :value="code"
            :lang="code === 'system' ? undefined : code"
            class="menu__item"
          >
            <SelectItemText>{{ languageName }}</SelectItemText>
            <SelectItemIndicator aria-hidden="true">
              ✓
            </SelectItemIndicator>
          </SelectItem>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <p
      :id="helpId"
      class="settings__help"
    >
      {{ $t('Applies to the whole app, including the editor.') }}
    </p>
  </section>
  <section
    class="settings__section"
    :aria-labelledby="aboutId"
  >
    <h2
      :id="aboutId"
      class="settings__title"
    >
      {{ $t('About') }}
    </h2>
    <p class="settings__name">
      Silex Desktop {{ version }}
      <ExternalLink
        v-if="version"
        class="settings__link"
        :href="releaseNotes"
        :name="$t('Release notes')"
        arrow
      />
    </p>
    <p class="settings__help">
      {{ $t('Free software under the AGPL.') }}
      <ExternalLink
        class="settings__link"
        href="https://short.silex.me/code"
        :name="$t('Source code')"
        arrow
      />
    </p>
  </section>

  <section
    class="settings__section"
    :aria-labelledby="thanksId"
  >
    <h2
      :id="thanksId"
      class="settings__title"
    >
      {{ $t('Thanks') }}
    </h2>
    <details class="settings__credits">
      <summary class="settings__help">
        {{ $t('Created by Alex Hoyau and one contributor | Created by Alex Hoyau and {count} contributors', others.size) }}
      </summary>
      <p
        v-for="{ year, people } in credits"
        :key="year"
        class="settings__help"
      >
        <strong>{{ year }}</strong>&ensp;<LocalizedList
          v-slot="{ item: person }"
          :items="people"
        >
          <ExternalLink
            v-if="person.url"
            class="settings__link"
            :href="person.url"
            :name="person.name"
          /><template v-else>
            {{ person.name }}
          </template>
        </LocalizedList>
      </p>
    </details>
    <p class="settings__help">
      <i18n-t keypath="Partners: {names}">
        <template #names>
          <LocalizedList
            v-slot="{ item }"
            :items="thanks.partners"
          >
            <ExternalLink
              class="settings__link"
              :href="item.href"
              :name="item.name"
            />
          </LocalizedList>
        </template>
      </i18n-t>
    </p>
    <details class="settings__credits">
      <summary class="settings__help">
        {{ $t('Community') }}
      </summary>
      <p class="settings__help">
        <LocalizedList
          v-slot="{ item }"
          :items="thanks.community"
        >
          <ExternalLink
            v-if="item.href"
            class="settings__link"
            :href="item.href"
            :name="item.name"
          /><template v-else>
            {{ item.name }}
          </template>
        </LocalizedList>
      </p>
    </details>
  </section>

  <section
    class="settings__section"
    :aria-labelledby="softwareId"
  >
    <h2
      :id="softwareId"
      class="settings__title"
    >
      {{ $t('Free software') }}
    </h2>
    <p class="settings__help">
      <i18n-t keypath="Silex relies on many other free and open source programs, among them {projects}.">
        <template #projects>
          <LocalizedList
            v-slot="{ item: project }"
            :items="upstream"
          >
            <ExternalLink
              class="settings__link"
              :href="project.href"
              :name="project.name"
            />
          </LocalizedList>
        </template>
      </i18n-t>
    </p>
    <RouterLink
      class="settings__link settings__more"
      to="/settings/licenses"
    >
      {{ $t('See the programs used and their licenses') }}
    </RouterLink>
  </section>
</template>

<style scoped>
.settings__section {
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-1);
  margin-top: var(--silex-space-6);
}

.settings__select {
  max-width: 320px;
  text-align: left;
  cursor: pointer;
}

.settings__select[data-state='open'] {
  border-color: var(--silex-focus-outline);
}

.settings__help {
  margin: 0;
  color: var(--silex-text-secondary);
  font-size: 13px;
}

.settings__title {
  margin: 0 0 var(--silex-space-1);
  font-size: 14px;
  font-weight: 500;
}

.settings__name {
  margin: 0;
  font-weight: 500;
}

.settings__credits summary {
  width: fit-content;
  cursor: pointer;
}

.settings__credits[open] summary {
  margin-bottom: var(--silex-space-1);
}

.settings__credits p {
  padding-left: var(--silex-space-3);
}

.settings__link {
  color: var(--silex-text-primary);
}

.settings__more {
  width: fit-content;
  font-size: 13px;
}

</style>

<style>
.settings__options {
  min-width: var(--reka-select-trigger-width);
}
</style>
