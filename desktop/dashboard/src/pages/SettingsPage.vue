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

const { t } = useI18n()
const languageNames = { en: 'English', fr: 'Français' }
const options = computed(() => ({
  system: t('Same as this computer ({language})', { language: languageNames[systemLanguage] }),
  ...languageNames,
}))
const languageId = useId()
const helpId = useId()
const aboutId = useId()
// Reka refuses an empty value on an item
const language = ref<Language | 'system'>(savedLanguage() ?? 'system')

function choose(value: Language | 'system') {
  language.value = value
  setLanguage(value === 'system' ? null : value)
}

const version = ref('')
// Outside the app window there is no Tauri to ask
getVersion().then((value) => { version.value = value }, () => {})
</script>

<template>
  <h1 tabindex="-1">
    {{ $t('Settings') }}
  </h1>
  <div class="settings__field">
    <label
      class="settings__label"
      :for="languageId"
    >{{ $t('Language') }}</label>
    <SelectRoot
      :model-value="language"
      @update:model-value="choose"
    >
      <SelectTrigger
        :id="languageId"
        class="select settings__select"
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
  </div>
  <section
    class="settings__about"
    :aria-labelledby="aboutId"
  >
    <h2
      :id="aboutId"
      class="settings__title"
    >
      {{ $t('About') }}
    </h2>
    <p class="settings__help">
      Silex Desktop {{ version }} · {{ $t('free software under the AGPL') }} ·
      <a
        class="settings__link"
        href="https://www.silex.me/"
        target="_blank"
        rel="noopener"
      >silex.me <span aria-hidden="true">↗</span><span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span></a>
    </p>
  </section>
</template>

<style scoped>
.settings__field {
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-1);
  max-width: 620px;
  margin-top: var(--silex-space-6);
}

.settings__label {
  font-weight: 500;
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

.settings__about {
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-1);
  margin-top: var(--silex-space-6);
}

.settings__title {
  font-size: 14px;
}

.settings__link {
  color: var(--silex-text-primary);
}
</style>

<style>
.settings__options {
  min-width: var(--reka-select-trigger-width);
}
</style>
