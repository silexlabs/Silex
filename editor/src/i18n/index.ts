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
 * one full, standalone file per language or BCP-47 locale, loaded as-is with no
 * merge/overlay step.
 */

import { Editor } from 'grapesjs'
import en from '../locales/en.json'
import fr from '../locales/fr.json'

const localeMessages: Record<string, Record<string, string>> = {
  en,
  fr,
}

const SOURCE_LOCALE = 'en'

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
