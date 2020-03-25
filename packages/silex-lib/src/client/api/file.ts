import { FileExplorer } from '../components/dialog/FileExplorer'
import { SilexNotification } from '../utils/Notification'
import { FileInfo } from '../third-party/types'
import { Config } from '../ClientConfig'
import { getData } from '../flux/store'
import { DataModel } from '../flux/types'
import { CloudStorage } from '../io/CloudStorage'
import { getSite, updateSite } from '../site/store'
import { getSiteDocument, getUiElements } from '../ui/UiElements'
import { selectBody } from '../element/dispatchers'
import { initStageWrapper, stageCleanup } from '../components/StageWrapper'
import { addToLatestFiles } from '../io/latest-files'
import { setPreviewWindowLocation } from '../components/Workspace'
import { setHtml, getHtml } from '../components/SiteFrame'
import { openPublishDialog, closePublishDialog, startPublish } from '../components/dialog/PublishDialog'
import { openDashboard } from '../components/dialog/Dashboard'
import { PublicationOptions, Provider } from '../site/types'
import { openSettingsDialog } from '../components/dialog/SettingsDialog'
import { SilexTasks } from '../io/SilexTasks'
import { initializeData } from '../flux/dispatchers'

/**
 * save or save-as
 */
export function save(opt_fileInfo?: FileInfo, opt_cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  // tracker.trackAction('controller-events', 'request', 'file.save', 0);
  if (opt_fileInfo && !getSite().isTemplate) {
    doSave((opt_fileInfo as FileInfo), opt_cbk, opt_errorCbk);
  } else if (Config.singleSiteMode) {
    // do nothing in single site mode
    throw new Error('File has no name and can not "save as" in single site mode')
  } else {
    // choose a new name
    FileExplorer.getInstance()
        .saveAs('editable.html', FileExplorer.HTML_EXTENSIONS)
        .then((fileInfo) => {
          if (fileInfo != null ) {
            doSave((fileInfo as FileInfo), opt_cbk, opt_errorCbk);
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
 * save or save-as
 */
function doSave(fileInfo: FileInfo, opt_cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
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
    fileOperationSuccess('File is saved.', false);
    setPreviewWindowLocation();
    if (opt_cbk) {
      opt_cbk();
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
 * success of an operation involving changing the file model
 */
export function fileOperationSuccess(opt_message?: string, opt_updateTools?: boolean) {
  // notify user
  if (opt_message) {
    SilexNotification.notifySuccess(opt_message);
  }
}

export function loadTemplate(
    url, opt_cbk?: (() => any),
    opt_errorCbk?: ((p1: any) => any)) {
      openFromUrl(
        url, (rawHtml: string, data: DataModel) => onOpened(opt_cbk, rawHtml, data),
        (err, msg) => onOpenError(err, msg, opt_errorCbk));
}

/**
 * load blank template
 */
export function loadBlank(
    opt_cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  const blankUrl =
      '/libs/templates/silex-blank-templates/blank/editable.html';
  loadTemplate(blankUrl, opt_cbk, opt_errorCbk);
}

export function openRecent(fileInfo, opt_cbk) {
  // a recent file was selected
  open(
      (fileInfo as FileInfo), (rawHtml, data: DataModel) => onOpened(opt_cbk, rawHtml, data),
      (err, message, code) => {
        console.error('Could not open recent file', err, message, code);
        // make silex visible
        if (opt_cbk) {
          opt_cbk();
        }
        // handle the error
        if (code === 403) {
          // user not logged in
          SilexNotification.confirm(
            'Open recent file', `Could not open this recent file, you probably need to connect to ${fileInfo.service} again.`,
            (ok) => {
              const ce = CloudStorage.getInstance().ce;
              SilexNotification.alert('Open recent file', `
                I am trying to connect you to ${fileInfo.service} again,
                please accept the connection in the popup I have just opened then <strong>please wait</strong>.
              `, () => {});
              // tslint:disable:no-string-literal
              ce['auth'](fileInfo.service).then((res) => {
                SilexNotification.close();
                if (ok) {
                  openRecent(fileInfo, opt_cbk);
                }
              });
            },
          );
        } else {
          SilexNotification.confirm('Open recent file', `
            Could not open this recent file. ${ message }
          `,
          (ok) => {});
        }
      });
}

/**
 * open a file
 */
export function newFile(opt_cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
  // tracker.trackAction('controller-events', 'request', 'file.new', 0);
  openDashboard({
    openFileInfo: (fileInfo) => {
      if (!fileInfo && !hasContent()) {
        // if the user closes the dialog and no website is being edited then
        // load default blank website
        loadBlank(opt_cbk, opt_errorCbk);
      } else {
        if (fileInfo) {
          openRecent(fileInfo, opt_cbk);
        }
      }
    },
    openTemplate: (url) => {
      if (!url && !hasContent()) {
        // if the user closes the dialog and no website is being edited then
        // load default blank website
        loadBlank(opt_cbk, opt_errorCbk);
      } else {
        if (url) {
          // a template was selected
          loadTemplate(url, opt_cbk, opt_errorCbk);
        }
      }
    },
    ready: () => {
      if (opt_cbk) {
        opt_cbk();
      }
    },
    error: (err) => {
      console.error('loading templates error');
      onOpenError(err, 'Loading templates error', opt_errorCbk);
    },
  });
}

function onOpened(opt_cbk, rawHtml: string, data: DataModel) {
  stageCleanup();

  setHtml(rawHtml, () => {

    initializeData(data);

    // reset stage
    initStageWrapper(getUiElements().stage);

    // init selection
    selectBody();

    // undo redo reset
    // undoReset();
    fileOperationSuccess(null, true);
  }, true);

  // with loader
  // track success
  // tracker.trackAction('controller-events', 'success', 'file.new', 1);
  if (opt_cbk) {
    opt_cbk();
  }
}

function onOpenError(err: any, msg: string, opt_errorCbk?: ((p1: any) => any)) {
  console.error('opening template error', err);
  SilexNotification.alert('Open file', 'An error occured. ' + msg, () => {});
  if (opt_errorCbk) {
    opt_errorCbk(err);
  }
  if (!hasContent()) {
    loadBlank();
  }
  // tracker.trackAction('controller-events', 'error', 'file.new', -1);
}

/**
 * @return true if a website is being edited
 */
function hasContent(): boolean {
  const contentDocument = getSiteDocument()
  return !!contentDocument.body && contentDocument.body.childNodes.length > 0;
}

/**
 * open a file
 */
export function openFile(opt_cbk?: ((p1: FileInfo) => any), opt_errorCbk?: ((p1: any) => any), opt_cancelCbk?: (() => any)) {
  if (Config.singleSiteMode) {
    return;
  }

  // track success
  // tracker.trackAction('controller-events', 'request', 'file.open', 0);

  // let the user choose the file
  FileExplorer.getInstance().openFile(FileExplorer.HTML_EXTENSIONS)
      .then((fileInfo) => {
        if (fileInfo) {
          open(
              fileInfo,
              (rawHtml) => {
                stageCleanup();
                setHtml(rawHtml, () => {
                  // undo redo reset
                  // undoReset();

                  // display and redraw
                  fileOperationSuccess((getSite().title || 'Untitled website') + ' opened.', true);

                  // track success
                  // tracker.trackAction('controller-events', 'success', 'file.open', 1);
                  if (opt_cbk) {
                    opt_cbk((fileInfo as FileInfo));
                  }
                }, true);
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
/**
 * load an arbitrary url as a silex html editable file
 * will not be able to save
 * @export
 */
export function openFromUrl(
    url: string, opt_cbk: ((p1: string, data: DataModel) => any) = null,
    opt_errCbk: ((p1: any, p2: string) => any) = null) {

  CloudStorage.getInstance().loadLocal(
      url, (rawHtml: string, data: DataModel) => {
        this.close();
        updateSite({
          ...getSite(),
          file: ({isDir: false, mime: 'text/html'} as FileInfo),
          isTemplate: true,
        })
        if (opt_cbk) {
          opt_cbk(rawHtml, data);
        }
      }, opt_errCbk);
}

/**
 * save a file with a new name
 * @param cbk receives the raw HTML
 * @export
 */
export function saveAs(file: FileInfo, rawHtml: string, data: DataModel, cbk: () => any, opt_errCbk?: ((p1: any, p2: string) => any)) {
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
      }, opt_errCbk);
}

/**
 * load a new file
 * @param cbk receives the raw HTML
 */
export function open(file: FileInfo, cbk: (p1: string, data: DataModel) => any,
    opt_errCbk?: ((p1: any, msg: string, code: number) => any)) {
  CloudStorage.getInstance().read(
    file, (rawHtml: string, data: DataModel) => {
      // update model
      this.close();
      updateSite({
        ...getSite(),
        file,
        isTemplate: false,
      })
      this.addToLatestFiles(file);
      if (cbk) {
        cbk(rawHtml, data);
      }
    }, opt_errCbk);
}

/**
 * reset data, close file
 */
export function close() {
  updateSite({
    ...getSite(),
    file: null,
  })
}

export function publishError(message) {
  // tracker.trackAction('controller-events', 'error', 'file.publish', -1);
  console.error('Error: I did not manage to publish the file.', message);
  SilexNotification.alert('Publication',
      `<strong>An error occured.</strong><p>I did not manage to publish the website. ${
          message}</p><p><a href="${ Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`,
      () => {});
}

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
