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

  const input = (traitsBox: HTMLElement, name: string) =>
    traitsBox.querySelector(`.gjs-trt-trait__wrp-${name} input`) as HTMLInputElement | null

  function typeAlt(traitsBox: HTMLElement, value: string) {
    const altInput = input(traitsBox, 'alt')
    expect(altInput).not.toBeNull()
    if (altInput) {
      altInput.value = value
      altInput.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  function toggleDecorative(traitsBox: HTMLElement, checked: boolean) {
    const checkbox = input(traitsBox, 'decorative')
    expect(checkbox).not.toBeNull()
    if (checkbox) {
      checkbox.checked = checked
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  it('checking the box publishes alt="" and greys out the alt field', () => {
    const { img, traitsBox } = setup('A described image')
    const checkbox = input(traitsBox, 'decorative')
    const altInput = input(traitsBox, 'alt')
    expect(checkbox instanceof HTMLInputElement).toBe(true)
    expect(checkbox?.checked).toBe(false)
    expect(altInput?.disabled).toBe(false)
    toggleDecorative(traitsBox, true)
    expect(img.getAttributes().alt).toBe('')
    expect(img.toHTML()).toContain('alt=""')
    expect(altInput?.disabled).toBe(true)
    traitsBox.remove()
  })

  it('an image already published with alt="" shows as checked', () => {
    const { traitsBox } = setup('')
    expect(input(traitsBox, 'decorative')?.checked).toBe(true)
    traitsBox.remove()
  })

  it('unchecking the box removes the alt attribute', () => {
    const { img, traitsBox } = setup('')
    toggleDecorative(traitsBox, false)
    expect(Object.prototype.hasOwnProperty.call(img.getAttributes(), 'alt')).toBe(false)
    expect(img.toHTML()).not.toContain('alt=')
    expect(input(traitsBox, 'alt')?.disabled).toBe(false)
    traitsBox.remove()
  })

  it('clearing the alt field removes the attribute instead of publishing alt=""', () => {
    const { img, traitsBox } = setup('A described image')
    typeAlt(traitsBox, '')
    expect(img.getAttributes().alt).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(img.getAttributes(), 'alt')).toBe(false)
    traitsBox.remove()
  })

  it('typing then clearing the alt field leaves the image non-decorative', () => {
    const { img, traitsBox } = setup(undefined)
    typeAlt(traitsBox, 'A described image')
    expect(img.getAttributes().alt).toBe('A described image')
    typeAlt(traitsBox, '')
    expect(Object.prototype.hasOwnProperty.call(img.getAttributes(), 'alt')).toBe(false)
    expect(input(traitsBox, 'decorative')?.checked).toBe(false)
    traitsBox.remove()
  })
})
