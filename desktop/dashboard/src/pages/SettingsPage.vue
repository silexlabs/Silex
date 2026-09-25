<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { getVersion } from '@tauri-apps/api/app'
import { savedLanguage, setLanguage, systemLanguage } from '../i18n'

const languageNames = { en: 'English', fr: 'Français' }
const languageId = useId()
const helpId = useId()
const aboutId = useId()
const language = ref(savedLanguage())
watch(language, setLanguage)

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
    <select
      :id="languageId"
      v-model="language"
      class="select settings__select"
      :aria-describedby="helpId"
    >
      <option :value="null">
        {{ $t('Same as this computer ({language})', { language: languageNames[systemLanguage] }) }}
      </option>
      <option
        v-for="(languageName, code) in languageNames"
        :key="code"
        :value="code"
        :lang="code"
      >
        {{ languageName }}
      </option>
    </select>
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
