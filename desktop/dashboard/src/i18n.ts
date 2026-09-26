import { watchEffect } from 'vue'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

export type Language = 'en' | 'fr'

const storageKey = 'silex-language'

export const systemLanguage: Language = navigator.language.startsWith('fr') ? 'fr' : 'en'

export function savedLanguage(): Language | null {
  try {
    const language = localStorage.getItem(storageKey)
    return language === 'en' || language === 'fr' ? language : null
  } catch {
    return null
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLanguage() ?? systemLanguage,
  fallbackLocale: 'en',
  messages: { en, fr },
})

watchEffect(() => {
  document.documentElement.lang = i18n.global.locale.value
})

// null follows the language of this computer, even when it changes later
export function setLanguage(language: Language | null) {
  try {
    if (language) localStorage.setItem(storageKey, language)
    else localStorage.removeItem(storageKey)
  } catch {
    // The choice then lasts until the app closes
  }
  i18n.global.locale.value = language ?? systemLanguage
}
