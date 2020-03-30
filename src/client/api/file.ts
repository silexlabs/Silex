import { CloudStorage } from '../io/CloudStorage'
import { Config } from '../ClientConfig'
import { FileExplorer } from '../components/dialog/FileExplorer'
import { FileInfo } from '../third-party/types'
import { LOADING } from '../ui/types'
import { PersistantData } from '../flux/types'
import { Provider, PublicationOptions } from '../site/types'
import { SilexNotification } from '../utils/Notification'
import { SilexTasks } from '../io/SilexTasks'
import { addToLatestFiles } from '../io/latest-files'
import { closePublishDialog, openPublishDialog, startPublish } from '../components/dialog/PublishDialog'
import { getData } from '../flux/store'
import { getHtml, getSiteDocument, setHtml } from '../components/SiteFrame'
import { getSite, updateSite } from '../site/store'
import { initCssEditor } from '../components/dialog/CssEditor';
import { initHtmlEditor } from '../components/dialog/HtmlEditor';
import { initJsEditor } from '../components/dialog/JsEditor';
import { initializeData } from '../flux/dispatchers'
import { openDashboard } from '../components/dialog/Dashboard'
import { openSettingsDialog } from '../components/dialog/SettingsDialog'
import { setPreviewWindowLocation } from '../components/Workspace'
import { startObservers, stopObservers } from '../flux/observer'
import { updateUi, getUi } from '../ui/store'

///////////////////////////////////////////////////////////////////
// Read / write website HTML file
///////////////////////////////////////////////////////////////////

/**
 * save or save-as
 */
export function save(opt_fileInfo?: FileInfo, cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  // tracker.trackAction('controller-events', 'request', 'file.save', 0);
  if (opt_fileInfo && !getSite().isTemplate) {
    doSave((opt_fileInfo as FileInfo), cbk, opt_errorCbk);
  } else if (Config.singleSiteMode) {
    // do nothing in single site mode
    throw new Error('File has no name and can not "save as" in single site mode')
  } else {
    // choose a new name
    FileExplorer.getInstance()
        .saveAs('editable.html', FileExplorer.HTML_EXTENSIONS)
        .then((fileInfo) => {
          if (fileInfo != null ) {
            doSave((fileInfo as FileInfo), cbk, opt_errorCbk);
          } else {
            // user aborted save as
          }
        })
        .catch((error) => {
          // tracker.trackAction('controller-events', 'error', 'file.save', -1);
          if (opt_errorCbk) {
            opt_errorCbk(error);
          }
        });
  }
}

/**
 * save
 */
function doSave(fileInfo: FileInfo, cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  // relative urls only in the files
  let rawHtml = getHtml();

  // look for bug of firefox inserting quotes in url("")
  // FIXME: remove this!!
  if (rawHtml.indexOf('url(\'&quot;') > -1) {
    console.warn('I have found HTML entities in some urls, there us probably an error in the save process.');

    // log this (QA)
    // tracker.trackAction('controller-events', 'warning', 'file.save.corrupted', -1);

    // try to cleanup the mess
    rawHtml = rawHtml.replace(/url\('&quot;()(.+?)\1&quot;'\)/gi, (match, group1, group2) => {
      return 'url(\'' + group2 + '\')';
    });
  }

  // save to file
  saveAs(fileInfo, rawHtml, getData(), () => {
    // tracker.trackAction('controller-events', 'success', 'file.save', 1);
    // ControllerBase.lastSaveUndoIdx = ControllerBase.undoHistory.length - 1;
    SilexNotification.notifySuccess('File is saved.');
    setPreviewWindowLocation();
    if (cbk) {
      cbk();
    }
  },
  (error, msg) => {
    SilexNotification.alert('Save website', 'Error: I did not manage to save the file. \n' + (msg || error.message || ''),
    () => {
      if (opt_errorCbk) {
        opt_errorCbk(error);
      }
    });
    // tracker.trackAction('controller-events', 'error', 'file.save', -1);
  });
}

/**
 * save a file with a new name
 * @param cbk receives the raw HTML
 */
function saveAs(file: FileInfo, rawHtml: string, data: PersistantData, cbk: () => any, errCbk?: ((p1: any, p2: string) => any)) {
  // save the data
  updateSite({
    ...getSite(),
    file,
  })
  addToLatestFiles(file);

  CloudStorage.getInstance().write(
      (file as FileInfo), rawHtml,
      data, () => {
        updateSite({
          ...getSite(),
          isTemplate: false,
        })
        if (cbk) {
          cbk();
        }
      }, errCbk);
}

/**
 * load a website from the recent files list
 */
export function openRecent(fileInfo: FileInfo, cbk?: (() => any)) {
  // a recent file was selected
  loadFromUserFiles(
      fileInfo, (rawHtml, data: PersistantData) => cbk && cbk(),
      (err, message, code) => {
        console.error('Could not open recent file', err, message, code);
        // make silex visible
        if (cbk) {
          cbk();
        }
        // handle the error
        if (code === 403) {
          // user not logged in
          SilexNotification.confirm(
            'Open recent file', `Could not open this recent file, you probably need to connect to ${fileInfo.service} again.`,
            (ok) => {
              SilexNotification.alert('Open recent file', `
              I am trying to connect you to ${fileInfo.service} again,
              please accept the connection in the popup I have just opened then <strong>please wait</strong>.
              `, () => {});
              const ce = CloudStorage.getInstance().ce;
              // tslint:disable:no-string-literal
              ce['auth'](fileInfo.service).then((res) => {
                SilexNotification.close();
                if (ok) {
                  openRecent(fileInfo, cbk);
                }
              });
            },
          );
        } else {
          SilexNotification.confirm('Open recent file', `Could not open this recent file. ${ message }`, (ok) => {});
        }
      });
}

/**
 * open the dashboard
 * TODO: move this to the Dashboard component
 */
export function openDashboardToLoadAWebsite(cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  // tracker.trackAction('controller-events', 'request', 'file.new', 0);
  openDashboard({
    openFileInfo: (fileInfo: FileInfo) => {
      if (!fileInfo && !hasContent()) {
        // if the user closes the dialog and no website is being edited then
        // load default blank website
        loadBlankTemplate(cbk, opt_errorCbk);
      } else {
        if (fileInfo) {
          openRecent(fileInfo, cbk);
        }
      }
    },
    openTemplate: (url) => {
      if (!url && !hasContent()) {
        // if the user closes the dialog and no website is being edited then
        // load default blank website
        loadBlankTemplate(cbk, opt_errorCbk);
      } else {
        if (url) {
          // a template was selected
          loadFromServerTemplates(url, cbk, (err, msg) => onOpenError(err, msg, opt_errorCbk, true));
        }
      }
    },
    ready: () => {
      if (cbk) {
        cbk();
      }
    },
    error: (err) => {
      console.error('loading templates error');
      onOpenError(err, 'Loading templates error', opt_errorCbk);
    },
  });
}

/**
 * open a file
 */
export function openFile(cbk?: ((p1: FileInfo) => any), opt_errorCbk?: ((p1: any) => any), opt_cancelCbk?: (() => any)) {
  if (Config.singleSiteMode) {
    return;
  }

  // track success
  // tracker.trackAction('controller-events', 'request', 'file.open', 0);

  // let the user choose the file
  FileExplorer.getInstance().openFile(FileExplorer.HTML_EXTENSIONS)
      .then((fileInfo) => {
        if (fileInfo) {
          loadFromUserFiles(
              fileInfo,
              (rawHtml, data: PersistantData) => {
                // display and redraw
                SilexNotification.notifySuccess((getSite().title || 'Untitled website') + ' opened.');

                // track success
                // tracker.trackAction('controller-events', 'success', 'file.open', 1);
                if (cbk) {
                  cbk((fileInfo as FileInfo));
                }
              },
              // with loader
              (error: any, message) => {
                SilexNotification.alert('Open file', 'Error: I did not manage to open this file. \n' + (message || error.message || ''),
                () => {
                  if (opt_errorCbk) {
                    opt_errorCbk(error);
                  }
                });
                // tracker.trackAction('controller-events', 'error', 'file.open', -1);
              });
        } else {
          if (opt_cancelCbk) {
            opt_cancelCbk();
          }
        }
      })
      .catch((error) => {
        // tracker.trackAction('controller-events', 'error', 'file.open', -1);
        if (opt_errorCbk) {
          opt_errorCbk(error);
        }
      });
}

///////////////////////////////////////////////////////////////////
// Callbacks
///////////////////////////////////////////////////////////////////

function onOpenError(err: any, msg: string, opt_errorCbk?: ((p1: any) => any), loadBlankOnError: boolean = true) {
  console.error('opening template error', err);
  SilexNotification.alert('Open file', 'An error occured. ' + msg, () => {});
  if (opt_errorCbk) {
    opt_errorCbk(err);
  }
  if (loadBlankOnError && !hasContent()) {
    loadBlankTemplate();
  }
  // tracker.trackAction('controller-events', 'error', 'file.new', -1);
}

function publishError(message) {
  // tracker.trackAction('controller-events', 'error', 'file.publish', -1);
  console.error('Error: I did not manage to publish the file.', message);
  SilexNotification.alert('Publication',
      `<strong>An error occured.</strong><p>I did not manage to publish the website. ${
          message}</p><p><a href="${ Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`,
      () => {});
}

///////////////////////////////////////////////////////////////////
// Publication
///////////////////////////////////////////////////////////////////

/**
 * ask the user for a new file title
 * handle tracking and call the Dom helper
 */
export function publish() {
  if (SilexNotification.isActive) {
    console.warn(
        'Publish canceled because a modal dialog is opened already.');
    return;
  }
  // tracker.trackAction('controller-events', 'request', 'file.publish', 0);
  openPublishDialog()
      .then((publishOptions: PublicationOptions) => {
        if (publishOptions) {
          doPublish(publishOptions, (errMsg, warningMsg, finalPublicationOptions) => {
            if (errMsg) {
              closePublishDialog();
              publishError(errMsg);
            } else {
              if (warningMsg) {
                closePublishDialog();
                SilexNotification.alert('Publication', warningMsg, () => {});
                // tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
              } else {
                startPublish((finalPublicationOptions as PublicationOptions))
                .then((msg: string) => {
                  // tracker.trackAction('controller-events', 'success', 'file.publish', 1);
                  closePublishDialog();
                  SilexNotification.alert('Publication', msg, () => {});
                })
                .catch((msg) => {
                  closePublishDialog();
                  publishError(msg);
                });
              }
              }
          });
        } else {
          // tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
        }
      })
      .catch((msg) => publishError(msg));
}

function doPublish(
    publicationOptions: PublicationOptions,
    cbk: (p1: string, p2: string, p3: PublicationOptions) => any) {
  if (Config.singleSiteMode && publicationOptions.file) {
    publicationOptions.publicationPath = {
      ...publicationOptions.publicationPath,
      path: publicationOptions.file.path.split('/').slice(0, -1).join('/'),
    };
  }
  const publicationPath = publicationOptions.publicationPath;
  const provider = publicationOptions.provider;

  // get info about the website file
  const file = getSite().file;
  const isTemplate = getSite().isTemplate;

  // save new path when needed and get publication path
  if (publicationPath) {
    updateSite({
      ...getSite(),
      publicationPath,
    });
  }
  const folder = getSite().publicationPath;

  // the file must be saved somewhere because all URLs are made relative
  if (!folder) {
    openSettingsDialog(
        () => {},
        // here the panel was closed
        'publish-pane');
    cbk(null,
        'I do not know where to publish your site.' +
            'Select a folder in the settings pannel and do "publish" again.' +
            '\nNow I will open the publish settings.',
        null);
  } else {
    if (!file || isTemplate) {
      console.error('The file must be saved before I can publish it.');
      cbk(null, 'The file must be saved before I can publish it.', null);
    } else {
      if (!provider) {
        const providerName = getSite().hostingProvider;
        if (!providerName) {
          throw new Error(
              'I need a hosting provider name for this website. And none is configured.');
        } else {
          SilexTasks.getInstance().hosting((hosting) => {
            const storedProvider: Provider =
                hosting.providers.find((p) => p.name === providerName);
            if (!storedProvider) {
              SilexNotification.alert('Publication', `
                <p>Unknown provider ${providerName}.</p>
                <p>Is it configured on this servier? Here are the hosting providers I know:
                ${hosting.providers.map((p) => p.name).join(', ')}</p>
              `, () => {});
              throw new Error(`
                Unknown provider ${providerName}.
                Is it configured on this servier? Here are the hosting providers I know: <ul>${hosting.providers
                .map((p) => '<li>' + p.name + '</li>')
                .join('')}</ul>
              `);
            }
            cbk(null, null, ({
                  file,
                  publicationPath: folder,
                  provider: storedProvider,
                } as PublicationOptions));
          });
        }
      } else {
        cbk(null, null, ({
          file,
          publicationPath: folder,
          provider,
        } as PublicationOptions));
      }
    }
  }
}

///////////////////////////////////////////////////////////////////
// Utils
///////////////////////////////////////////////////////////////////

/**
 * @return true if a website is being edited
 * TODO: move this to the SiteFrame component or use getElements().length
 */
function hasContent(): boolean {
  const contentDocument = getSiteDocument()
  return !!contentDocument.body && contentDocument.body.childNodes.length > 0;
}

/**
 * load a silex html editable file from the templates located on the server
 * will not be able to save until the user choose a file name
 */
function loadFromServerTemplates(
    path: string,
    cbk: ((p1: string, data: PersistantData) => any) = null,
    errCbk: ((p1: any, p2: string) => any) = null) {
  doLoadWebsite({
    site: {
      file: ({isDir: false, mime: 'text/html'} as FileInfo),
      isTemplate: true,
    },
    path,
    cbk, errCbk,
  })
}

/**
 * load blank template
 */
function loadBlankTemplate(cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  const blankUrl = '/libs/templates/silex-blank-templates/blank/editable.html';
  loadFromServerTemplates(blankUrl, cbk, (err, msg) => onOpenError(err, msg, opt_errorCbk, false));
}

/**
 * load a new file
 * @param cbk receives the raw HTML and the stored data
 */
function loadFromUserFiles(file: FileInfo, cbk: (p1: string, data: PersistantData) => any,
    errCbk?: ((p1: any, msg: string, code?: number) => any)) {
  console.log('load', file)
  doLoadWebsite({
    site: {
      file,
      isTemplate: true,
    },
    path: file.absPath,
    cbk: (rawHtml: string, data: PersistantData) => {
      console.log('loaded', file)
      addToLatestFiles(file);
      if (cbk) {
        cbk(rawHtml, data);
      }
    },
    errCbk,
  })
}

function doLoadWebsite({site, path, cbk, errCbk}: {
    site: any,
    path: string,
    cbk: ((p1: string, data: PersistantData) => any),
    errCbk: ((p1: any, p2: string) => any),
  }) {
  updateUi({
    ...getUi(),
    loading: LOADING.WEBSITE,
  })
  CloudStorage.getInstance().loadWebsite(path, (rawHtml: string, data: PersistantData) => {
    // display the site HTML in the SiteIframe component
    setHtml(rawHtml, () => {
      // code editors need to start listening to store
      // was done in the Workspace component but the later the better
      initCssEditor()
      initJsEditor()
      initHtmlEditor()

      // now update the store
      initializeData(data)
      stopObservers()
      updateSite({
        ...getSite(),
        ...site,
      })
      startObservers()
      updateUi({
        ...getUi(),
        loading: LOADING.NONE,
      })
      if (cbk) {
        cbk(rawHtml, data);
      }
    })
  }, errCbk);
}
