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
 * FIXME: use a type instead of Promise<any>
 */

import { File } from '../../model/file';
import { SilexTasks } from '../../service/silex-tasks';
import { Model, Provider, VHost, View, PublicationOptions } from '../../types';
import { SilexNotification } from '../../utils/notification';
import { TipOfTheDay } from '../../view/tip-of-the-day';
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
  loading(on: boolean) {
    if (on) {
      getUiElements().stage.classList.add(
          File.LOADING_LIGHT_CSS_CLASS);
    } else {
      getUiElements().stage.classList.remove(
          File.LOADING_LIGHT_CSS_CLASS);
    }
  }

  /**
   * open dialog and get the publication options
   */
  open(): Promise<any> {
    return (new Promise((resolve, reject) => {
      this.loading(true);
      this.service.hosting((hosting) => {
        this.loading(false);
        const providerName = this.model.head.getHostingProvider();
        const publicationPath = this.model.head.getPublicationPath();
        if (providerName && publicationPath) {
          const provider: Provider = hosting['providers'].find(
              (p) => p['name'] === providerName);
          const providerDisplayName = provider ?
              provider['displayName'] || provider['name'] :
              publicationPath.service;
          SilexNotification.confirm('Publication', `
            I am about to publish your webiste to <strong>${providerDisplayName}</strong>, in the folder ${publicationPath.path}.
          `, (ok) => {
            resolve(this.doOpen(ok, hosting, providerName));
          },
          'Continue', 'Edit publish settings');
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

  doOpen(usePredifinedSettings, hosting, providerName) {
    return new Promise((resolve, reject) => {
      if (usePredifinedSettings || hosting['providers'].length === 0) {
        // use publication settings or send the user to publish settings
        resolve({});
      } else {
        if (hosting['skipHostingSelection'] === true) {
          const provider = hosting['providers'][0];

          // continue to next step
          resolve(this.selectProviderFolder(provider));
        } else {
          resolve(this.selectProvider(hosting['providers'], providerName));
        }
      }
    });
  }

  selectProvider(providers: Provider[], providerName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      SilexNotification.prompt('Publication', 'unused', 'unused', (ok) => {
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
  selectProviderFolder(provider: Provider): Promise<any> {
    return new Promise((resolve, reject) => {
      this.model.head.setHostingProvider(provider.name);
      if (provider['skipFolderSelection']) {
        resolve(this.onSelectProvider(provider));
      } else {
        this.view.fileExplorer.openFolder().then((folder) => {
          this.model.head.setPublicationPath(folder);
          resolve(this.onSelectProvider(provider));
        });
      }
    });
  }

  onSelectProvider(provider: Provider): Promise<any> {
    return new Promise((resolve, reject) => {
      if (provider['isLoggedIn']) {
        resolve(this.selectVhost(provider));
      } else {
        this.loading(true);
        this.service.authorize(provider, (loginUrl) => {
          this.loading(false);
          SilexNotification.confirm('Publication', `
            Please&nbsp;<a href="${loginUrl}" target="_blank">click here and login to ${provider['displayName']}.</a>, then click "next".
          `, () => {
            resolve(this.selectVhost(provider));
          },
          'next', 'cancel');
        }, (msg) => reject(msg));
      }
    });
  }

  selectVhost(provider: Provider): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loading(true);
      this.service.vhosts(provider, (vhosts) => {
        this.loading(false);
        if (vhosts.length === 0) {
          SilexNotification.alert('Publication', `Please click here to
            <a href="${provider['dashboardUrl']}" target="_blank">
              ${provider['pleaseCreateAVhost']}
            </a>
          `, () => {
            resolve(this.selectVhost(provider));
          },
          'Check again');
        } else {
          if (provider['skipVhostSelection'] === true) {
            resolve(this.selectDomain(provider, vhosts[0]));
          } else {
            SilexNotification.prompt('Publication', 'unused', 'unused', (ok) => {
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
            const publicationPath = this.model.head.getPublicationPath();
            if (publicationPath) {
              selectEl.value = publicationPath.folder;
            }
          }
        }
      }, (msg) => reject(msg));
    });
  }

  selectDomain(provider: Provider, vhost: VHost): Promise<any> {
    this.model.head.setWebsiteUrl(vhost['url']);
    return new Promise((resolve, reject) => {
      if (vhost['skipDomainSelection'] === true) {
        resolve({
          'publicationPath': vhost['publicationPath'],
          'provider': provider,
          'vhost': vhost
        });
      } else {
        this.loading(true);
        this.service.domain(vhost, (res) => {
          const domain = res['domain'];
          if (res['url']) {
            this.model.head.setWebsiteUrl(res['url']);
          }
          this.loading(false);
          const initialDomain = domain || '';
          SilexNotification.prompt('Publication', `
            <p>Choose the domain you want associated with this website</p>
            <br>(or leave blanck to have a generic domain)<br>You can <a target="_blank" href="${provider['buyDomainUrl']}">buy a domain name here.</a>
          `,
          initialDomain, (ok, newDomain) => {
            const updateOrRemoveSuccess = (res) => {
              // update website url
              if (res['url']) {
                this.model.head.setWebsiteUrl(res['url']);
              }
              this.loading(false);
              SilexNotification.notifyInfo('Domain updated');
              resolve({
                'publicationPath': vhost['publicationPath'],
                'provider': provider,
                'vhost': vhost
              });
            };
            if (ok) {
              if (newDomain != initialDomain) {
                this.loading(true);
                if (newDomain != '') {
                  this.service.updateDomain(
                      vhost, (newDomain as string),
                      (res) => updateOrRemoveSuccess(res),
                      (msg) => reject(msg));
                } else {
                  this.service.removeDomain(
                      vhost, newDomain, (res) => updateOrRemoveSuccess(res),
                      (msg) => reject(msg));
                }
              } else {
                resolve({
                  'publicationPath': vhost['publicationPath'],
                  'provider': provider,
                  'vhost': vhost
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

  publish(options: PublicationOptions) {
    return new Promise((resolve, reject) => {
      const file = options['file'];
      const publicationPath = options['publicationPath'];
      const provider = options['provider'];
      let timer = -1;
      SilexNotification.alert('Publication', '<strong>I am about to publish your site. This may take several minutes.</strong>',
        () => {
          if(timer > 0) {
            clearInterval(timer);
          }
        },
        'Close');
      timer = -1;
      this.loading(true);
      console.info('Publish', options);
      this.service.publish(options, () => {
        this.loading(false);
        setTimeout(() => {
          // tip of the day
          const tipOfTheDayElement = (document.createElement('div') as HTMLElement);
          new TipOfTheDay(tipOfTheDayElement);
          SilexNotification.setInfoPanel(tipOfTheDayElement);
        }, 2000);
        timer = window.setInterval(() => {
          this.service.publishState(
            (json) => {
              let msg = `<strong>${json['message']}</strong>`;
              if (json['stop'] === true) {
                clearInterval(timer);
                const websiteUrl = this.model.head.getWebsiteUrl() || publicationPath.url + '/index.html';
                msg += `
                  <p>Please visit <a target="_blanck" href="${websiteUrl}">your published website here</a>.
                  ${provider && provider['afterPublishMessage'] ? provider['afterPublishMessage'] : ''}</p>
                `;
                resolve(msg);
              } else {
                SilexNotification.setText(msg);
              }
            },
            (msg) => {
              clearInterval(timer);
              reject(msg);
            }
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
