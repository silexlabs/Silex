/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview Core i18n helpers shared across Silex's own editor code,
 * reusing the getTranslation()/addMessages() pattern already proven in
 * grapesjs-advanced-selector, instead of a second JS i18n library.
 * Locale files are plain JSON identity maps (English string -> translation),
 * one full, standalone file per BCP-47 locale, loaded as-is with no
 * merge/overlay step.
 */

import { Editor } from 'grapesjs'

const localesContext = require.context('../locales', false, /\.json$/)

const localeMessages: Record<string, Record<string, string>> = localesContext.keys()
  .reduce((acc: Record<string, Record<string, string>>, path: string) => {
    const locale = path.replace(/^\.\//, '').replace(/\.json$/, '')
    acc[locale] = localesContext(path)
    return acc
  }, {})

const SOURCE_LOCALE = 'en-US'

/**
 * localStorage key used by the language switcher (settings-sections.ts) to
 * persist the user's chosen locale across sessions.
 */
export const LOCALE_STORAGE_KEY = 'silex-locale'

/**
 * Register every locale file found in editor/src/locales with GrapesJS I18n.
 */
export function initI18n(editor: Editor): void {
  editor.I18n.addMessages(localeMessages)
}

export function getAvailableLocales(): string[] {
  return Object.keys(localeMessages)
}

/**
 * Fallback chain: exact locale match, else (only for a bare language code
 * with no region, e.g. 'fr') the first shipped locale for that language,
 * else the source locale (en-US).
 *
 * The bare-language step exists for callers outside our control that only
 * know two-letter codes (e.g. the SaaS dashboard's "open editor" link sends
 * `?lang=fr`, not `?lang=fr-FR`) — without it, such a link would silently
 * reset the editor to en-US instead of the closest available French.
 *
 * It does NOT apply to an already region-qualified request: an unshipped
 * region (e.g. fr-CH) still falls straight back to en-US rather than being
 * redirected to a different region (e.g. fr-FR) picked on its behalf.
 */
export function resolveLocale(requested: string | undefined | null, available: string[] = getAvailableLocales()): string {
  if (!requested) return SOURCE_LOCALE
  if (available.includes(requested)) return requested
  if (!requested.includes('-')) {
    const lang = requested.toLowerCase()
    const match = available.find(locale => locale.split('-')[0].toLowerCase() === lang)
    if (match) return match
  }
  return SOURCE_LOCALE
}

const untranslatedKeys = new Set<string>()

/**
 * Translate `key` (the English string itself, house style) for the editor's
 * current locale, forwarding `vars` for interpolated messages
 * (e.g. key: 'Hello {name}', vars: { name: 'Bob' }).
 * Falls back to the raw key when untranslated, matching getTranslation() in
 * grapesjs-advanced-selector/src/model/GrapesJsSelectors.ts.
 */
export function t(editor: Editor, key: string, vars?: Record<string, unknown>): string {
  if (!key) return ''
  const translated = editor?.I18n?.t(key, vars ? { params: vars } : undefined)
  if (!translated) {
    untranslatedKeys.add(key)
    console.info(`Untranslated key "${key}", call editor.runCommand("i18n:info") to see all untranslated keys`)
  }
  return translated || key
}

export function getUntranslatedKeys(): string[] {
  return Array.from(untranslatedKeys)
}
