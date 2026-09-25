import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  { ignores: ['dist'] },
  pluginVue.configs['flat/strongly-recommended'],
  pluginVueA11y.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',
      'vue/no-unused-emit-declarations': 'error',
      // showModal() gives the focus to the autofocus element: that is where it belongs
      'vuejs-accessibility/no-autofocus': 'off',
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
    },
  },
)
