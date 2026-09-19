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

// Page related functions
// This is used on the client and the server

/** File slug static hosts (GitLab Pages, GitHub Pages, …) serve at `/` */
export const HOMEPAGE_SLUG = 'index'

export type PagePublishInfo = {
  name?: string
  type?: string
}

export function getPageSlug(pageName: string | undefined) {
  return (pageName || HOMEPAGE_SLUG)
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    // Collapse whitespace and replace by -
    .replace(/\s+/g, '-')
    // Collapse dashes
    .replace(/-+/g, '-')
}
export function getPageLink(pageName) {
  return `./${getPageSlug(pageName)}.html`
}

export function hasIndexSlugPage(pages: PagePublishInfo[]): boolean {
  return pages.some(page => getPageSlug(page.name) === HOMEPAGE_SLUG)
}

export function isMainPublishPage(page: PagePublishInfo, pages: PagePublishInfo[]): boolean {
  if (page.type === 'main') return true
  return !pages.some(p => p.type === 'main') && pages[0] === page
}

/**
 * The page static hosts will serve at `/`.
 * Prefer a page whose name slugifies to `index`, else the main/first page.
 */
export function getHomepagePublishPage(pages: PagePublishInfo[]): PagePublishInfo | undefined {
  const bySlug = pages.find(page => getPageSlug(page.name) === HOMEPAGE_SLUG)
  if (bySlug) return bySlug
  const byMain = pages.find(page => page.type === 'main')
  if (byMain) return byMain
  return pages[0]
}

/**
 * True when this page should be written as `/index.html` so `/` works
 * even if the user named the homepage something else (e.g. Accueil).
 */
export function publishesAsIndexHtml(page: PagePublishInfo, pages: PagePublishInfo[]): boolean {
  if (getPageSlug(page.name) === HOMEPAGE_SLUG) return true
  if (hasIndexSlugPage(pages)) return false
  return isMainPublishPage(page, pages)
}

export function getPublishedHtmlPath(page: PagePublishInfo, pages: PagePublishInfo[]): string {
  const slug = publishesAsIndexHtml(page, pages) ? HOMEPAGE_SLUG : getPageSlug(page.name)
  return `/${slug}.html`
}

export function getPublishedPageLink(page: PagePublishInfo, pages: PagePublishInfo[]): string {
  const slug = publishesAsIndexHtml(page, pages) ? HOMEPAGE_SLUG : getPageSlug(page.name)
  return `./${slug}.html`
}

function rewriteMatchingPermalink(link: string, from: string, to: string): string | null {
  if (link === from) return to
  if (link.startsWith(`${from}#`) || link.startsWith(`${from}?`)) {
    return `${to}${link.slice(from.length)}`
  }
  return null
}

/**
 * Rewrite editor permalinks that still use the homepage slug
 * (e.g. `./accueil.html`) when that page is published as `index.html`.
 */
export function rewritePublishedPermalink(link: string, pages: PagePublishInfo[]): string {
  const homepage = getHomepagePublishPage(pages)
  if (!homepage || !publishesAsIndexHtml(homepage, pages)) return link
  const slug = getPageSlug(homepage.name)
  if (slug === HOMEPAGE_SLUG) return link
  return rewriteMatchingPermalink(link, getPageLink(homepage.name), `./${HOMEPAGE_SLUG}.html`)
    ?? rewriteMatchingPermalink(link, `/${slug}.html`, `/${HOMEPAGE_SLUG}.html`)
    ?? link
}
