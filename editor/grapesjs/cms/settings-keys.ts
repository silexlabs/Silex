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

import { EchoContext } from './render'

// Keys of the page settings in the website data, named before Hugo was a target
export const PAGE_DATA_KEY = 'eleventyPageData'
export const PERMALINK_KEY = 'eleventyPermalink'
export const PAGE_SIZE_KEY = 'eleventyPageSize'

// Expressions of the CMS tab which replace the values of the SEO tab
export const SEO_OVERRIDES = [
  { key: 'eleventySeoTitle', target: 'title', context: EchoContext.TEXT },
  { key: 'eleventySeoDescription', target: 'description', context: EchoContext.ATTRIBUTE },
  { key: 'eleventyFavicon', target: 'favicon', context: EchoContext.URL },
  { key: 'eleventyOGImage', target: 'og:image', context: EchoContext.ATTRIBUTE },
  { key: 'eleventyOGTitle', target: 'og:title', context: EchoContext.ATTRIBUTE },
  { key: 'eleventyOGDescription', target: 'og:description', context: EchoContext.ATTRIBUTE },
] as const

const SETTING_LABELS: Record<string, string> = {
  [PAGE_DATA_KEY]: 'Page data',
  [PERMALINK_KEY]: 'Permalink',
  [PAGE_SIZE_KEY]: 'Size',
  silexLanguagesList: 'Available languages',
  eleventySeoTitle: 'SEO title',
  eleventySeoDescription: 'SEO description',
  eleventyFavicon: 'Favicon',
  eleventyOGImage: 'OG image',
  eleventyOGTitle: 'OG title',
  eleventyOGDescription: 'OG description',
  eleventyNavigationKey: 'Navigation key',
  eleventyNavigationTitle: 'Navigation title',
  eleventyNavigationOrder: 'Navigation order',
  eleventyNavigationParent: 'Navigation parent',
  eleventyNavigationUrl: 'Navigation URL',
}

export function getSettingLabel(key: string): string {
  return SETTING_LABELS[key] ?? key
}
