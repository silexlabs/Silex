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
import { ProjectData } from 'grapesjs'

export const cmdPauseAutoSave = 'pause-auto-save'

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
      if(!editor.StorageManager.isAutosave()) throw new Error('Autosave is not enabled')
      editor.StorageManager.setAutosave(false)
    },
    stop: () => {
      editor.editor.set('changesCount', 0)
      editor.UndoManager.clear()
      editor.StorageManager.setAutosave(true)
    },
  })
  // Add the storage connector
  editor.Storage.add('connector', {
    async load(options: { id: WebsiteId, connectorId: ConnectorId }): Promise<ProjectData> {
      try {
        const user: ConnectorUser = await getCurrentUser(editor) ?? await updateUser(editor, ConnectorType.STORAGE, options.connectorId)
        if (!user) throw new ApiError('Not logged in', 401)
        const data = await websiteLoad({ websiteId: options.id, connectorId: user.storage.connectorId }) as WebsiteData
        if (data.assets) data.assets = addTempDataToAssetUrl(data.assets, options.id, user.storage.connectorId)
        if (data.styles) data.styles = addTempDataToStyles(data.styles, options.id, user.storage.connectorId)
        //setTimeout(() => progressiveLoadPages(editor, data))
        await progressiveLoadPages(editor, data)
        return {}
      } catch (err) {
        editor.UndoManager.clear()
        if (err.httpStatusCode === 401) {
          editor.once(eventLoggedIn, async () => {
            try {
              editor.runCommand(cmdPauseAutoSave)
              await editor.Storage.load(options)
              editor.once('canvas:frame:load', () => editor.stopCommand(cmdPauseAutoSave))
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

    async addToQueue(data: WebsiteData, options) {
      // Handle concurrent saving
      if (lastPendingSaving && lastPendingSaving !== data) {
        // Cancel previous saving
      }
      lastPendingSaving = data
      // Go ahaed and save
      return this.doStore(lastPendingSaving, options)
    },

    async doStore(data, options) {
      if (editor.PublicationManager.status === PublicationStatus.STATUS_PENDING) {
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

async function progressiveLoadPages(editor: PublishableEditor, data: ProjectData) {
  editor.Pages.getAll().forEach(page => editor.Pages.remove(page))
  let i = 0
  for (const page of data.pages) {
    document.querySelector('.silex-loader').innerHTML = `Loading page ${++i} / ${data.pages.length}`
    await nextFrame()
    const newPage = editor.Pages.add({
      ...page,
    })
  }

  // Charger les styles, assets, etc. après les pages
  document.querySelector('.silex-loader').innerHTML = 'Loading styles and assets'
  if (data.styles) editor.setStyle(data.styles)
  if (data.assets) editor.AssetManager.add(data.assets)

  // Sélectionner la première page
  const firstPage = editor.Pages.getAll()[0]
  if (firstPage) editor.Pages.select(firstPage)
}
