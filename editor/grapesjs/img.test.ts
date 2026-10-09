/*
 * @jest-environment jsdom
 */
import { expect, jest, describe, it } from '@jest/globals'
import grapesjs, { Component, Editor } from 'grapesjs'
import imgPlugin from './img'

// Prevent lit-html from being imported (it is a peer dependency and breaks the tests)
jest.mock('lit-html', () => ({}))

describe('decorative image trait (#1891)', () => {
  function setup(alt: string | undefined) {
    /* @ts-ignore */
    const editor: Editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false },
      plugins: [imgPlugin],
    })
    const body = editor.Pages.getAll()[0].getMainComponent()
    const attributes: Record<string, string> = { src: '/b.png' }
    if (alt !== undefined) attributes.alt = alt
    const img = body.components().add({ type: 'image', attributes }) as Component
    const traitsBox = document.createElement('div')
    traitsBox.append(editor.TraitManager.render() as unknown as Node)
    document.body.append(traitsBox)
    const viewer = editor.TraitManager.getTraitsViewer() as unknown as { updatedCollection(): void }
    editor.select(img)
    viewer.updatedCollection()
    return { img, traitsBox }
  }

  it('checking the box publishes alt="" and greys out the alt field', () => {
    const { img, traitsBox } = setup('A described image')
    const checkbox = traitsBox.querySelector('.gjs-trt-trait__wrp-decorative input') as HTMLInputElement | null
    const altInput = traitsBox.querySelector('.gjs-trt-trait__wrp-alt input') as HTMLInputElement | null
    expect(checkbox instanceof HTMLInputElement).toBe(true)
    expect(checkbox?.checked).toBe(false)
    expect(altInput?.disabled).toBe(false)
    if (checkbox) {
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    }
    expect(img.getAttributes().alt).toBe('')
    expect(img.toHTML()).toContain('alt=""')
    expect(altInput?.disabled).toBe(true)
    traitsBox.remove()
  })

  it('an image already published with alt="" shows as checked', () => {
    const { traitsBox } = setup('')
    const checkbox = traitsBox.querySelector('.gjs-trt-trait__wrp-decorative input') as HTMLInputElement | null
    expect(checkbox?.checked).toBe(true)
    traitsBox.remove()
  })
})
