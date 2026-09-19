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

  async function getPublishedFiles(siteSettings: WebsiteSettings = {}) {
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    const files = []
    for await (const file of manager.getHtmlFilesYield(siteSettings, () => undefined)) {
      if (file) files.push(file)
    }
    return files
  }

  async function getHtml(siteSettings: WebsiteSettings, pageSettings: WebsiteSettings, pageName: string) {
    const page = editor.Pages.getAll()[0]
    page.set('name', pageName)
    page.set('settings', pageSettings)
    const files = await getPublishedFiles(siteSettings)
    if (!files[0]) throw new Error('No file yielded')
    return files[0].html as string
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

  it('publishes a main page named Accueil as /index.html', async () => {
    const home = editor.Pages.getAll()[0]
    home.set('name', 'Accueil')
    home.set('type', 'main')
    editor.Pages.add({ name: 'About' })
    const files = await getPublishedFiles()
    const paths = files.map(file => file.htmlPath).sort()
    expect(paths).toEqual(['/about.html', '/index.html'])
    const homepage = files.find(file => file.htmlPath === '/index.html')
    expect(homepage?.cssPath).toMatch(/^\/css\/accueil-/)
    expect(files.find(file => file.htmlPath === '/accueil.html')).toBeUndefined()
  })

  it('keeps a page named index as /index.html', async () => {
    editor.Pages.getAll()[0].set('name', 'index')
    editor.Pages.add({ name: 'About' })
    const files = await getPublishedFiles()
    expect(files.map(file => file.htmlPath).sort()).toEqual(['/about.html', '/index.html'])
  })

  it('rewrites in-site links to a non-index homepage as ./index.html', async () => {
    const home = editor.Pages.getAll()[0]
    home.set('name', 'Accueil')
    home.set('type', 'main')
    home.getMainComponent().append({
      tagName: 'a',
      content: 'Home',
      attributes: { href: './accueil.html' },
    })
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    // Same transformer setup as getPublicationData / startPublication
    ;(manager as any).setPublicationTransformers()
    const files = []
    for await (const file of manager.getHtmlFilesYield({}, () => undefined)) {
      if (file) files.push(file)
    }
    expect(files[0].htmlPath).toBe('/index.html')
    expect(files[0].html).toContain('href="./index.html"')
    expect(files[0].html).not.toContain('href="./accueil.html"')
  })

  it('warns when no page slugifies to index', () => {
    const runCommand = jest.fn()
    editor.runCommand = runCommand as typeof editor.runCommand
    editor.Pages.getAll()[0].set('name', 'Accueil')
    editor.Pages.getAll()[0].set('type', 'main')
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    manager.checkHomepageIndex()
    expect(runCommand).toHaveBeenCalledWith('notifications:add', expect.objectContaining({
      id: 'publish-homepage-index',
      type: 'warning',
      group: 'publication',
    }))
    const message = (runCommand.mock.calls[0][1] as { message: string }).message
    expect(message).toContain('index.html')
    expect(message).toContain('Accueil')
  })

  it('does not warn when a page slugifies to index', () => {
    const runCommand = jest.fn()
    editor.runCommand = runCommand as typeof editor.runCommand
    editor.Pages.getAll()[0].set('name', 'index')
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    manager.checkHomepageIndex()
    expect(runCommand).not.toHaveBeenCalled()
  })
})
