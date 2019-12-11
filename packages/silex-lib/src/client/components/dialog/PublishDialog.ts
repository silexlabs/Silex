/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview The dialog which handles website publication
 *
 * FIXME: use a type instead of Promise<PublicationOptions>
 */

import { Provider, VHost } from '../../../types';
import { getSite, updateSite, updateUi, getUi } from '../../api';
import { Model, PublicationOptions, View } from '../../ClientTypes';
import { File } from '../../model/File';
import { SilexTasks } from '../../service/SilexTasks';
import { SilexNotification } from '../../utils/Notification';
import { getUiElements } from '../UiElements';

/**
 * the PublishDialog class
 */
export class PublishDialog {
  service: SilexTasks;

  constructor(private model: Model, private view: View) {
    this.service = SilexTasks.getInstance();
  }

  /**
   * display/hide a loader
   */
  loading(loading: boolean) {
    updateUi({
      ...getUi(),
      loading,
    })
  }

  /**
   * open dialog and get the publication options
   */
  async open(): Promise<PublicationOptions> {
    return (new Promise<PublicationOptions>((resolve, reject) => {
      this.loading(true);
      this.service.hosting((hosting) => {
        this.loading(false);
        const site = getSite();
        const providerName = site.hostingProvider;
        const publicationPath = site.publicationPath;
        if (providerName && publicationPath) {
          const provider: Provider = hosting.providers.find((p) => p.name === providerName);
          const providerDisplayName = provider ? provider.displayName || provider.name : publicationPath.service;
          SilexNotification.confirm('Publication', `
            I am about to publish your website to <strong>${providerDisplayName}</strong>, in the folder ${publicationPath.path || '/'}.
          `, (ok) => {
            if (ok) {
              resolve(this.doOpen(ok, hosting, providerName));
            }
          },
          'Continue', 'Cancel');
        } else {
          // no publish settings
          resolve(this.doOpen(false, hosting, providerName));
        }
      }, (msg) => reject(msg));
    }))
    .catch((msg) => {
      this.loading(false);
      throw msg;
    });
  }

  doOpen(usePredifinedSettings, hosting, providerName): Promise<PublicationOptions> {
    return new Promise<PublicationOptions>((resolve, reject) => {
      if (usePredifinedSettings || hosting.providers.length === 0) {
        // use publication settings or send the user to publish settings
        resolve({
          file: null,
          publicationPath: null,
          provider: null,
        });
      } else {
        if (hosting.skipHostingSelection === true) {
          const provider = hosting.providers[0];

          // continue to next step
          resolve(this.selectProviderFolder(provider));
        } else {
          resolve(this.selectProvider(hosting.providers, providerName));
        }
      }
    });
  }

  selectProvider(providers: Provider[], providerName: string): Promise<PublicationOptions> {

    return new Promise<PublicationOptions>((resolve, reject) => {
      SilexNotification.prompt('Publication', 'unused', 'unused', 'unused', (ok) => {
        if (ok) {
          const idx = selectEl.selectedIndex;
          const provider = providers[idx];
          resolve(this.selectProviderFolder(provider));
        } else {
          resolve(null);
        }
      }, 'next', 'cancel');
      const body = document.createElement('div');
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
      `);
      SilexNotification.setContent(body);
      const selectEl = body.querySelector('.providers') as HTMLSelectElement;
      if (providerName) {
        selectEl.value = providerName;
      }
    });
  }

  /**
   * store the selected provider and open a folder selection if needed
   */
  selectProviderFolder(provider: Provider): Promise<PublicationOptions> {
    return new Promise<PublicationOptions>((resolve, reject) => {
      updateSite({
        ...getSite(),
        hostingProvider: provider.name,
      })
      if (provider.skipFolderSelection) {
        resolve(this.onSelectProvider(provider));
      } else {
        this.view.fileExplorer.openFolder().then((folder) => {
          updateSite({
            ...getSite(),
            publicationPath: folder,
          })
          resolve(this.onSelectProvider(provider));
        });
      }
    });
  }

  onSelectProvider(provider: Provider): Promise<PublicationOptions> {
    return new Promise<PublicationOptions>((resolve, reject) => {
      if (provider.isLoggedIn) {
        resolve(this.selectVhost(provider));
      } else {
        this.loading(true);
        this.service.authorize(provider, (loginUrl) => {
          this.loading(false);
          SilexNotification.confirm('Publication', `
            Please&nbsp;<a href="${loginUrl}" target="_blank">click here and login to ${provider.displayName}.</a>, then click "next".
          `, () => {
            resolve(this.selectVhost(provider));
          },
          'next', 'cancel');
        }, (msg) => reject(msg));
      }
    });
  }

  selectVhost(provider: Provider): Promise<PublicationOptions> {
    return new Promise<PublicationOptions>((resolve, reject) => {
      if (provider.vhostsUrl) {
        this.loading(true);
        this.service.vhosts(provider, (vhosts: VHost[]) => {
          this.loading(false);
          if (vhosts.length === 0) {
            SilexNotification.alert('Publication', `Please click here to
              <a href="${provider.dashboardUrl}" target="_blank">
                ${provider.pleaseCreateAVhost}
              </a>
            `, () => {
              resolve(this.selectVhost(provider));
            },
            'Check again');
          } else {
            if (provider.skipVhostSelection === true) {
              resolve(this.selectDomain(provider, vhosts[0]));
            } else {
              SilexNotification.prompt('Publication', 'unused', 'unused', 'unused', (ok) => {
                if (ok) {
                  const idx = selectEl.selectedIndex;
                  const vhost = vhosts[idx];
                  resolve(this.selectDomain(provider, vhost));
                }
              }, 'next', 'cancel');
              const body = document.createElement('div');
              body.insertAdjacentHTML('afterbegin', `
                <p>Choose the website you are working on</p>
                <select class="vhosts">
                  ${
                  vhosts.map(
                      (v) => `<option value="${v.name}">${v.name}</option>`)}
                </select>
                <br />
              `);
              SilexNotification.setContent(body);
              const selectEl = body.querySelector('.vhosts') as HTMLSelectElement;
              const publicationPath = getSite().publicationPath;
              if (publicationPath) {
                selectEl.value = publicationPath.folder;
              }
            }
          }
        }, (msg) => reject(msg));
      } else {
        resolve({
          file: this.model.file.getFileInfo(),
          publicationPath: getSite().publicationPath,
          provider,
        });

      }
    });
  }

  selectDomain(provider: Provider, vhost: VHost): Promise<PublicationOptions> {
    return new Promise<PublicationOptions>((resolve: (PublicationOptions) => void, reject) => {
      updateSite({
        ...getSite(),
        websiteUrl: vhost.url,
      });
      if (vhost.skipDomainSelection === true) {
        resolve({
          file: this.model.file.getFileInfo(),
          publicationPath: vhost.publicationPath,
          provider,
        });
      } else {
        this.loading(true);
        this.service.domain(vhost, (res) => {
          const domain = res.domain;
          if (res.url) {
            updateSite({
              ...getSite(),
              websiteUrl: res.url,
            });
          }
          this.loading(false);
          const initialDomain = domain || '';

          SilexNotification.prompt('Publication', `
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
                });
              }
              this.loading(false);
              SilexNotification.notifySuccess('Domain updated');
              resolve({
                file: this.model.file.getFileInfo(),
                publicationPath: vhost.publicationPath,
                provider,
              });
            };
            if (ok) {
              if (newDomain !== initialDomain) {
                this.loading(true);
                if (newDomain !== '') {
                  this.service.updateDomain(
                      vhost, (newDomain as string),
                      (_res) => updateOrRemoveSuccess(_res),
                      (msg) => reject(msg));
                } else {
                  this.service.removeDomain(
                      vhost, newDomain, (_res) => updateOrRemoveSuccess(_res),
                      (msg) => reject(msg));
                }
              } else {
                resolve({
                  file: this.model.file.getFileInfo(),
                  publicationPath: vhost.publicationPath,
                  provider,
                });
              }
            } else {
              resolve(null);
            }
          }, 'next', 'cancel');
        }, (msg) => reject(msg));
      }
    });
  }

  publish(options: PublicationOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const file = options.file;
      const publicationPath = options.publicationPath;
      const provider = options.provider;
      let timer = -1;
      SilexNotification.alert('Publication', '<strong>I am about to publish your site. This may take several minutes.</strong>',
        () => {
          if (timer > 0) {
            clearInterval(timer);
          }
        },
        'Close');
      timer = -1;
      this.loading(true);
      this.service.publish(options, () => {
        this.loading(false);
        // setTimeout(() => {
        //   // tip of the day
        //   const tipOfTheDayElement = (document.createElement('div') as HTMLElement);
        //   new TipOfTheDay(tipOfTheDayElement);
        //   SilexNotification.setInfoPanel(tipOfTheDayElement);
        // }, 2000);
        timer = window.setInterval(() => {
          this.service.publishState(
            (json) => {
              let msg = `<strong>${json.message}</strong>`;
              if (json.stop === true) {
                clearInterval(timer);
                const websiteUrl = getSite().websiteUrl || publicationPath.absPath + '/index.html';
                msg += `
                  <p>Please visit <a target="_blanck" href="${websiteUrl}">your published website here</a>.
                  ${provider && provider.afterPublishMessage ? provider.afterPublishMessage : ''}</p>
                `;
                resolve(msg);
              } else {
                SilexNotification.setText(msg);
              }
            },
            (msg) => {
              clearInterval(timer);
              reject(msg);
            },
          );
        }, 1000);
      }, (msg) => reject(msg));
    });
  }

  close() {
    this.loading(false);
    SilexNotification.close();
  }
}
