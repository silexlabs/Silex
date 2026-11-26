import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import grapesjs, { Editor, Page } from 'grapesjs'
import { render } from 'lit-html'
import dataSourcePlugin, { getOrCreatePersistantId, setState, type StoredToken } from '@silexlabs/grapesjs-data-source'
import './settings'
import { defaultSections } from './settings-sections'

const fixed = (value: string): StoredToken => ({ type: 'property', propType: 'field', fieldId: 'fixed', label: 'Fixed value', kind: 'scalar', typeIds: ['String'], options: { value } })
const originalResizeObserver = window.ResizeObserver

describe('General page permalink', () => {
  let editor: Editor
  let page: Page
  let form: HTMLFormElement

  beforeEach(() => {
    editor = grapesjs.init({ headless: true, storageManager: false })
    editor.getModel().set('config', { cmsConfig: { enabled: false } })
    page = editor.Pages.getSelected()!
    form = document.createElement('form')
    document.body.append(form)
  })

  afterEach(() => {
    form.remove()
    editor.destroy()
    jest.restoreAllMocks()
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: originalResizeObserver })
  })

  function show(eleventyPermalink?: string) {
    render(defaultSections[0].render({ eleventyPermalink }, page, editor), form)
  }

  it.each(['about/team', '', '0', '999999999999999999999999'])('saves "%s" without the expression plugin', value => {
    show()
    expect(form.querySelector('state-editor')).toBeNull()
    const input = form.querySelector<HTMLInputElement>('#permalink-text')!
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const saved = new FormData(form).get('eleventyPermalink') as string
    expect(JSON.parse(saved)).toEqual(value ? [fixed(value)] : [])
    show(saved)
    expect(input.value).toBe(value)
  })

  it('keeps an existing fixed permalink and resets an unsaved edit when reopened', () => {
    const saved = JSON.stringify([fixed('/existing/')])
    show(saved)
    const input = form.querySelector<HTMLInputElement>('#permalink-text')!
    expect(input.value).toBe('/existing/')
    input.value = '/unsaved/'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    show(saved)
    expect(input.value).toBe('/existing/')
    expect(new FormData(form).get('eleventyPermalink')).toBe(saved)
  })

  it('preserves a saved dynamic expression while expression editing is disabled', () => {
    const saved = JSON.stringify([{ type: 'property', propType: 'field', fieldId: 'slug', dataSourceId: 'posts' }])
    show(saved)
    expect(form.querySelector<HTMLInputElement>('#permalink-text')!.disabled).toBe(true)
    expect(new FormData(form).get('eleventyPermalink')).toBe(saved)
    expect(form.textContent).toContain('Expression editing is unavailable')
  })

  it('defaults to fixed text and retains saved expressions when expressions are enabled', async () => {
    // jsdom does not provide layout observers used by the expression popovers.
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } })
    editor.getModel().set('config', { cmsConfig: { enabled: true } })
    jest.spyOn(console, 'info').mockImplementation(() => {})
    dataSourcePlugin(editor, { view: { el: undefined } })
    show()
    const field = form.querySelector('state-editor') as HTMLElement & { updateComplete: Promise<boolean>, value: string }
    await field.updateComplete
    const expression = field.shadowRoot!.querySelector('expression-input') as HTMLElement & { fixed: boolean, updateComplete: Promise<boolean> }
    await expression.updateComplete
    expect(expression.fixed).toBe(true)

    show(JSON.stringify([{ ...fixed('about/team'), typeIds: ['string'] }]))
    await field.updateComplete
    await expression.updateComplete
    const input = expression.querySelector<HTMLInputElement>('input')!
    expect(input.value).toBe('about/team')
    input.value = ''
    show('[]')
    await field.updateComplete
    await expression.updateComplete
    expect(field.shadowRoot!.querySelector('.ds-real-data__display')!.textContent!.trim()).toBe('')

    const body = page.getMainComponent()
    const componentId = getOrCreatePersistantId(body)
    setState(body, 'address', { label: 'Address', expression: [{ ...fixed('article'), typeIds: ['string'] } as StoredToken] })
    const saved = JSON.stringify([{ type: 'state', storedStateId: 'address', componentId, exposed: true, label: 'Address' }])
    show(saved)
    await field.updateComplete
    await expression.updateComplete
    expect(expression.fixed).toBe(false)
    expect(JSON.parse(field.value)).toMatchObject(JSON.parse(saved))
  })

  it('does not show a page permalink in site settings', () => {
    render(defaultSections[0].render({}, editor as any, editor), form)
    expect(form.querySelector('[name="eleventyPermalink"]')).toBeNull()
  })
})
