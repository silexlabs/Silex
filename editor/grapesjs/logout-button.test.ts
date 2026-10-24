import { afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { ConnectorType, ConnectorUser } from '~/common/types'
import { bindLogoutButtonVisibility } from './logout-button'
import { PROJECT_BAR_PANEL_ID } from './project-bar'

const iconClasses = 'page-panel-btn fa fa-fw fa-sign-out'
const editors: Editor[] = []

function user(disableLogout?: boolean, connectorId = 'fs-storage'): ConnectorUser {
  const result: ConnectorUser = {
    name: 'Test user',
    storage: {
      connectorId,
      type: ConnectorType.STORAGE,
      displayName: 'Test storage',
      icon: '',
      disableLogout,
      isLoggedIn: true,
      oauthUrl: null,
      color: '',
      background: '',
    },
  }
  if (disableLogout === undefined) delete result.storage.disableLogout
  return result
}

function setup(initialUser?: ConnectorUser | null) {
  const editor = grapesjs.init({
    headless: true,
    storageManager: false,
    panels: { defaults: [] },
  })
  editors.push(editor)
  const panel = editor.Panels.addPanel({
    id: PROJECT_BAR_PANEL_ID,
    buttons: [
      {
        id: 'logout-button',
        className: `${iconClasses} gjs-hidden`,
        attributes: { title: 'Sign out' },
        command: 'silex:auth:logout',
      },
      { id: 'other-button', className: 'other-icon', command: 'other-command' },
    ],
  })
  editor.getModel().set('user', initialUser)
  bindLogoutButtonVisibility(editor)
  const container = document.createElement('div')
  container.appendChild(editor.Panels.render())
  document.body.appendChild(container)
  const button = editor.Panels.getButton(PROJECT_BAR_PANEL_ID, 'logout-button')
  const element = panel.view.el.querySelector('[title="Sign out"]') as HTMLElement
  expect(element).not.toBeNull()
  return { editor, button, element }
}

beforeAll(() => {
  const style = document.createElement('style')
  // Load the actual GrapesJS stylesheet, so the assertion checks rendered hiding.
  style.textContent = readFileSync(createRequire(import.meta.url).resolve('grapesjs/dist/css/grapes.min.css'), 'utf8')
  document.head.appendChild(style)
})

afterEach(() => {
  editors.splice(0).forEach(editor => editor.destroy())
  document.body.innerHTML = ''
})

describe('Sign out visibility', () => {
  it.each([
    ['unavailable', undefined, 'none'],
    ['cleared', null, 'none'],
    ['logout disabled', user(true), 'none'],
  ])('hides Sign out when the initial user is %s', (_name, initialUser, display) => {
    const { element } = setup(initialUser as ConnectorUser | null | undefined)
    expect(getComputedStyle(element).display).toBe(display)
  })

  it.each([
    ['logout enabled', user(false)],
    ['the flag omitted', user(undefined)],
  ])('shows Sign out for an initial user with %s', (_name, initialUser) => {
    const { element } = setup(initialUser as ConnectorUser)
    expect(getComputedStyle(element).display).not.toBe('none')
  })

  it('updates the rendered button when user information arrives later', () => {
    const { editor, element } = setup()
    expect(getComputedStyle(element).display).toBe('none')
    editor.getModel().set('user', user(false))
    expect(getComputedStyle(element).display).not.toBe('none')
    editor.getModel().set('user', user(true))
    expect(getComputedStyle(element).display).toBe('none')
  })

  it('updates visibility when the user or active storage connector changes', () => {
    const { editor, element } = setup(user(false, 'remote-storage'))
    editor.getModel().set('user', user(true, 'fs-storage'))
    expect(getComputedStyle(element).display).toBe('none')
    editor.getModel().set('user', user(false, 'remote-storage'))
    expect(getComputedStyle(element).display).not.toBe('none')
  })

  it('hides Sign out when the user is cleared', () => {
    const { editor, element } = setup(user(false))
    editor.getModel().set('user', null)
    expect(getComputedStyle(element).display).toBe('none')
  })

  it('hides Sign out when storage information is unavailable', () => {
    const { editor, element } = setup(user(false))
    editor.getModel().set('user', { name: 'Incomplete user' })
    expect(getComputedStyle(element).display).toBe('none')
  })

  it('preserves icon classes, commands, and other buttons across repeated updates', () => {
    const { editor, button, element } = setup(user(false))
    const other = editor.Panels.getButton(PROJECT_BAR_PANEL_ID, 'other-button')
    const otherClasses = other.get('className')
    for (let i = 0; i < 3; i++) {
      editor.getModel().set('user', { ...user(true), name: `User ${i}` })
      expect(getComputedStyle(element).display).toBe('none')
      expect(element.className.split(/\s+/).filter(name => name === 'gjs-hidden')).toHaveLength(1)
      editor.getModel().set('user', { ...user(false), name: `User ${i}` })
      expect(getComputedStyle(element).display).not.toBe('none')
    }
    for (const className of iconClasses.split(' ')) expect(element.classList.contains(className)).toBe(true)
    expect(button.get('command')).toBe('silex:auth:logout')
    expect(other.get('className')).toBe(otherClasses)
    expect(other.get('command')).toBe('other-command')
  })

  it('allows editors without a Sign out button', () => {
    const editor = grapesjs.init({ headless: true, storageManager: false, panels: { defaults: [] } })
    editors.push(editor)
    expect(() => bindLogoutButtonVisibility(editor)).not.toThrow()
    expect(() => editor.getModel().set('user', user(true))).not.toThrow()
  })
})
