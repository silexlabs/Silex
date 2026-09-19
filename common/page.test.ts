import { describe, expect, it } from '@jest/globals'
import {
  HOMEPAGE_SLUG,
  getPageLink,
  getPageSlug,
  getPublishedHtmlPath,
  getPublishedPageLink,
  hasIndexSlugPage,
  publishesAsIndexHtml,
  rewritePublishedPermalink,
} from './page'

describe('page slug and publish paths', () => {
  it('slugifies page names and defaults empty names to index', () => {
    expect(getPageSlug('Accueil')).toBe('accueil')
    expect(getPageSlug('Home page')).toBe('home-page')
    expect(getPageSlug(undefined)).toBe(HOMEPAGE_SLUG)
    expect(getPageSlug('')).toBe(HOMEPAGE_SLUG)
    expect(getPageLink('Accueil')).toBe('./accueil.html')
  })

  it('publishes a non-index main page as /index.html', () => {
    const accueil = { name: 'Accueil', type: 'main' }
    const about = { name: 'About' }
    const pages = [accueil, about]
    expect(publishesAsIndexHtml(accueil, pages)).toBe(true)
    expect(publishesAsIndexHtml(about, pages)).toBe(false)
    expect(getPublishedHtmlPath(accueil, pages)).toBe('/index.html')
    expect(getPublishedHtmlPath(about, pages)).toBe('/about.html')
    expect(getPublishedPageLink(accueil, pages)).toBe('./index.html')
    expect(getPublishedPageLink(about, pages)).toBe('./about.html')
  })

  it('keeps a page named index as /index.html and does not remap another main page', () => {
    const home = { name: 'Accueil', type: 'main' }
    const index = { name: 'index' }
    const pages = [home, index]
    expect(hasIndexSlugPage(pages)).toBe(true)
    expect(getPublishedHtmlPath(home, pages)).toBe('/accueil.html')
    expect(getPublishedHtmlPath(index, pages)).toBe('/index.html')
  })

  it('treats the first page as homepage when no page is type main or named index', () => {
    const first = { name: 'Home' }
    const second = { name: 'About' }
    const pages = [first, second]
    expect(getPublishedHtmlPath(first, pages)).toBe('/index.html')
    expect(getPublishedHtmlPath(second, pages)).toBe('/about.html')
  })

  it('rewrites in-site permalinks that still point at the homepage slug', () => {
    const pages = [{ name: 'Accueil', type: 'main' }, { name: 'About' }]
    expect(rewritePublishedPermalink('./accueil.html', pages)).toBe('./index.html')
    expect(rewritePublishedPermalink('/accueil.html', pages)).toBe('/index.html')
    expect(rewritePublishedPermalink('./accueil.html#intro', pages)).toBe('./index.html#intro')
    expect(rewritePublishedPermalink('./about.html', pages)).toBe('./about.html')
    expect(rewritePublishedPermalink('./index.html', pages)).toBe('./index.html')
  })

  it('does not rewrite permalinks when a page already slugifies to index', () => {
    const pages = [{ name: 'Accueil', type: 'main' }, { name: 'index' }]
    expect(rewritePublishedPermalink('./accueil.html', pages)).toBe('./accueil.html')
  })
})
