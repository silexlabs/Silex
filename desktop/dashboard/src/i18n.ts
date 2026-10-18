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

const categories: Intl.LDMLPluralRule[] = ['zero', 'one', 'two', 'few', 'many', 'other']

// A message gives the plural forms of its language in the CLDR order, and the
// last one it gives also stands for those it leaves out, like the "many" of French
function pluralRule(language: Language) {
  const rules = new Intl.PluralRules(language)
  const forms = categories.filter((form) => rules.resolvedOptions().pluralCategories.includes(form))
  return (choice: number, choicesLength: number) => Math.min(forms.indexOf(rules.select(choice)), choicesLength - 1)
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLanguage() ?? systemLanguage,
  fallbackLocale: 'en',
  messages: { en, fr },
  pluralRules: { en: pluralRule('en'), fr: pluralRule('fr') },
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
