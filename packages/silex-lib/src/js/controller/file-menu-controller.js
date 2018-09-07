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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
goog.provide('silex.controller.FileMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.FileMenuController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  /**
   * @type {silex.service.SilexTasks}
   */
  this.service = silex.service.SilexTasks.getInstance();
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.FileMenuController, silex.controller.ControllerBase);


/**
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.loadTemplate = function(url, opt_cbk, opt_errorCbk) {
  this.model.file.openFromUrl(url, rawHtml => this.onOpened(opt_cbk, rawHtml), (err, msg) => this.onOpenError(err, msg, opt_errorCbk));
};


/**
 * load blank template
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.loadBlank = function(opt_cbk, opt_errorCbk) {
  const blankUrl = '/libs/templates/silex-blank-templates/blank/editable.html';
  this.loadTemplate(blankUrl, opt_cbk, opt_errorCbk);
};


/**
 * open a file
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.newFile = function(opt_cbk, opt_errorCbk) {

  this.tracker.trackAction('controller-events', 'request', 'file.new', 0);
  this.view.dashboard.openDialog({
    openFileInfo: (fileInfo) => {
      if(!fileInfo && !this.model.file.hasContent()) {
        // if the user closes the dialog and no website is being edited then load default blank website
        this.loadBlank(opt_cbk, opt_errorCbk);
      }
      else if(fileInfo) {
        // a recent file was selected
        this.model.file.open(/** @type {FileInfo} */ (fileInfo), rawHtml => this.onOpened(opt_cbk, rawHtml), err => this.onOpenError(err, 'Could not open this recent file, are you connected to ' + fileInfo.service + '?', opt_errorCbk));
      }
    },
    openTemplate: (url) => {
      if(!url && !this.model.file.hasContent()) {
        // if the user closes the dialog and no website is being edited then load default blank website
        this.loadBlank(opt_cbk, opt_errorCbk);
      }
      else if(url) {
        // a template was selected
        this.loadTemplate(url, opt_cbk, opt_errorCbk);
      }
    },
    ready: () => {
      if(opt_cbk) {
        opt_cbk();
      }
    },
    error: err => {
      console.error('loading templates error');
      this.onOpenError(err, 'Loading templates error', opt_errorCbk);
    },
  });
};

silex.controller.FileMenuController.prototype.onOpened = function(opt_cbk, rawHtml) {
  // reset file URL in order to "save as" instead of "save"
  // this.model.file.setUrl(null);
  this.model.file.setHtml(rawHtml, () => {
    // undo redo reset
    this.undoReset();
    this.fileOperationSuccess(null, true);
  }, true); // with loader
  // QOS, track success
  this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
  if(opt_cbk) {
    opt_cbk();
  }
};


/**
 * @param {Object} err
 * @param {string} msg
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.onOpenError = function(err, msg, opt_errorCbk) {
  console.error('opening template error', err);
  silex.utils.Notification.alert('An error occured. ' + msg, () => {});
  if (opt_errorCbk) {
    opt_errorCbk(err);
  }
  if(!this.model.file.hasContent()) {
    this.loadBlank();
  }
  this.tracker.trackAction('controller-events', 'error', 'file.new', -1);

};

/**
 * open a file
 * @param {?function(!FileInfo)=} opt_cbk
 * @param {?function(*)=} opt_errorCbk
 * @param {?function()=} opt_cancelCbk
 */
silex.controller.FileMenuController.prototype.openFile = function(opt_cbk, opt_errorCbk, opt_cancelCbk) {
  // QOS, track success
  this.tracker.trackAction('controller-events', 'request', 'file.open', 0);
  // let the user choose the file
  this.view.fileExplorer.openFile(FileExplorer.HTML_EXTENSIONS)
    .then(fileInfo => {
      if(fileInfo) {
        this.model.file.open(fileInfo, rawHtml => {
          this.model.file.setHtml(rawHtml, () => {
            // undo redo reset
            this.undoReset();
            // display and redraw
            this.fileOperationSuccess((this.model.head.getTitle() || 'Untitled website') + ' opened.', true);
            // QOS, track success
            this.tracker.trackAction('controller-events', 'success', 'file.open', 1);
            if (opt_cbk) {
              opt_cbk(/** @type {FileInfo} */ (fileInfo));
            }
          }, true); // with loader
        },
          (error, message) => {
            silex.utils.Notification.alert('Error: I did not manage to open this file. \n' + (message || error.message || ''), () => {
              if (opt_errorCbk) {
                opt_errorCbk(error);
              }
            });
            this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
          });
      }
      else {
        if(opt_cancelCbk) opt_cancelCbk();
      }
    })
    .catch(error => {
      this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
      if (opt_errorCbk) {
        opt_errorCbk(error);
      }
    });
};


/**
 * display loader while we get data from service
 */
silex.controller.FileMenuController.prototype.loading = function(on) {
  if(on) {
    this.view.stage.element.classList.add(silex.model.File.LOADING_LIGHT_CSS_CLASS);
  }
  else {
    this.view.stage.element.classList.remove(silex.model.File.LOADING_LIGHT_CSS_CLASS);
  }
};


/**
 * ask the user for a new file title
 * handle tracking and call the Dom helper
 */
silex.controller.FileMenuController.prototype.publish = function() {
  if(silex.utils.Notification.isActive) {
    console.warn('Publish canceled because a modal dialog is opened already.');
    return;
  }
  this.loading(true);
  this.service.hosting(hosting => {
    this.loading(false);
    if(hosting.providers.length === 0) {
      this.doPublish(null);
    }
    else if(hosting.skipProviderSelection === true) {
      const provider = hosting.providers[0];
      this.onSelectProvider(provider);
    }
    else {
      this.selectProvider(hosting.providers);
    }
  }, msg => {
    this.loading(false);
    console.error('Error: I did not manage to publish the file. (2)', msg);
    silex.utils.Notification.alert(`<strong>An error occured.</strong><p>I did not manage to publish the website. I could not get the list of hosting providers for this instance of Silex.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`, () => {});
    this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
  });
};


/**
 * @param {Array<Provider>} providers
 */
silex.controller.FileMenuController.prototype.selectProvider = function(providers) {
  silex.utils.Notification.prompt('Choose the hosting provider you love!', 'unused', ok => {
    if(ok) {
      this.model.head.setHostingProvider(selectEl.value);
      if(selectEl.value === 'custom') {
        this.doPublish(null);
      }
      else {
        const idx = selectEl.selectedIndex;
        const provider = providers[idx];
        this.onSelectProvider(provider);
      }
    }
  }, 'next');
  const body = silex.utils.Notification.getFormBody();
  body.innerHTML = `
    <select class="providers">
      ${ providers.map(p => `<option value="${ p.name }">${ p.displayName }</option>`) }
      <option value="custom">Use the website settings (use this for FTP, Webdav, ...)</option>
    </select>
    <br />
  `;
  const selectEl = body.querySelector('.providers');
  const providerName = this.model.head.getHostingProvider();
  if(providerName) selectEl.value = providerName;
};


/**
 * @param {Provider} provider
 */
silex.controller.FileMenuController.prototype.onSelectProvider = function(provider) {
  if(provider.isLoggedIn) this.selectVhost(provider);
  else {
    this.loading(true);
    this.service.authorize(provider, loginUrl => {
      this.loading(false);
      silex.utils.Notification.alert(`Please&nbsp;
          <a href="${ loginUrl }" target="_blank">
            click here and login to ${ provider.displayName }.
          </a>, then click "next".
          `, () => {
            this.selectVhost(provider);
          }, 'next', 'cancel');
    }, msg => {
      this.loading(false);
      console.error('Error: I did not manage to publish the file.', msg);
      silex.utils.Notification.alert(`<strong>An error occured.</strong><p>I did not manage to publish the website. I could not authenticate with ${ provider.name } hosting provider.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`, () => {});
      this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
    });
  }
};

silex.controller.FileMenuController.prototype.selectVhost = function(provider) {
  this.loading(true);
  this.service.vhosts(provider, vhosts => {
    this.loading(false);
    if(vhosts.length === 0) {
      silex.utils.Notification.alert(`Please click here to
        <a href="${ provider.dashboardUrl }" target="_blank">
          ${ provider.pleaseCreateAVhost }
        </a>
      `, () => {
        this.selectVhost(provider);
      }, 'Check again');
    }
    else if(provider.skipVhostSelection === true) {
      this.selectDomain(provider, vhosts[0]);
    }
    else {
      silex.utils.Notification.prompt('Choose the website you are working on', 'unused', ok => {
        if(ok) {
          const idx = selectEl.selectedIndex;
          const vhost = vhosts[idx];
          this.selectDomain(provider, vhost);
        }
      }, 'next');
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
  }, msg => {
    this.loading(false);
    console.error('Error: I did not manage to publish the file.', msg);
    silex.utils.Notification.alert(`<strong>An error occured.</strong><p>I did not manage to publish the website. I could not get the list of vhost for ${ provider.name } hosting provider.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`, () => {});
    this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
  });
};

silex.controller.FileMenuController.prototype.setDomain = function(newDomain, https) {
  if(newDomain != '')
    this.model.head.setWebsiteUrl((https ? 'https://' : 'http://') + newDomain);
  else
    this.model.head.setWebsiteUrl(null);
};

silex.controller.FileMenuController.prototype.selectDomain = function(provider, vhost) {
  this.loading(true);
  this.service.domain(vhost, res => {
    const domain = res['domain'];
    const https = res['https'];
    this.loading(false);
    if(vhost.skipDomainSelection === true) {
      this.doPublish(vhost.publicationPath);
    }
    else {
      const initialDomain = domain || '';
      silex.utils.Notification.prompt(`Choose the domain you want associated with this website<br>(or leave blanck to have a generic domain)<br>You can <a target="_blank" href="${ provider.buyDomainUrl }">buy a domain name here.</a>`, initialDomain, (ok, newDomain) => {
        const saveDomainInWebsiteSettings = () => {
          this.setDomain(newDomain, https);
        };
        const updateOrRemove = res => {
          const domain = res['domain'];
          const https = res['https'];
          this.loading(false);
          this.setDomain(domain, https);
          silex.utils.Notification.notifyInfo('Domain updated');
          this.doPublish(vhost.publicationPath);
          saveDomainInWebsiteSettings();
        };
        const err = (msg) => {
          this.loading(false);
          console.error('Error: I did not manage to publish the file.', msg);
          silex.utils.Notification.alert(`<strong>An error occured.</strong><p>I did not manage to publish the website because I could not update the domaine name for the website ${ vhost.name } hosting provider.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`, () => {});
          this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
        };
        if(ok) {
          if(newDomain != initialDomain) {
            this.loading(true);
            if(newDomain != '')
              this.service.updateDomain(vhost, newDomain, res => updateOrRemove(res), msg => err(msg));
            else
              this.service.removeDomain(vhost, newDomain, res => updateOrRemove(res), msg => err(msg));
          }
          else {
            saveDomainInWebsiteSettings();
            this.doPublish(vhost.publicationPath);
          }
        }
      }, 'next');
    }
  }, msg => {
    console.error('Error: I did not manage to publish the file.', msg);
    silex.utils.Notification.alert(`<strong>An error occured.</strong><p>I did not manage to publish the website. I could not get the list of vhost for ${ provider.name } hosting provider.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`, () => {});
    this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
  });
};

silex.controller.FileMenuController.prototype.doPublish = function(path) {
  // get info about the website file
  const file = this.model.file.getFileInfo();
  const isTemplate = this.model.file.isTemplate;
  // save new path when needed and get publication path
  if(path) this.model.head.setPublicationPath(path);
  const folder = this.model.head.getPublicationPath();
  this.tracker.trackAction('controller-events', 'request', 'file.publish', 0);
  if (!folder) {
    silex.utils.Notification.alert('I do not know where to publish your site.' +
      'Select a folder in the settings pannel and do "publish" again.' +
      '\nNow I will open the publish settings.',
      () => {
        this.view.settingsDialog.open(function() {
          //here the panel was closed
        }, 'publish-pane');
        this.view.workspace.redraw(this.view);
        this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
      });
  }
  // the file must be saved somewhere because all URLs are made relative
  else if (!file || isTemplate) {
    console.error('The file must be saved before I can publish it.');
    silex.utils.Notification.notifyError('The file must be saved before I can publish it.');
    this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
  }
  else {
    let timer = -1;
    silex.utils.Notification.alert('<strong>I am about to publish your site. This may take several minutes.</strong>', () => {
      if(timer > 0) {
        clearInterval(timer);
      }
      timer = -1;
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
              msg += `<p>Please visit <a target="_blanck" href="${ websiteUrl }/index.html">your published website here</a>. Depending on the hosting provider, you may need to wait a few minutes before your changes are visible.</p>`;
            }
            silex.utils.Notification.setText(msg);
          }, msg => {
            console.error('Error: ', msg);
            silex.utils.Notification.setText(`<strong>An error occured.</strong><p>I did not manage to publish the website. You may want to check the publication settings and your internet connection.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`);
            clearInterval(timer);
          });
        }, 1000);
        this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
      },
      msg => {
        this.loading(false);
        console.error('Error: I did not manage to publish the file. (2)', msg);
        silex.utils.Notification.setText(`<strong>An error occured.</strong><p>I did not manage to publish the website. You may want to check the publication settings and your internet connection.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`);
        this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
      });
  }
};

