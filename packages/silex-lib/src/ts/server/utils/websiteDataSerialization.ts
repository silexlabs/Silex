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

import { EMPTY_PAGES, WebsiteData } from '../../types'
import { Page } from 'grapesjs'
import { getPageSlug } from '../../page'
import { LEGACY_WEBSITE_PAGES_FOLDER, WEBSITE_DATA_FILE } from '../../constants'

/**
 * Serialize JSON with stable formatting for git
 * - Uses 2-space indentation for readability
 * - Sorts object keys deterministically to avoid random diffs
 */
export function stringify(data: any): string {
  return JSON.stringify(data, sortKeys, 2)
}

/**
 * Sort object keys for consistent output across serializations
 */
function sortKeys(key: string, value: any): any {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sorted: any = {}
    Object.keys(value).sort().forEach(k => {
      sorted[k] = value[k]
    })
    return sorted
  }
  return value
}

/**
 * Split website data into multiple files
 * Returns array of files to create/update
 */
export function split(websiteData: WebsiteData): Array<{path: string, content: string}> {
  const files: Array<{path: string, content: string}> = []

  // Use custom pages folder if specified, otherwise use default
  const pagesFolder = websiteData.pagesFolder || LEGACY_WEBSITE_PAGES_FOLDER

  // Split pages into separate files
  const pages = websiteData.pages?.map((page: Page) => {
    const pageName = getPageName(page)
    const slug = getPageSlug(pageName)
    const fileName = `${slug}-${page.id}.json`
    const filePath = `${pagesFolder}/${fileName}`

    if(!page.id) return page // It is the {} from EMPTY_PAGES, this happens only with unit tests

    files.push({
      path: filePath,
      content: stringify(page)
    })

    return {
      name: pageName,
      id: page.id,
      isFile: true,
    }
  }) || EMPTY_PAGES

  // Create main website data file without pages content
  const websiteDataLinkedPages = {
    ...websiteData,
    pagesFolder,
    pages,
  }

  files.push({
    path: WEBSITE_DATA_FILE,
    content: stringify(websiteDataLinkedPages)
  })

  return files
}

/**
 * Reconstruct website data from main file and page loader function
 * The pageLoader function will be called for each page that needs to be loaded
 */
export async function merge(
  websiteDataContent: string,
  pageLoader: (pagePath: string) => Promise<string>
): Promise<WebsiteData> {
  const websiteData = JSON.parse(websiteDataContent) as any

  // Use custom pages folder if specified, otherwise use default
  const pagesFolder = websiteData.pagesFolder || LEGACY_WEBSITE_PAGES_FOLDER

  // Handle legacy format (no split pages) or empty pages
  if (!websiteData.pages || websiteData.pages.length === 0) {
    return websiteData as WebsiteData
  }

  // Check if pages are already embedded (legacy format)
  if (websiteData.pages[0] && !websiteData.pages[0].isFile) {
    return websiteData as WebsiteData
  }

  // Load pages from separate files
  const pages = await Promise.all(websiteData.pages.map(async (pageRef: any) => {
    if (pageRef.isFile) {
      const pageName = pageRef.name
      const slug = getPageSlug(pageName)
      const fileName = `${slug}-${pageRef.id}.json`
      const filePath = `${pagesFolder}/${fileName}`

      try {
        const pageContent = await pageLoader(filePath)
        return JSON.parse(pageContent) as Page
      } catch (error) {
        console.warn(`Could not load page file: ${filePath}`, error)
        return pageRef
      }
    }
    return pageRef as Page
  }))

  return {
    ...websiteData,
    pages,
  } as WebsiteData
}

/**
 * Get the pages folder path for a website, using custom path or default
 */
export function getPagesFolder(websiteData: WebsiteData): string {
  return websiteData.pagesFolder || LEGACY_WEBSITE_PAGES_FOLDER
}

/**
 * Get page name from page object
 */
function getPageName(page: Page | any): string {
  return (page as any).getName ? (page as Page).getName() : (page as any).name
}
