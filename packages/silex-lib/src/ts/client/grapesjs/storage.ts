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

import { BackendId, WebsiteId, WebsiteData } from '../../types'
import { ApiError, LoginStatus, websiteLoad, websiteSave } from '../services'
import { cmdLogin, eventLoggedIn, eventLoggedOut, getCurrentLoginStatus } from './LoginDialog'

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
export const storagePlugin = (editor) => {
  editor.Storage.add('backend', {
    async load(options: { id: WebsiteId, backendId: BackendId }): Promise<WebsiteData> {
      try {
        const status = await getCurrentLoginStatus(editor)
        if(status?.backend?.isLoggedIn) {
          const data = await websiteLoad(options.id, options.backendId)
          return data
        } else {
          return new Promise((resolve, reject) => {
            editor.once(eventLoggedIn, async () => {
              try {
                const data = await editor.Storage.load(options)
                //editor.loadProjectData(data)
                resolve(data)
              } catch (err) {
                console.error('backendPlugin load error', err)
                reject(err)
              }
            })
            editor.Commands.run(cmdLogin)
          })
        }
      } catch (err) {
        console.error('backendPlugin load error', err)
        throw err
      }
    },

    async store(data: WebsiteData, options: { id: WebsiteId, backendId: BackendId }) {
      try {
        if(await getCurrentLoginStatus(editor)) {
          await websiteSave(options.id, options.backendId, data)
        } else {
          editor.once(eventLoggedIn, () => {
            return editor.Storage.save(options)
          })
          editor.Commands.run(cmdLogin)
        }
      } catch (err) {
        console.error('backendPlugin store error', err)
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
