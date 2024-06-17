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

import { ConnectorId, WebsiteId, WebsiteData, ConnectorUser, ConnectorType, ApiError, Asset, Page, Component, Style } from '../../types'
import { websiteLoad, websiteSave } from '../api'
import { cmdLogin, eventLoggedIn, eventLoggedOut, getCurrentUser, updateUser } from './LoginDialog'
import { addTempDataToPages, addTempDataToAssetUrl, addTempDataToStyles, removeTempDataFromAssetUrl, removeTempDataFromPages, removeTempDataFromStyles } from '../assetUrl'
import { PublicationStatus } from './PublicationManager'
import { ClientEvent } from '../events'

export const storagePlugin = (editor) => {
  editor.Storage.add('connector', {
    async load(options: { id: WebsiteId, connectorId: ConnectorId }): Promise<WebsiteData> {
      try {
        const user: ConnectorUser = await getCurrentUser(editor) ?? await updateUser(editor, ConnectorType.STORAGE, options.connectorId)
        if(!user) throw new ApiError('Not logged in', 401)
        const data = await websiteLoad({websiteId: options.id, connectorId: user.storage.connectorId}) as WebsiteData
        if(data.assets) data.assets = addTempDataToAssetUrl(data.assets, options.id, user.storage.connectorId)
        if(data.pages) data.pages = addTempDataToPages(data.pages, options.id, user.storage.connectorId)
        if(data.styles) data.styles = addTempDataToStyles(data.styles, options.id, user.storage.connectorId)
        return data

      } catch (err) {
        if(err.httpStatusCode === 401) {
          editor.once(eventLoggedIn, async () => {
            try {
              editor.StorageManager.setAutosave(false)
              const data = await editor.Storage.load(options)
              editor.once('canvas:frame:load', ({ window }) => {
                editor.editor.set('changesCount', 0)
                editor.UndoManager.clear()
                editor.StorageManager.setAutosave(true)
              })
              editor.loadProjectData(data)
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
      console.log('store', editor.PublicationManager.status, PublicationStatus.STATUS_PENDING)
      if(editor.PublicationManager.status === PublicationStatus.STATUS_PENDING) {
        console.warn('Publication is pending, saving later')
        return new Promise((resolve) => {
          editor.once(ClientEvent.PUBLISH_END, () => resolve(this.store(data, options)))
        })
      }
      try {
        if(await getCurrentUser(editor)) {
          const user = await getCurrentUser(editor)
          data.assets = removeTempDataFromAssetUrl(data.assets)
          data.pages = removeTempDataFromPages(data.pages)
          data.styles = removeTempDataFromStyles(data.styles)
          await websiteSave({websiteId: options.id, connectorId: user.storage.connectorId, data})
        } else {
          editor.once(eventLoggedIn, () => {
            return editor.Storage.store()
          })
          editor.Commands.run(cmdLogin)
        }
      } catch (err) {
        console.error('connectorPlugin store error', err)
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
