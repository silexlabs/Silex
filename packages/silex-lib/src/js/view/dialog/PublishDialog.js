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
 */


goog.provide('silex.view.dialog.PublishDialog');
goog.require('silex.utils.Notification');
goog.require('silex.service.SilexTasks');

const FOLDER_PROVIDER = 'custom';
const FOLDER_PROVIDER_DISPLAY_NAME = 'a folder of service ';

/**
 * the PublishDialog class
 */
silex.view.dialog.PublishDialog = class {
  /**
   * @param  {silex.types.Model} model
   * @param  {silex.types.View} view
   */
  constructor(model, view) {
    // store the params
    this.model = model;
    this.view = view;

    /**
     * @type {silex.service.SilexTasks}
     */
    this.service = silex.service.SilexTasks.getInstance();
  }


  /**
   * display/hide a loader
   * @param {boolean} on
   */
  loading(on) {
    if(on) {
      this.view.stage.element.classList.add(silex.model.File.LOADING_LIGHT_CSS_CLASS);
    }
    else {
      this.view.stage.element.classList.remove(silex.model.File.LOADING_LIGHT_CSS_CLASS);
    }
  };

  /**
   * open dialog and get the publication options
   * @return {Promise}
   */
  open() {
    return new Promise((resolve, reject) => {
      this.loading(true);
      this.service.hosting(hosting => {
        this.loading(false);
        const providerName = this.model.head.getHostingProvider();
        const publicationPath = this.model.head.getPublicationPath();
        if(providerName && publicationPath) {
        const provider = hosting.providers.find(p => p.name === providerName);
        const providerDisplayName = provider ? provider.name : publicationPath.service;
        silex.utils.Notification.confirm(`I am about to publish your webiste to ${ providerDisplayName } in ${ publicationPath.path }.`, ok => {
          resolve(this.doOpen(ok, hosting, providerName));
        }, 'Continue', 'Edit publish settings')
        }
        else {
          // no publish settings
          resolve(this.doOpen(false, hosting, providerName));
        }
      }, msg => reject(msg));
    })
    .catch(msg => {
      this.loading(false);
      throw msg;
    });
  }
  doOpen(usePredifinedSettings, hosting, providerName) {
    return new Promise((resolve, reject) => {
      if(usePredifinedSettings || hosting.providers.length === 0) {
        // use publication settings or send the user to publish settings
        resolve({});
      }
      else if(hosting.skipProviderSelection === true) {
        const provider = hosting.providers[0];
        console.log('Skip provider selection for hosting:', hosting);
        // continue to next step
        resolve(this.onSelectProvider(provider));
      }
      else {
        resolve(this.selectProvider(hosting.providers, providerName));
      }
    });
  }
  /**
   * @param {Array<Provider>} providers
   * @param {?string} providerName
   * @return {Promise}
   */
  selectProvider(providers, providerName) {
    return new Promise((resolve, reject) => {
      silex.utils.Notification.prompt('Choose the hosting provider you love!', 'unused', ok => {
        if(ok) {
          this.model.head.setHostingProvider(selectEl.value);
          if(selectEl.value === FOLDER_PROVIDER) {
            resolve(this.view.fileExplorer.openFolder()
              .then(folder => {
                return {
                  publicationPath: folder,
                  provider: null,
                  vhost: null,
                }
              }));
          }
          else {
            const idx = selectEl.selectedIndex;
            const provider = providers[idx];
            resolve(this.onSelectProvider(provider));
          }
        }
        else resolve(null);
      }, 'next', 'cancel');
      const body = silex.utils.Notification.getFormBody();
      body.innerHTML = `
    <select class="providers">
      ${ providers.map(p => `<option value="${ p.name }">${ p.displayName }</option>`) }
      <option value="${ FOLDER_PROVIDER }">Choose a folder</option>
    </select>
    <br />
  `;
      const selectEl = body.querySelector('.providers');
      if(providerName) selectEl.value = providerName;
    });
  }


  /**
   * @param {Provider} provider
   * @return {Promise}
   */
  onSelectProvider(provider) {
    return new Promise((resolve, reject) => {
      if(provider.isLoggedIn) resolve(this.selectVhost(provider));
      else {
        this.loading(true);
        this.service.authorize(provider, loginUrl => {
          this.loading(false);
          silex.utils.Notification.alert(`Please&nbsp;
          <a href="${ loginUrl }" target="_blank">
            click here and login to ${ provider.displayName }.
          </a>, then click "next".
          `, () => {
            resolve(this.selectVhost(provider));
          }, 'next', 'cancel');
        }, msg => reject(msg));
      }
    });
  }

  /**
   * @param {Provider} provider
   * @return {Promise}
   */
  selectVhost(provider) {
    return new Promise((resolve, reject) => {
      this.loading(true);
      this.service.vhosts(provider, vhosts => {
        this.loading(false);
        if(vhosts.length === 0) {
          silex.utils.Notification.alert(`Please click here to
        <a href="${ provider.dashboardUrl }" target="_blank">
          ${ provider.pleaseCreateAVhost }
        </a>
      `, () => {
        resolve(this.selectVhost(provider));
      }, 'Check again');
        }
        else if(provider.skipVhostSelection === true) {
          console.log('Skip vhost selection for provider:', provider, vhosts);
          resolve(this.selectDomain(provider, vhosts[0]));
        }
        else {
          silex.utils.Notification.prompt('Choose the website you are working on', 'unused', ok => {
            if(ok) {
              const idx = selectEl.selectedIndex;
              const vhost = vhosts[idx];
              resolve(this.selectDomain(provider, vhost));
            }
          }, 'next', 'cancel');
          const body = silex.utils.Notification.getFormBody();
          body.innerHTML = `
        <select class="vhosts">
          ${ vhosts.map(v => `<option value="${ v.name }">${ v.name }</option>`) }
        </select>
        <br />
      `;
          const selectEl = body.querySelector('.vhosts');
          const publicationPath = this.model.head.getPublicationPath();
          if(publicationPath) selectEl.value = publicationPath.folder;
        }
      }, msg => reject(msg));
    });
  }

  /**
   * @param {Provider} provider
   * @param {VHost} vhost
   * @return {Promise}
   */
  selectDomain(provider, vhost) {
    this.model.head.setWebsiteUrl(vhost.url)
    return new Promise((resolve, reject) => {
      if(vhost.skipDomainSelection === true) {
        console.log('Skip domain selection for vhost: ', vhost);
        resolve({
          publicationPath: vhost.publicationPath,
          provider: provider,
          vhost: vhost,
        });
      }
      else {
        this.loading(true);
        this.service.domain(vhost, res => {
          const domain = res['domain'];
          this.loading(false);
          const initialDomain = domain || '';
          silex.utils.Notification.prompt(`Choose the domain you want associated with this website<br>(or leave blanck to have a generic domain)<br>You can <a target="_blank" href="${ provider.buyDomainUrl }">buy a domain name here.</a>`, initialDomain, (ok, newDomain) => {
            const saveDomainInWebsiteSettings = () => {
            };
            const updateOrRemove = res => {
              this.loading(false);
              silex.utils.Notification.notifyInfo('Domain updated');
              resolve({
                publicationPath: vhost.publicationPath,
                provider: provider,
                vhost: vhost,
              });
              saveDomainInWebsiteSettings();
            };
            if(ok) {
              if(newDomain != initialDomain) {
                this.loading(true);
                if(newDomain != '')
                  this.service.updateDomain(vhost, newDomain, res => updateOrRemove(res), msg => reject(msg));
                else
                  this.service.removeDomain(vhost, newDomain, res => updateOrRemove(res), msg => reject(msg));
              }
              else {
                // save nevertheless, because it has to be stored in the website even if it is the same as what service.domain returned
                saveDomainInWebsiteSettings();
                resolve({
                  publicationPath: vhost.publicationPath,
                  provider: provider,
                  vhost: vhost,
                });
              }
            }
            else {
              resolve(null);
            }
          }, 'next', 'cancel');
        }, msg => reject(msg));
      }
    });
  }

  publish(options) {
    return new Promise((resolve, reject) => {
      const { file, folder, provider, vhost } = options;
      let timer = -1;
      silex.utils.Notification.alert('<strong>I am about to publish your site. This may take several minutes.</strong>', () => {
        // if(timer > 0) {
        //   clearInterval(timer);
        // }
        // timer = -1;
      }, 'Close');
      this.loading(true);
      this.service.publish(
        file,
        folder,
        () => {
          this.loading(false);
          setTimeout(() => {
            // tip of the day
            const tipOfTheDayElement = /** @type {!Element} */ (document.createElement('div'));
            const tipOfTheDay = new silex.view.TipOfTheDay(tipOfTheDayElement);
            silex.utils.Notification.setInfoPanel(tipOfTheDayElement);
          }, 2000);
          timer = setInterval(() => {
            this.service.publishState(json => {
              let msg = `<strong>${json['message']}</strong>`;
              if(json['stop'] === true) {
                clearInterval(timer);
                const websiteUrl = this.model.head.getWebsiteUrl() || folder.url;
                msg += `<p>Please visit <a target="_blanck" href="${ websiteUrl }">your published website here</a>. ${ provider && provider.afterPublishMessage ? provider.afterPublishMessage : '' }</p>`;
                resolve(msg);
              }
              else {
                silex.utils.Notification.setText(msg);
              }
            }, msg => {
              clearInterval(timer);
              reject(msg);
            });
          }, 1000);
        }, msg => reject(msg));
    });
  }
  close() {
    silex.utils.Notification.close();
  }
}

