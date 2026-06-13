import { html, render } from 'lit-html'
import { Editor } from 'grapesjs'
import { ApiConnectorLoggedInPostMessage, ConnectorData, ConnectorId, ConnectorType, ConnectorUser } from '../../types'
import { connectorList, getUser, logout } from '../api'
import { WebsiteId } from '../../types'
import { API_CONNECTOR_LOGIN, API_CONNECTOR_PATH, API_PATH } from '../../constants'

export const cmdLogin = 'silex:auth:login'
export const cmdLogout = 'silex:auth:logout'
export const eventLoggingIn = 'silex:auth:logging-in'
export const eventLoggedIn = 'silex:auth:logged-in'
export const eventLoginFailed = 'silex:auth:login-failed'
export const eventLoggedOut = 'silex:auth:logged-out'

export interface LoginDialogOptions {
  id: WebsiteId,
}

export async function getCurrentUser(editor: Editor): Promise<ConnectorUser> {
  return editor.getModel().get('user') as ConnectorUser
}

export async function updateUser(editor: Editor, type: ConnectorType, connectorId?: ConnectorId): Promise<ConnectorUser> {
  const user = await getUser({type, connectorId})
  editor.getModel().set('user', user)
  return user
}

// Orging and path, should we use config.rootUrl?
const SERVER_URL = window.location.origin + window.location.pathname.replace(/\/$/, '')

let open = false
let body: HTMLElement | null = null
export default function loginDialogPlugin(editor, opts) {
  // Options
  const options: LoginDialogOptions = {
    ...opts,
  }

  // Commands and events
  editor.Commands.add(cmdLogin, {
    async run(editor: Editor) {  await openDialog() },
    stop(editor: Editor) { closeDialog() },
  })
  editor.Commands.add(cmdLogout, {
    async run(editor: Editor) {
      await logout({type: ConnectorType.STORAGE })
      editor.getModel().set('user', null)
      editor.trigger(eventLoggedOut)
    },
  })
  editor.on(eventLoggedOut, async () => openDialog())

  // Dialog API
  function closeDialog() {
    if (open) {
      editor.Modal.close()
      open = false
    }
  }
  async function openDialog() {
    editor.trigger(eventLoggingIn)
    open = true
    editor.Modal.open({
      title: 'Login',
      content: '<div id="LoginDialog__content"></div>',
    }, {
      closeOnConfirm: false,
      closeOnEscape: false,
      closeOnOverlayClick: false,
    })
    body = document.querySelector('#LoginDialog__content')
    if (!body) {
      throw new Error('Dialog creation failed')
    }
    render(html`Logging in...`, body)
    return loadStorageList(async list => onStorageList(list))
  }
  async function onStorageList(list) {
    const loggedIn = list.find(connector => connector.isLoggedIn)
    if (loggedIn) {
      try {
        const status = await updateUser(editor, loggedIn.type, loggedIn.connectorId)
        editor.trigger(eventLoggedIn, status)
        return closeDialog()
      } catch (err) {
        console.error('Error with updating login status', err)
        render(html`
            <main>
              <p>There was an error with updating the login status. ${err.message}</p>
            </main>
            <footer>
              <button class="silex-button silex-button--primary" @click=${() => loadStorageList(async list => onStorageList(list))}>Retry</button>
              <button class="silex-button" @click=${async () => {
    await logout({type: loggedIn.type, connectorId: loggedIn.connectorId})
    openDialog()
  }}>Login with another connector</button>
            </footer>
          `, body)
      }
      return
    }
    // Display the list of storage and continue to login
    render(html`
        <main>
          <p>Login and give Silex access to a file storage.</p>
          ${list.map(connector => html`
            <button
              class="silex-button silex-button--primary"
              id="publish-button--primary"
              @click=${() => loginWithConnector(connector)}
            >Login with ${connector.displayName}</button>
          `)}
        </main>
        <footer>
        </footer>
      `, body)
  }

  // Auth management
  async function loadStorageList(done: (list: ConnectorData[]) => Promise<void>) {
    try {
      const storageConnectors = await connectorList({type: ConnectorType.STORAGE})
      await done(storageConnectors)
    } catch (err) {
      console.error('Error with loading storage connectors', err)
      render(html`
        <main>
          An error occured while loading the storage connectors: ${err.message}
        </main>
        <footer>
          <button type="button" class="gjs-btn-prim" @click=${() => loadStorageList(done)}>Retry</button>
        </footer>
        `, body)
    }
  }
  async function loginWithConnector(connector: ConnectorData) {
    const nonOAuthUrl = `${SERVER_URL}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN}?connectorId=${connector.connectorId}&type=${connector.type}`
    window.open(connector.oauthUrl ?? nonOAuthUrl, '_blank')
    return new Promise(resolve => {
      render(html`
        <main>
          <p>Waiting for your authorization in popup window...</p>
          </main>
        <footer>
          <button type="button" class="gjs-btn-prim" @click=${() => openDialog()}>Cancel</button>
        </footer>
      `, body)
      const onMessage = async (event) => {
        const data = event.data as ApiConnectorLoggedInPostMessage
        if (data?.type === 'login') {
          window.removeEventListener('message', onMessage)
          const { connectorId, error, message } = data // TODO: use options from the connector? For now they are stored in the session
          if (error) {
            // Error, start over
            console.error('login error', message)
            render(html`
              <main>
                <p>Login failed with error: ${message}</p>
              </main>
              <footer>
                <button type="button" class="gjs-btn-prim" @click=${() => openDialog()}>Retry</button>
                ${ connectorId ? html`<button class="silex-button" @click=${async () => {
    await logout({type: connector.type, connectorId})
    openDialog()
  }}>Login with another connector</button>` : '' }

                  </footer>
                `, body)
            editor.trigger(eventLoginFailed)
          } else {
            try {
              render(html`
                <main>
                  <p>Loging in...</p>
                </main>
                <footer>
                </footer>
              `, body)
              const status = await updateUser(editor, connector.type, connectorId)
              editor.trigger(eventLoggedIn, status)
              closeDialog()
            } catch (err) {
              console.error('Error with loading login status', err)
              render(html`
                <main>
                  An error occured, could not get your data.
                  ${err.message}
                </main>
                <footer>
                  <button type="button" class="gjs-btn-prim" @click=${() => openDialog()}>Retry</button>
                  <button class="silex-button" @click=${async () => {
    await logout({type: connector.type, connectorId})
    openDialog()
  }}>Login with another connector</button>
                </footer>
                `, body)
            }
          }
        }
      }
      window.addEventListener('message', onMessage, false)
    })
  }
}
