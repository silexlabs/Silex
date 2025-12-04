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

import { ConnectorId, WebsiteId, WebsiteData, ConnectorUser, ConnectorType, ApiError } from '../../types'
import { websiteLoad, websiteSave } from '../api'
import { cmdLogin, eventLoggedIn, eventLoggedOut, getCurrentUser, updateUser } from './LoginDialog'
import { addTempDataToAssetUrl, addTempDataToStyles, removeTempDataFromAssetUrl, removeTempDataFromStyles } from '../assetUrl'
import { PublicationStatus, PublishableEditor } from './PublicationManager'
import { ClientEvent } from '../events'
import { Page, PageProperties, ProjectData } from 'grapesjs'
import { html, render, TemplateResult } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'

export const cmdPauseAutoSave = 'pause-auto-save'

const loader = document.querySelector('.silex-loader') as HTMLDivElement

function renderLoader(text: string, current: number, total: number) {
  if (loader) {
    render(getLoaderHtml(text, current, total), loader)
  }
}

if (loader) {
  loader.innerHTML = ''
  renderLoader('Loading', 0, 0)
  setTimeout(() => loader.classList.add('silex-loader--active'))
}

function getLoaderHtml(text: string, current: number, total: number): TemplateResult {
  return html`
    <div class="silex-loader__text">
      <div>${ unsafeHTML(text) }</div>
      <progress
        class="silex-loader__progress"
        max="${total}" value="${current}"></progress>
    </div>
  `
}

// Wait for the next frame to avoid blocking the main thread
function nextFrame(): Promise<void> {
  const fn = window.requestIdleCallback ?? window.requestAnimationFrame
  return new Promise(resolve => fn(() => resolve()))
}

// Mechanism to keep only the last save during publication
let lastPendingSaving: WebsiteData = null

// Mechanism to avoid concurrent saving
// Note: there is already such a mechanism in grapesjs but it fails when the save is delayed by the publication
let isSaving = false

export const storagePlugin = (editor: PublishableEditor) => {
  // Add useful commands
  editor.Commands.add(cmdPauseAutoSave, {
    run: () => {
      if(!editor.StorageManager.isAutosave()) console.warn('Autosave is not enabled')
      editor.StorageManager.setAutosave(false)
    },
    stop: () => {
      if(editor.StorageManager.isAutosave()) console.warn('Autosave is already enabled')
      editor.editor.set('changesCount', 0)
      editor.UndoManager.clear()
      editor.StorageManager.setAutosave(true)
    },
  })
  // Add the storage connector
  editor.Storage.add('connector', {
    async load(options: { id: WebsiteId, connectorId: ConnectorId, mode: '' | 'progressive' }): Promise<ProjectData> {
      try {
        renderLoader('Loading user data', 0, 3)
        await nextFrame()
        const user: ConnectorUser = await getCurrentUser(editor) ?? await updateUser(editor, ConnectorType.STORAGE, options.connectorId)
        if (!user) throw new ApiError('Not logged in', 401)
        renderLoader('Loading website', 1, 3)
        await nextFrame()
        const data = await websiteLoad({ websiteId: options.id, connectorId: user.storage.connectorId }) as WebsiteData
        editor.runCommand(cmdPauseAutoSave)
        if (data.assets) data.assets = addTempDataToAssetUrl(data.assets, options.id, user.storage.connectorId)
        if (data.styles) data.styles = addTempDataToStyles(data.styles, options.id, user.storage.connectorId)
        if (options.mode == 'progressive') {
          if (!data.pages) {
            // This happens when the website was just created
            // Let grapesjs create the pages in the frontend
          } else {
            const { pages, pagesFolder, ...rest } = data
            // Load any additional project data, e.g. symbols, but not the ones we progressive load
            renderLoader('Loading styles, assets and symbols', 0, pages.length + 1)
            await nextFrame()
            // Add to the project, everything but pages
            editor.loadProjectData(rest)
            editor.getModel().set('pagesFolder', pagesFolder)
            // Add the pages to the project
            await progressiveLoadPages(editor, pages)
            await nextFrame()
            // Trigger symbol update to recount instances now that pages are loaded
            editor.trigger('symbol')
            await nextFrame()
            // Select the first page
            const firstPage = editor.Pages.getAll()[0]
            if (firstPage) editor.Pages.select(firstPage)
          }
        }
        // Always return the full data in the end
        renderLoader('Starting', 1, 1)
        await nextFrame()
        editor.once('canvas:frame:load', () => {
          setTimeout(() => { // This is needed in chrome, otherwise a save is triggered
            editor.stopCommand(cmdPauseAutoSave)
          }, 500)
        })
        return data
      } catch (err) {
        editor.UndoManager.clear()
        if (err.httpStatusCode === 401) {
          editor.once(eventLoggedIn, async () => {
            try {
              await editor.Storage.load(options)
            } catch (err) {
              console.error('connectorPlugin load error', err)
              throw err
            }
          })
          editor.Commands.run(cmdLogin)
        }
        console.error('connectorPlugin load error', err)
        throw err
      }
    },

    async store(data: WebsiteData, options: { id: WebsiteId, connectorId: ConnectorId }) {
      // Be sure that it is immutable
      const myData = { ...data }
      return await this.addToQueue(myData, options)
    },

    async addToQueue(data: WebsiteData, options: { id: WebsiteId, connectorId: ConnectorId }) {
      // Handle concurrent saving
      if (lastPendingSaving && lastPendingSaving !== data) {
        // Cancel previous saving
      }
      lastPendingSaving = data
      // Go ahaed and save
      return this.doStore(lastPendingSaving, options)
    },

    async doStore(data: WebsiteData, options: { id: WebsiteId, connectorId: ConnectorId }) {
      if (editor.PublicationManager?.status === PublicationStatus.STATUS_PENDING) {
        // Publication is pending, save is delayed
        return new Promise((resolve) => {
          editor.once(ClientEvent.PUBLISH_END, () => {
            resolve(this.doStore(data, options))
          })
        })
      }
      try {
        if (isSaving) {
          // Concurrent saving, save is delayed
          editor.once('storage:start:store', () => {
            this.doStore(data, options)
          })
        } else {
          if (lastPendingSaving === data) {
            lastPendingSaving = null
            isSaving = true
            const user = await getCurrentUser(editor)
            if (user) {
              data.assets = removeTempDataFromAssetUrl(data.assets)
              data.styles = removeTempDataFromStyles(data.styles)
              data.pagesFolder = editor.getModel().get('pagesFolder')
              await websiteSave({ websiteId: options.id, connectorId: user.storage.connectorId, data })
              isSaving = false
            } else {
              // Not logged in save is delayed
              editor.once(eventLoggedIn, () => {
                isSaving = false
                return editor.Storage.store(data, options)
              })
              editor.Commands.run(cmdLogin)
            }
          } else {
            // Canceled saving
          }
        }
      } catch (err) {
        console.error('connectorPlugin store error', err)
        isSaving = false
        throw err
      }
    }
  })
  // Handle errors
  editor.on('storage:error:load', (err: Error) => {
    handleError(err)
  })
  editor.on('storage:error:store', (err: Error) => {
    handleError(err)
  })
  editor.on('asset:upload:end', (err: Error) => {
    editor.store()
  })
  editor.on('asset:upload:error', (err: Error) => {
    handleError(err)
  })
  function handleError(_err: Error | string) {
    const err: Error = typeof _err === 'string' ? JSON.parse(_err) : _err
    console.error('Error with loading or saving website or uploading asset', err, err instanceof ApiError)
    if (err instanceof ApiError) {
      console.error('ApiError', err.httpStatusCode, err.message)
      switch (err.httpStatusCode) {
      case 404:
        return editor.Modal.open({
          title: 'Website not found',

          content: `This website could not be found.<br><hr>${err.message}`,
        })
      case 403:
        return editor.Modal.open({
          title: 'Access denied',
          content: `You are not allowed to access this website.<br><hr>${err.message}`,
        })
      case 401:
        editor.trigger(eventLoggedOut)
        return
      default:
        return editor.Modal.open({
          title: 'Error',
          content: `An error occured.<br>${err.message}`,
        })
      }
    } else {
      return editor.Modal.open({
        title: 'Error',
        content: `An error occured.<br>${err.message}`,
      })
    }
  }
}

async function progressiveLoadPages(editor: PublishableEditor, pages: Page[]) {
  editor.Pages.getAll().forEach(page => editor.Pages.remove(page))
  let i = 0
  for (const page of pages) {
    renderLoader(`Loading page <strong>${++i}</strong> / ${pages.length + 1}`, i, pages.length + 1)
    await nextFrame()
    const newPage = editor.Pages.add({
      ...page,
    } as PageProperties)
  }
}
