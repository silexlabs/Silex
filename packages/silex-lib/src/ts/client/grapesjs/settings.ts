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

const sectionsSite = [...defaultSections]
const sectionsPage = [...defaultSections]

const el = document.createElement('div')
let modal

export const cmdOpenSettings = 'open-settings'
export const cmdAddSection = 'settings:add-section'
export const cmdRemoveSection = 'settings:remove-section'

export interface AddSectionOption {
  section: SettingsSection,
  siteOrPage: 'site' | 'page',
  position: 'first' | 'last' | number
}

let headEditor = null
export const settingsDialog = (editor, opts) => {
  editor.Commands.add(cmdOpenSettings, {
    run: (_: Editor, sender: Button, {page, sectionId}) => {
      modal = editor.Modal.open({
        title: page ? 'Page settings' : 'Site Settings',
        content: '',
        attributes: { class: 'settings-dialog' },
      })
        .onceClose(() => {
          sender?.set && sender.set('active', 0) // Deactivate the button to make it ready to be clicked again, only in case of a grapesjs button (not in the pages panel)
          editor.stopCommand(cmdOpenSettings) // apparently this is needed to be able to run the command several times
        })
      displaySettings(editor, opts, page, sectionId)
      modal.setContent(el)
      const form = el.querySelector('form')
      form.onsubmit = event => {
        event.preventDefault()
        editor.trigger(ClientEvent.SETTINGS_SAVE_START, page)
        saveSettings(editor, opts, page)
        editor.trigger(ClientEvent.SETTINGS_SAVE_END, page)
        editor.stopCommand(cmdOpenSettings)
      }
      form.querySelector('input')?.focus()
      // Notify other plugins
      editor.trigger(ClientEvent.SETTINGS_OPEN, page)
      // Return the dialog
      return modal
    },
    stop: () => {
      modal.close()
      editor.trigger(ClientEvent.SETTINGS_CLOSE)
    },
  })
  // Register the addSection function as a GrapesJS command
  editor.Commands.add(cmdAddSection, (_editor: Editor, _sender: Button, options: AddSectionOption) => {
    addSection(options.section, options.siteOrPage, options.position)
  })
  editor.Commands.add(cmdRemoveSection, (_editor: Editor, _sender: Button, options: AddSectionOption) => {
    removeSection(options.section, options.siteOrPage)
  })
  // add settings to the website
  editor.on('storage:start:store', (data: WebsiteData) => {
    data.settings = editor.getModel().get('settings')
    /* @ts-ignore FIXME: this should not be there? or is it used on the server side in the sotrage providers? */
    data.name = editor.getModel().get('name')
  })
  editor.on('storage:end:load', (data) => {
    const model = editor.getModel()
    model.set('settings', data.settings || {})
    model.set('name', data.name)
  })
  // Normal way to apply the head content to the DOM
  // fix #1559 Custom <head> code must be reapplied
  editor.on('canvas:frame:load', () => {
    updateDom(editor)
  })
  // When the page changes, update the dom
  editor.on('page', (e) => {
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

function showSection(item: SettingsSection) {
  // **
  // Handle the side bar
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
    showSection(defaultSections[0]) // Fallback to the first section
    return
  }
  // Update active
  Array.from(ul.querySelectorAll('.active')).forEach(el => el.classList.remove('active'))
  li.classList.add('active')
  // **
  // Handle the main section
  const main = el.querySelector('main#settings__main') as HTMLElement
  const mainItem = main.querySelector(`#settings-${item.id}`)
  if(!mainItem) {
    console.warn('Cannot find section', item.id, 'in the settings dialog, fallback to the first section')
    if(!defaultSections[0] || defaultSections[0].id === item.id) {
      console.error('Cannot find the default section in the settings dialog')
      return
    }
    showSection(defaultSections[0]) // Fallback to the first section
    return
  }
  // Update hidden
  Array.from(main.querySelectorAll('.silex-hideable')).forEach(el => el.classList.add('silex-hidden'))
  mainItem.classList.remove('silex-hidden')
  // This messes up with the save / cancel mechanism
  // displaySettings(editor, config, model)
  // Refresh the code editor just in case it went from hidden to visible
  // This makes it ready to be used when the user clicks on the tab
  headEditor.refresh()
}

export function addSection(section: SettingsSection, siteOrPage: 'site' | 'page', position: 'first' | 'last' | number) {
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

export function removeSection(id, siteOrPage: 'site' | 'page') {
  const sections = siteOrPage === 'site' ? sectionsSite : sectionsPage
  const index = sections.findIndex(section => section.id === id)
  if(index === -1) throw new Error(`Cannot find section with id ${id}`)
  sections.splice(index, 1)
}


let currentSection
function displaySettings(editor, config, model = editor.getModel(), sectionId?: string) {
  // Update the model with the current settings
  const settings = model.get('settings') || {} as WebsiteSettings
  model.set('settings', settings)
  // Get the current sections for page or site
  const menuItemsCurrent = isSite(model) ? sectionsSite : sectionsPage
  // Init the current section selection
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
  // Render the settings dialog
  render(html`
    <form class="silex-form">
      <div class="silex-help">
        ${isSite(model) ? html`
          <p>Here you can set the name of your website, SEO and social networks sharing data.</p>
          <p>These settings are overriden by the page settings, <a href="https://github.com/silexlabs/Silex/wiki/Settings" target="_blank">more info about settings here</a>.</p>
        ` : html`
          <p>Here you can set the name of your page, SEO and social networks sharing data.</p>
          <p>These settings override the site settings, <a href="https://github.com/silexlabs/Silex/wiki/Settings" target="_blank">more info about settings here</a>.</p>
        `}
      </div>
      <section class="silex-sidebar-dialog">
        <aside class="silex-bar">
          <ul class="silex-list silex-list--menu">
            ${menuItemsCurrent.map(item => html`
              <li
                id="settings-sidebar-${item.id}"
                class=${item.id === currentSection.id ? 'active' : ''}
                @click=${e => {
    e.preventDefault()
    // Show the new section
    showSection(item)
    // Notify other plugins
    editor.trigger(ClientEvent.SETTINGS_SECTION_CHANGE, item.id)
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
      <footer>
        <p class="silex-version">Silex ${SILEX_VERSION}</p>
        <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenSettings)} value="Cancel">
        <input class="silex-button" type="submit" value="Apply">
      </footer>
    </form>
  `, el)
  // Display the current section
  showSection(currentSection)
  // Init the code editor
  el.querySelector(`#${idCodeWrapper}`)?.appendChild(headEditor.getElement())
  headEditor.setContent(settings.head || '')
}

function saveSettings(editor, config, model = editor.getModel()) {
  const form = el.querySelector('form')
  const formData = new FormData(form)
  const data = Array.from(formData as any)
    .reduce((aggregate, [key, value]) => {
      // Keep only the values that are set
      if(value !== '') {
        aggregate[key] = value
      }
      return aggregate
    }, {}) as {[key: string]: any}
  // take the name out to the main model (by design in grapesjs pages)
  const { name, ...settings } = data
  model.set({
    settings: {
      ...data,
      head: headEditor.getContent(),
    },
    name,
  })
  // save if auto save is on
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
  // update the DOM
  updateDom(editor)
}
function getHeadContainer(doc, className) {
  const container = doc.head.querySelector(`.${className}`)
  if(container) {
    return container
  }
  const newContainer = doc.createElement('div')
  newContainer.classList.add(className)
  doc.head.appendChild(newContainer)
  return newContainer
}
function updateDom(editor) {
  const doc = editor.Canvas.getDocument()
  const settings = editor.getModel().get('settings')
  const pageSettings = editor.Pages.getSelected().get('settings')
  if(doc && settings) {
    // Delay the update to let the DOM be ready
    setTimeout(() => {
      // Site head
      getHeadContainer(doc, 'site-head')
        .innerHTML = settings.head || ''
      // Pages head
      getHeadContainer(doc, 'page-head')
        .innerHTML = pageSettings?.head || ''
    })
  } else {
    // No document??
  }
}
