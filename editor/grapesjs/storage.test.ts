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

import { expect, jest, describe, it, beforeEach } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import { ConnectorType, ConnectorUser, WebsiteData } from '~/common/types'
import { ClientEvent } from '../events'
import { PublicationStatus } from './PublicationManager'
import { storagePlugin } from './storage'

const user: ConnectorUser = {
  name: 'test',
  storage: {
    connectorId: 'fs',
    type: ConnectorType.STORAGE,
    displayName: 'FS',
    icon: '',
    disableLogout: false,
    isLoggedIn: true,
    oauthUrl: null,
    color: '',
    background: '',
  },
}

const storeOptions = { id: 'site-1', connectorId: 'fs' }
const projectData = { assets: [], styles: [] } as unknown as WebsiteData

type ConnectorStore = {
  store: (data: WebsiteData, options: { id: string, connectorId: string }) => Promise<unknown>
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? 'Unauthorized' : 'OK',
    json: async () => body,
  } as Response
}

describe('storagePlugin doStore', () => {
  let editor: Editor
  let fetchMock: jest.Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>

  beforeEach(() => {
    fetchMock = jest.fn(async () => jsonResponse(200, { message: 'ok' }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    /* @ts-ignore */
    editor = grapesjs.init({
      headless: true,
      storageManager: { autoload: false, autosave: false },
      plugins: [storagePlugin],
    })
    editor.getModel().set('pagesFolder', null)
  })

  function getConnector(): ConnectorStore {
    return editor.Storage.get('connector') as unknown as ConnectorStore
  }

  async function store(): Promise<void> {
    await getConnector().store(projectData, storeOptions)
  }

  function writeCalls() {
    return fetchMock.mock.calls.filter(([, init]) => (init?.method || 'GET').toUpperCase() === 'POST')
  }

  it('saves again after a store while logged out once a user is present', async () => {
    editor.getModel().set('user', null)
    await store()
    expect(writeCalls()).toHaveLength(0)

    editor.getModel().set('user', user)
    await store()
    expect(writeCalls()).toHaveLength(1)
    expect(String(writeCalls()[0][0])).toContain('websiteId=site-1')
    expect(String(writeCalls()[0][0])).toContain('connectorId=fs')
  })

  it('resets isSaving after a 401 so a later store can run', async () => {
    editor.getModel().set('user', user)
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
    await store()
    expect(writeCalls()).toHaveLength(1)

    await store()
    expect(writeCalls()).toHaveLength(2)
  })

  it('delays store while publication is pending and saves after publish end', async () => {
    editor.getModel().set('user', user)
    Object.assign(editor, {
      PublicationManager: { status: PublicationStatus.STATUS_PENDING },
    })

    const pending = store()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(writeCalls()).toHaveLength(0)

    Object.assign((editor as Editor & { PublicationManager: { status: PublicationStatus } }).PublicationManager, {
      status: PublicationStatus.STATUS_SUCCESS,
    })
    editor.trigger(ClientEvent.PUBLISH_END, { success: true, message: '' })
    await pending
    expect(writeCalls()).toHaveLength(1)
  })
})
