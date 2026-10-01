import { readFileSync } from 'node:fs'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

// Rust says these sentences itself, in its errors and in the native dialogs
const saidByRust = ['../../server-rust/src/said.rs', '../src-tauri/src/locales.rs'].flatMap((file) =>
  [...readFileSync(new URL(file, import.meta.url), 'utf8').matchAll(/pub const \w+: &str =\s*("(?:[^"\\]|\\.)*");/g)]
    .map(([, literal]) => JSON.parse(literal)),
)
// A sentence of api.ts reaches t() through a Said, where the lint cannot follow it
const saidByTheDashboard = ['Silex is not answering. Restart it, then try again.']
const escape = (text) => text.replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&').replaceAll('\n', '\\n')
// The rule matches the path of a key as it prints it: bare, or quoted in brackets
const keyPattern = (key) => `/^(?:${escape(key)}|\\[${escape(JSON.stringify(key))}\\])$/`

export default defineConfigWithVueTs(
  { ignores: ['dist'] },
  pluginVue.configs['flat/strongly-recommended'],
  pluginVueA11y.configs['flat/recommended'],
  vueTsConfigs.recommended,
  pluginVueI18n.configs['flat/base'],
  {
    settings: {
      'vue-i18n': {
        localeDir: './src/locales/*.json',
        messageSyntaxVersion: '^11.0.0',
      },
    },
    rules: {
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',
      'vue/no-unused-emit-declarations': 'error',
      // showModal() gives the focus to the autofocus element: that is where it belongs
      'vuejs-accessibility/no-autofocus': 'off',
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
      '@intlify/vue-i18n/no-raw-text': ['error', { ignorePattern: '^[\\s↗←✓×·⋯]*$', ignoreText: ['Silex', 'Silex Desktop'] }],
      '@intlify/vue-i18n/no-missing-keys': 'error',
      '@intlify/vue-i18n/no-unused-keys': ['error', { extensions: ['.ts', '.vue'], ignores: [...saidByRust, ...saidByTheDashboard].map(keyPattern) }],
      '@intlify/vue-i18n/valid-message-syntax': 'error',
    },
  },
)
