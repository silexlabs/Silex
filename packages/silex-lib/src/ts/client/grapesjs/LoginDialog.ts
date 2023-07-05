import { html, render } from 'lit-html'
import { Editor } from 'grapesjs'
import { ApiBackendLoggedInPostMessage, BackendData, BackendId, BackendType } from '../../types'
import { LoginStatus, backendList, loginStatus, logout } from '../services'
import { WebsiteId } from '../../types'

export const cmdLogin = 'silex:auth:login'
export const eventLoggingIn = 'silex:auth:logging-in'
export const eventLoggedIn = 'silex:auth:logged-in'
export const eventLoginFailed = 'silex:auth:login-failed'
export const eventLoggedOut = 'silex:auth:logged-out'

export interface LoginDialogOptions {
  id: WebsiteId,
}

export async function getCurrentLoginStatus(editor: Editor): Promise<LoginStatus> {
  return editor.getModel().get('loginStatus') as LoginStatus // ?? { backend: null, user: null, websiteMeta: null }
}

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
    const loggedIn = list.find(backend => backend.isLoggedIn)
    if (loggedIn) {
      try {
        const status = await updateLoginStatus(loggedIn.backendId, loggedIn.type)
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
    await logout(loggedIn.backendId, loggedIn.type)
    openDialog()
  }}>Login with another backend</button>
            </footer>
          `, body)
      }
      return
    }
    // Display the list of storage and continue to login
    render(html`
        <main>
          <p>Login and give Silex access to a file storage.</p>
          ${list.map(backend => html`
            <button
              class="silex-button silex-button--primary"
              id="publish-button--primary"
              @click=${() => loginWithBackend(backend)}
            >Login with ${backend.displayName}</button>
          `)}
        </main>
        <footer>
        </footer>
      `, body)
  }

  // Auth management
  async function loadStorageList(done: (list: BackendData[]) => Promise<void>) {
    try {
      const storageProviders = await backendList(BackendType.STORAGE)
      await done(storageProviders)
    } catch (err) {
      console.error('Error with loading storage providers', err)
      render(html`
        <main>
          An error occured while loading the storage providers: ${err.message}
        </main>
        <footer>
          <button type="button" class="gjs-btn-prim" @click=${() => loadStorageList(done)}>Retry</button>
        </footer>
        `, body)
    }
  }
  async function loginWithBackend(provider: BackendData) {
    window.open(provider.authUrl, '_blank')
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
        if (event.data?.type === 'login') {
          window.removeEventListener('message', onMessage)
          const data = event.data as ApiBackendLoggedInPostMessage
          const { backendId, error, message } = data
          if (error) {
            // Error, start over
            console.error('login error', message)
            render(html`
              <main>
                <p>Login failed with error: ${message}</p>
              <footer>
                <button type="button" class="gjs-btn-prim" @click=${() => openDialog()}>Retry</button>
                ${ backendId ? html`<button class="silex-button" @click=${async () => {
    await logout(backendId, provider.type)
    openDialog()
  }}>Login with another backend</button>` : '' }

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
              const status = await updateLoginStatus(backendId, provider.type)
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
    await logout(backendId, provider.type)
    openDialog()
  }}>Login with another backend</button>
                </footer>
                `, body)
            }
          }
        }
      }
      window.addEventListener('message', onMessage, false)
    })
  }
  async function updateLoginStatus(backendId: BackendId, type: BackendType): Promise<LoginStatus> {
    const status = await loginStatus(backendId, type, options.id)
    editor.getModel().set('loginStatus', status)
    return status
  }
}
