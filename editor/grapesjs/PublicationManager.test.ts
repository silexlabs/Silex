/*
 * @jest-environment jsdom
 */

import { expect, jest, describe, it, beforeEach } from '@jest/globals'
import grapesjs, { Component, Editor } from 'grapesjs'
import { WebsiteSettings } from '~/common/types'
import { PublicationManager } from './PublicationManager'

// Prevent lit-html from being imported (it is a peer dependency and breaks the tests)
jest.mock('lit-html', () => ({}))
jest.mock('lit-html/directives/unsafe-html.js', () => ({ unsafeHTML: () => '' }))

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

  it('finds only images that have no alt attribute', () => {
    const page = editor.Pages.getAll()[0]
    const body = page.getMainComponent()
    body.components().add([
      { tagName: 'img', attributes: { src: '/missing-alt.png' } },
      { tagName: 'img', attributes: { src: '/decorative.png', alt: '' } },
      { tagName: 'img', attributes: { src: '/described.png', alt: 'A described image' } },
    ])
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    const getImagesMissingAlt = (manager as unknown as {
      getImagesMissingAlt(component: Component): Component[]
    }).getImagesMissingAlt.bind(manager)

    const imagesMissingAlt = getImagesMissingAlt(body)

    expect(imagesMissingAlt).toHaveLength(1)
    expect(imagesMissingAlt[0].getAttributes().src).toBe('/missing-alt.png')
  })

  it('warns before publication when images are missing an alt attribute', () => {
    const page = editor.Pages.getAll()[0]
    page.set('name', 'Home')
    const body = page.getMainComponent()
    const [missingAltImage] = body.components().add([
      { tagName: 'img', attributes: { src: '/missing-alt.png' } },
      { tagName: 'img', attributes: { src: '/decorative.png', alt: '' } },
    ])
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    const checkSeoTags = (manager as unknown as {
      checkSeoTags(siteSettings: WebsiteSettings): void
    }).checkSeoTags.bind(manager)
    const runCommand = jest.spyOn(editor, 'runCommand')

    checkSeoTags({})

    expect(runCommand).toHaveBeenCalledWith('notifications:add', expect.objectContaining({
      id: `seo-validation-alt-${missingAltImage.getId()}`,
      componentId: missingAltImage.getId(),
      group: 'seo-validation',
    }))
  })

  it('creates one notification per image missing alt and uses seo-validation group', () => {
    const page = editor.Pages.getAll()[0]
    page.set('name', 'Gallery')
    const body = page.getMainComponent()
    const components = body.components().add([
      { tagName: 'img', attributes: { src: '/no-alt-1.png' } },
      { tagName: 'img', attributes: { src: '/no-alt-2.png' } },
      { tagName: 'img', attributes: { src: '/no-alt-3.png' } },
      { tagName: 'img', attributes: { src: '/has-alt.png', alt: 'Photo' } },
      { tagName: 'img', attributes: { src: '/decorative.png', alt: '' } },
    ])
    const missingAlt1 = components[0]
    const missingAlt2 = components[1]
    const missingAlt3 = components[2]
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    const checkSeoTags = (manager as unknown as {
      checkSeoTags(siteSettings: WebsiteSettings): void
    }).checkSeoTags.bind(manager)
    const runCommand = jest.spyOn(editor, 'runCommand')

    checkSeoTags({})

    // One notification per missing-alt image
    const altCalls = (runCommand.mock.calls as unknown as [string, Record<string, unknown>][]).filter(
      ([cmd, opts]) => cmd === 'notifications:add' && typeof opts.id === 'string' && opts.id.startsWith('seo-validation-alt-')
    )
    expect(altCalls).toHaveLength(3)

    // Each notification references the correct image and uses seo-validation group
    for (const img of [missingAlt1, missingAlt2, missingAlt3]) {
      expect(runCommand).toHaveBeenCalledWith('notifications:add', expect.objectContaining({
        id: `seo-validation-alt-${img.getId()}`,
        componentId: img.getId(),
        group: 'seo-validation',
        type: 'warning',
      }))
    }

    // Images with alt text or alt="" must not produce a notification
    const allAltIds = altCalls.map(([, opts]) => opts.componentId)
    expect(allAltIds).not.toContain(components[3].getId())
    expect(allAltIds).not.toContain(components[4].getId())
  })

  it('does not duplicate notifications when validation runs again', () => {
    const page = editor.Pages.getAll()[0]
    page.set('name', 'Home')
    const body = page.getMainComponent()
    body.components().add([
      { tagName: 'img', attributes: { src: '/no-alt.png' } },
    ])
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    const checkSeoTags = (manager as unknown as {
      checkSeoTags(siteSettings: WebsiteSettings): void
    }).checkSeoTags.bind(manager)
    const runCommand = jest.spyOn(editor, 'runCommand')

    // Run validation twice
    checkSeoTags({})
    checkSeoTags({})

    // Each call produces notifications with the same IDs, so the notification
    // manager will replace (not duplicate) them via the id-based dedup
    const altCalls = (runCommand.mock.calls as unknown as [string, Record<string, unknown>][]).filter(
      ([cmd, opts]) => cmd === 'notifications:add' && typeof opts.id === 'string' && opts.id.startsWith('seo-validation-alt-')
    )
    // The command is called twice (once per run) with the same id,
    // meaning the notification manager replaces rather than duplicates
    expect(altCalls).toHaveLength(2)
    expect(altCalls[0][1].id).toBe(altCalls[1][1].id)
  })

  it('handles many images: every image missing alt produces a unique warning', () => {
    const page = editor.Pages.getAll()[0]
    page.set('name', 'Gallery')
    const body = page.getMainComponent()
    const missingCount = 50
    const accessibleCount = 10
    const imgDefs: { tagName: string; attributes: Record<string, string> }[] = []
    for (let i = 0; i < missingCount; i++) {
      imgDefs.push({ tagName: 'img', attributes: { src: `/no-alt-${i}.png` } })
    }
    for (let i = 0; i < accessibleCount; i++) {
      imgDefs.push({ tagName: 'img', attributes: { src: `/has-alt-${i}.png`, alt: `Photo ${i}` } })
    }
    body.components().add(imgDefs)
    const manager = new PublicationManager(editor, { websiteId: 'test' })
    const checkSeoTags = (manager as unknown as {
      checkSeoTags(siteSettings: WebsiteSettings): void
    }).checkSeoTags.bind(manager)
    const runCommand = jest.spyOn(editor, 'runCommand')

    checkSeoTags({})

    const altCalls = (runCommand.mock.calls as unknown as [string, Record<string, unknown>][]).filter(
      ([cmd, opts]) => cmd === 'notifications:add' && typeof opts.id === 'string' && (opts.id as string).startsWith('seo-validation-alt-')
    )
    // One notification per missing-alt image
    expect(altCalls).toHaveLength(missingCount)

    // All IDs are unique
    const ids = altCalls.map(([, opts]) => opts.id)
    expect(new Set(ids).size).toBe(missingCount)
  })
})
