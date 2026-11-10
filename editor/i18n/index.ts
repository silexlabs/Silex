/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
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
 */

import en from '../locales/en.json'
import fr from '../locales/fr.json'
import type { Editor } from 'grapesjs'

const NAMESPACE = 'silex'

const localeMessages: Record<string, Record<string, Record<string, string>>> = {
  en: { [NAMESPACE]: en },
  fr: { [NAMESPACE]: fr },
}

const SOURCE_LOCALE = 'en'

/**
 * Return the locale messages for GrapesJS' initial configuration.
 */
export function getLocaleMessages(): typeof localeMessages {
  return localeMessages
}

export function getAvailableLocales(): string[] {
  return Object.keys(localeMessages)
}

/**
 * Resolve an exact locale first, then fall back to another shipped locale for
 * the same language (including between bare and region-qualified tags), and
 * finally use the source locale.
 */
export function resolveLocale(requested: string | undefined | null, available: string[] = getAvailableLocales()): string {
  const normalized = requested?.trim().replace(/_/g, '-')
  if (!normalized) return SOURCE_LOCALE

  const exactMatch = available.find(locale => locale.toLowerCase() === normalized.toLowerCase())
  if (exactMatch) return exactMatch

  const language = normalized.split('-')[0].toLowerCase()
  const languageMatches = available.filter(locale => locale.split('-')[0].toLowerCase() === language)
  return languageMatches.find(locale => !locale.includes('-')) ?? languageMatches[0] ?? SOURCE_LOCALE
}

/**
 * Index the `silex` namespace of a locale with the raw English key.
 */
function readSilex(editor: Editor, locale: string | undefined, key: string): string | undefined {
  const silex = editor?.I18n?.getMessages(locale)?.[NAMESPACE] as Record<string, string> | undefined
  const value = silex?.[key]
  return typeof value === 'string' ? value : undefined
}

// Same token syntax and trimming as GrapesJS I18n._addParams(), applied by
// t() since direct lookup does not interpolate.
const PARAMS_RE = /{([\w\d-]*)}/g
function addParams(value: string, vars: Record<string, unknown>): string {
  return value.replace(PARAMS_RE, (match, name: string) => {
    const param = vars[name]
    return param ? String(param) : ''
  }).trim()
}

/**
 * Translate `key` (the English string itself, house style) for the editor's
 * current locale.
 */
export function t(editor: Editor, key: string, vars?: Record<string, unknown>): string {
  if (!key) return ''
  let translated = readSilex(editor, editor?.I18n?.getLocale(), key)
  if (!translated) {
    translated = readSilex(editor, editor?.I18n?.getConfig('localeFallback'), key)
  }
  if (translated && vars) {
    translated = addParams(translated, vars)
  }
  return translated || (vars ? addParams(key, vars) : key)
}
