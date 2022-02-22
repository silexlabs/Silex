/**
 * @fileoverview The dialog which handles website publication
 *
 */

import { FileExplorer } from './FileExplorer'
import {
  Hosting,
  Provider,
  PublicationOptions,
  VHost
} from '../../site-store/types'
import { LOADING } from '../../ui-store/types'
import { Notification } from '../Notification'
import { SilexTasks } from '../../io/SilexTasks'
import { getSite, updateSite } from '../../site-store/index'
import { updateUi, getUi } from '../../ui-store/index'

const service = SilexTasks.getInstance()

/**
 * display/hide a loader
 */
function setLoading(loading: boolean) {
  updateUi({
    ...getUi(),
    loading: loading ? LOADING.SILEX : LOADING.NONE,
  })
}

/**
 * close dialog
 */
export function closePublishDialog() {
  setLoading(false)
  Notification.close()
}

/**
 * open dialog to get the publication options
 */
export async function openPublishDialog(): Promise<PublicationOptions> {
  return (new Promise<PublicationOptions>((resolve, reject) => {
    setLoading(true)
    service.hosting((hosting: Hosting) => {
      setLoading(false)
      const site = getSite()
      const providerName = site.hostingProvider
      const publicationPath = site.publicationPath
      if (providerName && publicationPath) {
        const provider: Provider = hosting.providers.find((p) => p.name === providerName)
        const providerDisplayName = provider ? provider.displayName || provider.name : publicationPath.service
        Notification.confirm('Publication', `
          I am about to publish your website to <strong>${providerDisplayName}</strong>, in the folder ${publicationPath.path || '/'}.
        `, (ok) => {
          if (ok) {
            resolve(doOpen(ok, hosting, providerName))
          }
        },
        'Continue', 'Cancel')
        // edit button in order to change the existing settings
        const editBtn = document.createElement('button')
        editBtn.innerHTML = 'Edit'
        editBtn.onclick = () => {
          Notification.close()
          resolve(doOpen(false, hosting, providerName))
        }
        Notification.addButton(editBtn)
      } else {
        // no publish settings
        resolve(doOpen(false, hosting, providerName))
      }
    }, (msg) => reject(msg))
  }))
  .catch((msg) => {
    setLoading(false)
    throw msg
  })
}

function doOpen(usePredifinedSettings: boolean, hosting: Hosting, providerName: string): Promise<PublicationOptions> {
  return new Promise<PublicationOptions>((resolve, reject) => {
    if (usePredifinedSettings || hosting.providers.length === 0) {
      // use publication settings or send the user to publish settings
      resolve({
        file: null,
        publicationPath: null,
        provider: null,
      })
    } else {
      if (hosting.skipHostingSelection === true) {
        const provider = hosting.providers[0]

        // continue to next step
        resolve(selectProviderFolder(provider))
      } else {
        resolve(selectProvider(hosting.providers, providerName))
      }
    }
  })
}

function selectProvider(providers: Provider[], providerName: string): Promise<PublicationOptions> {

  return new Promise<PublicationOptions>((resolve, reject) => {
    Notification.prompt('Publication', 'unused', 'unused', 'unused', (ok) => {
      if (ok) {
        const idx = selectEl.selectedIndex
        const provider = providers[idx]
        resolve(selectProviderFolder(provider))
      } else {
        resolve(null)
      }
    }, 'next', 'cancel')
    const body = document.createElement('div')
    body.insertAdjacentHTML('afterbegin', `
      <p>Choose the hosting provider you love!
      (<a href="https://github.com/silexlabs/Silex/wiki/Publishing-and-Releasing-Your-Website#hosting-providers" target="_blank" title="About hosting providers" class="help-btn">
          <span class="label">more info here</span>
      </a>)</p>
      <br />
      <select class="providers">
        ${providers.map((p) => `<option value="${p.name}">${p.displayName}</option>`)}
      </select>
      <br />
    `)
    Notification.setContent(body)
    const selectEl = body.querySelector('.providers') as HTMLSelectElement
    if (providerName) {
      selectEl.value = providerName
    }
  })
}

/**
 * store the selected provider and open a folder selection if needed
 */
function selectProviderFolder(provider: Provider): Promise<PublicationOptions> {
  return new Promise<PublicationOptions>((resolve, reject) => {
    updateSite({
      ...getSite(),
      hostingProvider: provider.name,
    })
    if (provider.skipFolderSelection) {
      resolve(onSelectProvider(provider))
    } else {
      FileExplorer.getInstance().openFolder().then((folder) => {
        updateSite({
          ...getSite(),
          publicationPath: folder,
        })
        resolve(onSelectProvider(provider))
      })
    }
  })
}

function onSelectProvider(provider: Provider): Promise<PublicationOptions> {
  return new Promise<PublicationOptions>((resolve, reject) => {
    if (provider.isLoggedIn) {
      resolve(selectVhost(provider))
    } else {
      setLoading(true)
      service.authorize(provider, (loginUrl) => {
        setLoading(false)
        Notification.confirm('Publication', `
          Please&nbsp;<a href="${loginUrl}" target="_blank">click here and login to ${provider.displayName}.</a>, then click "next".
        `, () => {
          resolve(selectVhost(provider))
        },
        'next', 'cancel')
      }, (msg) => reject(msg))
    }
  })
}

function selectVhost(provider: Provider): Promise<PublicationOptions> {
  return new Promise<PublicationOptions>((resolve, reject) => {
    if (provider.vhostsUrl) {
      setLoading(true)
      service.vhosts(provider, (vhosts: VHost[]) => {
        setLoading(false)
        if (vhosts.length === 0) {
          Notification.alert('Publication', `Please click here to
            <a href="${provider.dashboardUrl}" target="_blank">
              ${provider.pleaseCreateAVhost}
            </a>
          `, () => {
            resolve(selectVhost(provider))
          },
          'Check again')
        } else {
          if (provider.skipVhostSelection === true) {
            resolve(selectDomain(provider, vhosts[0]))
          } else {
            Notification.prompt('Publication', 'unused', 'unused', 'unused', (ok) => {
              if (ok) {
                const idx = selectEl.selectedIndex
                const vhost = vhosts[idx]
                resolve(selectDomain(provider, vhost))
              }
            }, 'next', 'cancel')
            const body = document.createElement('div')
            body.insertAdjacentHTML('afterbegin', `
              <p>Choose the website you are working on</p>
              <select class="vhosts">
                ${
                vhosts.map(
                    (v) => `<option value="${v.name}">${v.name}</option>`)}
              </select>
              <br />
            `)
            Notification.setContent(body)
            const selectEl = body.querySelector('.vhosts') as HTMLSelectElement
            const publicationPath = getSite().publicationPath
            if (publicationPath) {
              selectEl.value = publicationPath.folder
            }
          }
        }
      }, (msg) => reject(msg))
    } else {
      resolve({
        file: getSite().file,
        publicationPath: getSite().publicationPath,
        provider,
      })

    }
  })
}

function selectDomain(provider: Provider, vhost: VHost): Promise<PublicationOptions> {
  return new Promise<PublicationOptions>((resolve: (PublicationOptions) => void, reject) => {
    updateSite({
      ...getSite(),
      websiteUrl: vhost.url,
    })
    if (vhost.skipDomainSelection === true) {
      resolve({
        file: getSite().file,
        publicationPath: vhost.publicationPath,
        provider,
      })
    } else {
      setLoading(true)
      service.domain(vhost, (res) => {
        const domain = res.domain
        if (res.url) {
          updateSite({
            ...getSite(),
            websiteUrl: res.url,
          })
        }
        setLoading(false)
        const initialDomain = domain || ''

        Notification.prompt('Publication', `
          <h3>Optional: provide your domain name<h3>
          <p>Choose the domain you want associated with this website. Leave blank and you will be provided with a generic domain.</p>
        ` + (provider.buyDomainUrl ? `
          <p>You can also <a target="_blank" href="${provider.buyDomainUrl}">buy a domain name here.</a></p>
        ` : ''),
        initialDomain, '[Optional] your-domain.com', (ok, newDomain) => {
          const updateOrRemoveSuccess = (resUrl) => {
            // update website url
            if (resUrl.url) {
              updateSite({
                ...getSite(),
                websiteUrl: resUrl.url,
              })
            }
            setLoading(false)
            Notification.notifySuccess('Domain updated')
            resolve({
              file: getSite().file,
              publicationPath: vhost.publicationPath,
              provider,
            })
          }
          if (ok) {
            if (newDomain !== initialDomain) {
              setLoading(true)
              if (newDomain !== '') {
                service.updateDomain(
                    vhost, (newDomain as string),
                    (_res) => updateOrRemoveSuccess(_res),
                    (msg) => reject(msg))
              } else {
                service.removeDomain(
                    vhost, newDomain, (_res) => updateOrRemoveSuccess(_res),
                    (msg) => reject(msg))
              }
            } else {
              resolve({
                file: getSite().file,
                publicationPath: vhost.publicationPath,
                provider,
              })
            }
          } else {
            resolve(null)
          }
        }, 'next', 'cancel')
      }, (msg) => reject(msg))
    }
  })
}

export function startPublish(options: PublicationOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const publicationPath = options.publicationPath
    const provider = options.provider
    let timer = -1
    Notification.alert('Publication', '<strong>I am about to publish your site. This may take several minutes.</strong>',
      () => {
        if (timer > 0) {
          clearInterval(timer)
        }
      },
      'Close')
    timer = -1
    setLoading(true)
    service.publish(options, () => {
      setLoading(false)
      // setTimeout(() => {
      //   // tip of the day
      //   const tipOfTheDayElement = (document.createElement('div') as HTMLElement);
      //   new TipOfTheDay(tipOfTheDayElement);
      //   Notification.setInfoPanel(tipOfTheDayElement);
      // }, 2000);
      timer = window.setInterval(() => {
        service.publishState(
          (json) => {
            let msg = `<strong>${json.message}</strong>`
            if (json.stop === true) {
              clearInterval(timer)
              const websiteUrl = getSite().websiteUrl || publicationPath.absPath + '/index.html'
              msg += `
                <p>Here is a link to <a target="_blanck" href="${websiteUrl}">your published website here</a>.
                ${provider && provider.afterPublishMessage ? provider.afterPublishMessage : ''}</p>
              `
              resolve(msg)
            } else {
              Notification.setText(msg)
            }
          },
          (msg) => {
            clearInterval(timer)
            reject(msg)
          },
        )
      }, 1000)
    }, (msg) => reject(msg))
  })
}
