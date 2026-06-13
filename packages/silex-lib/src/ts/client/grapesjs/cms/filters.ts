import { Field, Filter, Options } from '@silexlabs/grapesjs-data-source'
import { html } from 'lit-html'
import { Component } from 'grapesjs'

// Export filters for use in client.ts
export const eleventyFilters: Filter[] = [{
  type: 'filter',
  id: 'log',
  label: 'log (11ty)',
  validate: (field: Field | null) => !!field,
  output: type => type,
  apply: (str) => {
    console.info(str)
    return str
  },
  options: {},
}, {
  type: 'filter',
  id: 'slugify',
  label: 'slugify (11ty)',
  validate: (field: Field | null) => !!field && field.typeIds.map(t => t.toLowerCase()).includes('string') && field.kind === 'scalar',
  output: type => type,
  apply: (str) => {
    return str?.toString().toLowerCase().replace(/\s+/g, '-')
  },
  options: {},
}]

export const i18nFilters: Filter[] = [{
  type: 'filter',
  id: 'locale_url',
  label: 'locale_url (11ty)',
  validate: (input: Field | null) => !!input?.typeIds.map(t => t.toLowerCase()).includes('string') && input?.kind === 'scalar',
  apply: (input: unknown/*, options: Options*/) => input,
  output: (input: Field | null/*, options: Options*/) => ({ ...(input || {} as Field), typeIds: ['String'] }),
  options: {
    locale: '',
  },
  quotedOptions: ['locale'],
  optionsForm: (selected: Component, input: Field | null, options: Options) => html`
      <label>Locale
        <input type="text" name="locale" value="${options.locale}" />
      </label>
    `,
}, {
  type: 'filter',
  id: 'locale_links',
  label: 'locale_links (11ty)',
  validate: (input: Field | null) => !!input?.typeIds.map(t => t.toLowerCase()).includes('string') && input?.kind === 'scalar',
  apply: (input: unknown/*, options: Options*/) => ([{ url: input, lang: 'en', label: 'English' }, { url: input, lang: 'fr', label: 'Français' }]),
  output: (input: Field | null/*, options: Options*/) => ({ ...(input || {} as Field), typeIds: ['locale_link'], kind: 'list' }),
  options: {},
}]
