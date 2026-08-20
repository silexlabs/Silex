/*
 * @jest-environment jsdom
 */

import { expect, jest, describe, it, beforeEach } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { WebsiteSettings } from '~/common/types'
import { PublicationManager } from './PublicationManager'

// Prevent lit-html from being imported (it is a peer dependency and breaks the tests)
jest.mock('lit-html', () => ({}))

describe('PublicationManager html output', () => {
  let editor: Editor

  beforeEach(() => {
    /* @ts-ignore */
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
    })
    editor.getModel().set('config', { getEditor: () => editor, publicationTransformers: [] })
  })

  async function getHtml(siteSettings: WebsiteSettings, pageSettings: WebsiteSettings, pageName: string) {
    const page = editor.Pages.getAll()[0]
    page.set('name', pageName)
    page.set('settings', pageSettings)
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    for await (const file of manager.getHtmlFilesYield(siteSettings, () => undefined)) {
      if (file) return file.html as string
    }
    throw new Error('No file yielded')
  }

  it('omits the lang attribute when no language is set', async () => {
    const html = await getHtml({}, {}, 'Home')
    expect(html).toContain('<html>')
    expect(html).not.toContain('lang=')
  })

  it('writes the lang attribute when a language is set', async () => {
    const html = await getHtml({ lang: 'fr' }, {}, 'Home')
    expect(html).toContain('<html lang="fr">')
  })

  it('falls back to the page name when no title is set', async () => {
    const html = await getHtml({}, {}, 'My page')
    expect(html).toContain('<title>My page</title>')
  })

  it('prefers the title setting over the page name', async () => {
    const html = await getHtml({}, { title: 'Custom title' }, 'My page')
    expect(html).toContain('<title>Custom title</title>')
    expect(html).not.toContain('<title>My page</title>')
  })

  it('does not save the fallback title into the page settings', async () => {
    await getHtml({}, {}, 'My page')
    const settings = editor.Pages.getAll()[0].get('settings') as WebsiteSettings
    expect(settings?.title).toBeUndefined()
  })
})
