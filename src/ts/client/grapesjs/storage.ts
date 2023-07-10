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

import { ConnectorId, WebsiteId, WebsiteData, ConnectorUser, ConnectorType } from '../../types'
import { ApiError, websiteLoad, websiteSave } from '../api'
import { cmdLogin, eventLoggedIn, eventLoggedOut, getCurrentUser, updateUser } from './LoginDialog'

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
export const storagePlugin = (editor) => {
  editor.Storage.add('connector', {
    async load(options: { id: WebsiteId, connectorId: ConnectorId }): Promise<WebsiteData> {
      try {
        const user: ConnectorUser = await getCurrentUser(editor) ?? await updateUser(editor, ConnectorType.STORAGE, options.connectorId)
        if(user) {
          const data = await websiteLoad({websiteId: options.id, connectorId: user.storage.connectorId})
          return data
        } else {
          return new Promise((resolve, reject) => {
            editor.once(eventLoggedIn, async () => {
              try {
                const data = await editor.Storage.load(options)
                //editor.loadProjectData(data)
                resolve(data)
              } catch (err) {
                console.error('connectorPlugin load error', err)
                reject(err)
              }
            })
            editor.Commands.run(cmdLogin)
          })
        }
      } catch (err) {
        console.error('connectorPlugin load error', err)
        throw err
      }
    },

    async store(data: WebsiteData, options: { id: WebsiteId, connectorId: ConnectorId }) {
      try {
        if(await getCurrentUser(editor)) {
          const user = await getCurrentUser(editor)
          await websiteSave({websiteId: options.id, connectorId: user.storage.connectorId, data})
        } else {
          editor.once(eventLoggedIn, () => {
            return editor.Storage.save(options)
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
  editor.on('storage:error:load', (err) => {
    handleError(err)
  })
  editor.on('storage:error:store', (err) => {
    handleError(err)
  })
  function handleError(err: Error) {
    console.error('Error with loading / saving', err, err instanceof ApiError)
    if (err instanceof ApiError) {
      console.error('ApiError', err.code, err.message)
      switch (err.code) {
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
          content: `An error occured. ${err.message}`,
        })
      }
    } else {
      return editor.Modal.open({
        title: 'Error',
        content: `An error occured. ${err.message}`,
      })
    }
  }
}
