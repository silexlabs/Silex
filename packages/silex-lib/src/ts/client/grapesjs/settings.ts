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

import {html, render, TemplateResult} from 'lit-html'
import {defaultSections, idCodeWrapper, isSite, SettingsSection} from './settings-sections'

/**
 * @fileoverview This file contains the settings dialog. The config API lets plugins add sections to the settings dialog.
 */

import { WebsiteData, WebsiteSettings } from '../../types'
import { ClientEvent } from '../events'
import { SILEX_VERSION } from '../../constants'
import { Button, Editor } from 'grapesjs'

const sectionsSite: SettingsSection[] = [...defaultSections]
const sectionsPage: SettingsSection[] = [...defaultSections]

const el: HTMLDivElement = document.createElement('div')
let modal: any | undefined // the modal var should be of type ModalModule, not Modal, but it is not exported from grapesjs
let settingsState: {
  isOpen: boolean
  title: string
  page: unknown
  sectionId?: string
  sender?: Button
} | null = null
let customSettingsDialog: HTMLDivElement | null = null

export const cmdOpenSettings = 'open-settings'
export const cmdAddSection = 'settings:add-section'
export const cmdRemoveSection = 'settings:remove-section'

export interface AddSectionOption {
  section: SettingsSection,
  siteOrPage: 'site' | 'page',
  position: 'first' | 'last' | number
}

let headEditor: ReturnType<Editor['CodeManager']['createViewer']> | null = null


function createCustomSettingsDialog(editor: Editor, opts: Record<string, unknown>, page: unknown, sectionId?: string): HTMLDivElement {
  const dialog = document.createElement('div')
  dialog.className = 'settings-dialog gjs-two-color'
  dialog.innerHTML = `
    <div class="settings-content gjs-mdl-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="settings-header">
        <h3 id="settings-title">${page ? 'Page settings' : 'Site Settings'}</h3>
        <button type="button" class="settings-close" title="Close" aria-label="Close settings">×</button>
      </div>
      <div class="settings-body"></div>
    </div>
  `

  // Handle close button
  const closeButton = dialog.querySelector('.settings-close') as HTMLButtonElement
  closeButton.addEventListener('click', () => {
    closeCustomSettingsDialog(editor)
  })

  // Handle keyboard shortcuts
  dialog.addEventListener('keydown', (e: KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      closeCustomSettingsDialog(editor)
      return
    }

    // Save on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      const form = dialog.querySelector('form') as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
      return
    }

    // Handle Alt+C (Cancel) and Alt+A (Apply)
    if (e.altKey) {
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        closeCustomSettingsDialog(editor)
        return
      }
      if (e.key.toLowerCase() === 'a') {
        e.preventDefault()
        const form = dialog.querySelector('form') as HTMLFormElement
        if (form) {
          form.requestSubmit()
        }
        return
      }
    }
  })

  // Add content
  displaySettings(editor, opts, page, sectionId)
  const body = dialog.querySelector('.settings-body') as HTMLDivElement
  body.appendChild(el)

  // Initialize focus when dialog opens
  setTimeout(() => {
    const firstTab = dialog.querySelector('.silex-list--menu li[role="button"]') as HTMLElement
    if (firstTab) {
      firstTab.focus()
    }
  }, 100)

  // Handle form submission
  const form = el.querySelector('form') as HTMLFormElement
  form.onsubmit = (event: Event) => {
    event.preventDefault()
    editor.trigger(ClientEvent.SETTINGS_SAVE_START, page)
    saveSettings(editor, opts, page)
    editor.trigger(ClientEvent.SETTINGS_SAVE_END, page)
    closeCustomSettingsDialog(editor, false)
  }

  return dialog
}

function closeCustomSettingsDialog(editor: Editor, fromCommand = false) {
  if (customSettingsDialog) {
    customSettingsDialog.remove()
    customSettingsDialog = null
  }
  settingsState?.sender?.set && settingsState.sender.set('active', 0)

  // Only call stopCommand if not already being called from the command's stop method
  if (!fromCommand) {
    editor.stopCommand(cmdOpenSettings)
  }

  settingsState = null
  editor.trigger(ClientEvent.SETTINGS_CLOSE)
}

function reopenSettingsModal(editor: Editor, opts: Record<string, unknown>) {
  if (!settingsState) {
    return
  }

  modal = editor.Modal.open({
    title: settingsState.title,
    content: '',
    attributes: { class: 'settings-dialog' },
  })
    .onceClose(() => {
      settingsState?.sender?.set && settingsState.sender.set('active', 0)
      editor.stopCommand(cmdOpenSettings)
      settingsState = null
    })

  displaySettings(editor, opts, settingsState.page, settingsState.sectionId)
  modal.setContent(el)

  const form = el.querySelector('form') as HTMLFormElement
  form.onsubmit = (event: Event) => {
    event.preventDefault()
    editor.trigger(ClientEvent.SETTINGS_SAVE_START, settingsState?.page)
    saveSettings(editor, opts, settingsState?.page)
    editor.trigger(ClientEvent.SETTINGS_SAVE_END, settingsState?.page)
    editor.stopCommand(cmdOpenSettings)
  }
}

export const settingsDialog = (
  editor: Editor,
  opts: Record<string, unknown>
): void => {
  // No need to override Modal system - we use custom dialog

  editor.Commands.add(cmdOpenSettings, {
    run: (
      _: Editor,
      sender: Button,
      {page, sectionId}: {page?: unknown, sectionId?: string}
    ) => {
      const title = page ? 'Page settings' : 'Site Settings'

      // Store settings state
      settingsState = {
        isOpen: true,
        title,
        page,
        sectionId,
        sender
      }

      // Create and show custom dialog instead of using GrapesJS modal
      customSettingsDialog = createCustomSettingsDialog(editor, opts, page, sectionId)
      document.body.appendChild(customSettingsDialog)

      // Let the first focusable element get focus naturally

      editor.trigger(ClientEvent.SETTINGS_OPEN, page)
      return customSettingsDialog
    },
    stop: (): void => {
      closeCustomSettingsDialog(editor, true)
    },
  })
  editor.Commands.add(cmdAddSection, (_editor: Editor, _sender: Button, options: AddSectionOption): void => {
    addSection(options.section, options.siteOrPage, options.position)
  })
  editor.Commands.add(cmdRemoveSection, (_editor: Editor, _sender: Button, options: AddSectionOption): void => {
    removeSection(options.section.id, options.siteOrPage)
  })
  editor.on('storage:start:store', (data: WebsiteData): void => {
    data.settings = editor.getModel().get('settings')
    /* @ts-ignore FIXME: this should not be there? or is it used on the server side in the sotrage providers? */
    data.name = editor.getModel().get('name')
  })
  editor.on('storage:end:load', (data: WebsiteData): void => {
    const model = editor.getModel()
    model.set('settings', data.settings || {})
    model.set('name', editor.getModel().get('name'))
  })
  editor.on('canvas:frame:load', (): void => {
    updateDom(editor)
  })
  editor.on('page', (_e: unknown): void => {
    updateDom(editor)
  })
  headEditor = editor.CodeManager.createViewer({
    readOnly: false,
    codeName: 'htmlmixed',
    lineNumbers: true,
    lineWrapping: true,
    autoFormat: false,
  })
}

function showSection(item: SettingsSection): void {
  const aside = el.querySelector('aside.silex-bar') as HTMLElement
  const ul = aside.querySelector('ul.silex-list--menu') as HTMLUListElement
  const li = ul.querySelector('li#settings-sidebar-' + item.id) as HTMLLIElement
  currentSection = item
  if(!li) {
    console.warn('Cannot find section', item.id, 'in the side bar, fallback to the first section')
    if(!defaultSections[0] || defaultSections[0].id === item.id) {
      console.error('Cannot find the default section in the side bar')
      return
    }
    showSection(defaultSections[0])
    return
  }
  Array.from(ul.querySelectorAll('.active')).forEach(el => el.classList.remove('active'))
  li.classList.add('active')

  const main = el.querySelector('main#settings__main') as HTMLElement
  const mainItem = main.querySelector(`#settings-${item.id}`)
  if(!mainItem) {
    console.warn('Cannot find section', item.id, 'in the settings dialog, fallback to the first section')
    if(!defaultSections[0] || defaultSections[0].id === item.id) {
      console.error('Cannot find the default section in the settings dialog')
      return
    }
    showSection(defaultSections[0])
    return
  }
  Array.from(main.querySelectorAll('.silex-hideable')).forEach(el => el.classList.add('silex-hidden'))
  mainItem.classList.remove('silex-hidden')
  headEditor?.refresh()
}

export function addSection(
  section: SettingsSection,
  siteOrPage: 'site' | 'page',
  position: 'first' | 'last' | number
): void {
  const sections = siteOrPage === 'site' ? sectionsSite : sectionsPage
  if (position === 'first') {
    sections.unshift(section)
  } else if (position === 'last') {
    sections.push(section)
  } else if (typeof position === 'number') {
    sections.splice(position, 0, section)
  } else {
    throw new Error('Invalid position for settings section')
  }
}

export function removeSection(
  id: string,
  siteOrPage: 'site' | 'page'
): void {
  const sections = siteOrPage === 'site' ? sectionsSite : sectionsPage
  const index = sections.findIndex(section => section.id === id)
  if(index === -1) throw new Error(`Cannot find section with id ${id}`)
  sections.splice(index, 1)
}


let currentSection: SettingsSection | undefined
function displaySettings(
  editor: Editor,
  config: Record<string, unknown>,
  model: any = editor.getModel(),
  sectionId?: string
): void {
  const settings: WebsiteSettings = model.get('settings') || {} as WebsiteSettings
  model.set('settings', settings)
  const menuItemsCurrent: SettingsSection[] = isSite(model) ? sectionsSite : sectionsPage
  const targetSection = !!sectionId && menuItemsCurrent.find(section => section.id === sectionId)
  currentSection = targetSection || currentSection || menuItemsCurrent[0]
  const sections: TemplateResult[] = menuItemsCurrent.map(item => {
    try {
      return item.render(settings, model)
    } catch (e) {
      console.error('Error rendering settings section', item.id, e)
      return html`<div class="silex-error">Error rendering settings section ${item.id}</div>`
    }
  })
  render(html`
    <form class="silex-form">
      <section class="silex-sidebar-dialog">
        <aside class="silex-bar">
          <ul class="silex-list silex-list--menu" aria-label="Settings sections">
            ${menuItemsCurrent.map((item, index) => html`
              <li
                id="settings-sidebar-${item.id}"
                class=${item.id === currentSection!.id ? 'active' : ''}
                role="button"
                tabindex="0"
                @click=${(e: Event) => {
    e.preventDefault()
    showSection(item)
    editor.trigger(ClientEvent.SETTINGS_SECTION_CHANGE, item.id)
  }}
                @keydown=${(e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      showSection(item)
      editor.trigger(ClientEvent.SETTINGS_SECTION_CHANGE, item.id)
    }
  }}
              >
                ${item.label}
              </li>
            `)}
          </ul>
        </aside>
        <main id="settings__main">
            ${ sections }
        </main>
      </section>
      <footer role="contentinfo">
        <p class="silex-version">Silex ${SILEX_VERSION}</p>
        <input class="silex-button" type="button" value="Cancel" @click=${() => editor.stopCommand(cmdOpenSettings)} accesskey="c">
        <input class="silex-button" type="submit" value="Apply" accesskey="a">
      </footer>
    </form>
  `, el)
  showSection(currentSection!)
  el.querySelector(`#${idCodeWrapper}`)?.appendChild(headEditor!.getElement())
  headEditor!.setContent(settings.head || '')
}

function saveSettings(
  editor: Editor,
  config: Record<string, unknown>,
  model: any = editor.getModel()
): void {
  const form = el.querySelector('form') as HTMLFormElement
  const formData = new FormData(form)
  const data = Array.from(formData)
    .reduce((aggregate: {[key: string]: any}, [key, value]) => {
      if(value !== '') {
        aggregate[key] = value
      }
      return aggregate
    }, {})
  const { name, ...settings } = data
  model.set({
    settings: {
      ...data,
      head: headEditor!.getContent(),
    },
    name,
  })
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
  updateDom(editor)
}
function getHeadContainer(doc: Document, className: string): HTMLElement {
  const container = doc.head.querySelector(`.${className}`) as HTMLElement | null
  if(container) {
    return container
  }
  const newContainer = doc.createElement('div')
  newContainer.classList.add(className)
  doc.head.appendChild(newContainer)
  return newContainer
}
function updateDom(editor: Editor): void {
  const doc = editor.Canvas.getDocument()
  const settings = editor.getModel().get('settings')
  const pageSettings = editor.Pages.getSelected().get('settings') as WebsiteSettings
  if(doc && settings) {
    setTimeout(() => {
      getHeadContainer(doc, 'site-head')
        .innerHTML = settings.head || ''
      getHeadContainer(doc, 'page-head')
        .innerHTML = pageSettings?.head || ''
    })
  }
}
