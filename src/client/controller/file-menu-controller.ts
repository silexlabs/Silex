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
import { FileInfo, Model, PublicationOptions, View, Provider } from '../types';
import { SilexNotification } from '../utils/notification';
import { FileExplorer } from '../view/dialog/file-explorer';
import { PublishDialog } from '../view/dialog/PublishDialog';
import { ControllerBase } from './controller-base';
import { CloudStorage } from '../service/cloud-storage';
import { Config } from '../ClientConfig';
import { SilexTasks } from '../service/silex-tasks';

/**
 * @param view  view class which holds the other views
 */
export class FileMenuController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  loadTemplate(
      url, opt_cbk?: (() => any),
      opt_errorCbk?: ((p1: Object) => any)) {
    this.model.file.openFromUrl(
        url, (rawHtml) => this.onOpened(opt_cbk, rawHtml),
        (err, msg) => this.onOpenError(err, msg, opt_errorCbk));
  }

  /**
   * load blank template
   */
  loadBlank(
      opt_cbk?: (() => any), opt_errorCbk?: ((p1: Object) => any)) {
    const blankUrl =
        '/libs/templates/silex-blank-templates/blank/editable.html';
    this.loadTemplate(blankUrl, opt_cbk, opt_errorCbk);
  }

  openRecent(fileInfo, opt_cbk) {
    // a recent file was selected
    this.model.file.open(
        (fileInfo as FileInfo), (rawHtml) => this.onOpened(opt_cbk, rawHtml),
        (err) => {
          SilexNotification.confirm('Open recent file', `
            Could not open this recent file, you probably need to connect to ${fileInfo.service} again.
          `,
          (ok) => {
            const ce = CloudStorage.getInstance().ce;
            SilexNotification.alert('Open recent file', `
              I am trying to connect you to ${fileInfo.service} again,
              please accept the connection in the popup I have just opened then <strong>please wait</strong>.
            `,
                () => {});
            ce['auth'](fileInfo.service).then((res) => {
              SilexNotification.close();
              if (ok) {
                this.openRecent(fileInfo, opt_cbk);
              }
            });
          });
        });
  }

  /**
   * open a file
   */
  newFile(
      opt_cbk?: (() => any), opt_errorCbk?: ((p1: Object) => any)) {
    this.tracker.trackAction('controller-events', 'request', 'file.new', 0);
    this.view.dashboard.openDialog({
      openFileInfo: (fileInfo) => {
        if (!fileInfo && !this.model.file.hasContent()) {
          // if the user closes the dialog and no website is being edited then
          // load default blank website
          this.loadBlank(opt_cbk, opt_errorCbk);
        } else {
          if (fileInfo) {
            this.openRecent(fileInfo, opt_cbk);
          }
        }
      },
      openTemplate: (url) => {
        if (!url && !this.model.file.hasContent()) {
          // if the user closes the dialog and no website is being edited then
          // load default blank website
          this.loadBlank(opt_cbk, opt_errorCbk);
        } else {
          if (url) {
            // a template was selected
            this.loadTemplate(url, opt_cbk, opt_errorCbk);
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
        this.onOpenError(err, 'Loading templates error', opt_errorCbk);
      }
    });
  }

  onOpened(opt_cbk, rawHtml) {
    // reset file URL in order to "save as" instead of "save"
    // this.model.file.setUrl(null);
    this.model.file.setHtml(rawHtml, () => {
      // undo redo reset
      this.undoReset();
      this.fileOperationSuccess(null, true);
    }, true);

    // with loader
    // QOS, track success
    this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
    if (opt_cbk) {
      opt_cbk();
    }
  }

  onOpenError(err: Object, msg: string, opt_errorCbk?: ((p1: Object) => any)) {
    console.error('opening template error', err);
    SilexNotification.alert('Open file', 'An error occured. ' + msg, () => {});
    if (opt_errorCbk) {
      opt_errorCbk(err);
    }
    if (!this.model.file.hasContent()) {
      this.loadBlank();
    }
    this.tracker.trackAction('controller-events', 'error', 'file.new', -1);
  }

  /**
   * open a file
   */
  openFile(opt_cbk?: ((p1: FileInfo) => any), opt_errorCbk?: ((p1: any) => any), opt_cancelCbk?: (() => any)) {
    // QOS, track success
    this.tracker.trackAction('controller-events', 'request', 'file.open', 0);

    // let the user choose the file
    this.view.fileExplorer.openFile(FileExplorer.HTML_EXTENSIONS)
        .then((fileInfo) => {
          if (fileInfo) {
            this.model.file.open(
                fileInfo,
                (rawHtml) => {
                  this.model.file.setHtml(rawHtml, () => {
                    // undo redo reset
                    this.undoReset();

                    // display and redraw
                    this.fileOperationSuccess(
                        (this.model.head.getTitle() || 'Untitled website') +
                            ' opened.',
                        true);

                    // QOS, track success
                    this.tracker.trackAction(
                        'controller-events', 'success', 'file.open', 1);
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
                  this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
                });
          } else {
            if (opt_cancelCbk) {
              opt_cancelCbk();
            }
          }
        })
        .catch((error) => {
          this.tracker.trackAction(
              'controller-events', 'error', 'file.open', -1);
          if (opt_errorCbk) {
            opt_errorCbk(error);
          }
        });
  }

  publishError(message) {
    this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
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
  publish() {
    if (SilexNotification.isActive) {
      console.warn(
          'Publish canceled because a modal dialog is opened already.');
      return;
    }
    this.tracker.trackAction('controller-events', 'request', 'file.publish', 0);
    const dialog: PublishDialog = new PublishDialog(this.model, this.view);
    dialog.open()
        .then((publishOptions) => {
          if (publishOptions) {
            this.doPublish(publishOptions, (errMsg, warningMsg, finalPublicationOptions) => {
              if (errMsg) {
                dialog.close();
                this.publishError(errMsg);
              } else {
                if (warningMsg) {
                  dialog.close();
                  SilexNotification.alert('Publication', warningMsg, () => {});
                  this.tracker.trackAction(
                      'controller-events', 'cancel', 'file.publish', 0);
                } else {
                  dialog
                  .publish((finalPublicationOptions as PublicationOptions))
                  .then((msg: string) => {
                    this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
                    dialog.close();
                    SilexNotification.alert('Publication', msg, () => {});
                  })
                  .catch((msg) => {
                    dialog.close();
                    this.publishError(msg);
                  });
                }
               }
            });
          } else {
            this.tracker.trackAction(
                'controller-events', 'cancel', 'file.publish', 0);
          }
        })
        .catch((msg) => this.publishError(msg));
  }

  doPublish(
      publicationOptions: PublicationOptions,
      cbk: (p1: string, p2: string, p3: PublicationOptions) =>
          any) {
    const publicationPath = publicationOptions['publicationPath'];
    const provider = publicationOptions['provider'];
    const vhost = publicationOptions['vhost'];

    // get info about the website file
    const file = this.model.file.getFileInfo();
    const isTemplate = this.model.file.isTemplate;

    // save new path when needed and get publication path
    if (publicationPath) {
      this.model.head.setPublicationPath(publicationPath);
    }
    const folder = this.model.head.getPublicationPath();

    // the file must be saved somewhere because all URLs are made relative
    if (!folder) {
      this.view.settingsDialog.open(
          function() {},
          // here the panel was closed
          'publish-pane');
      this.view.workspace.redraw(this.view);
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
          const providerName = this.model.head.getHostingProvider();
          if (!providerName) {
            throw new Error(
                'I need a hosting provider name for this website. And none is configured.');
          } else {
            SilexTasks.getInstance().hosting((hosting) => {
              const storedProvider: Provider =
                  hosting['providers'].find((p) => p['name'] === providerName);
              if (!storedProvider) {
                SilexNotification.alert('Publication', `
                  <p>Unknown provider ${providerName}.</p>
                  <p>Is it configured on this servier? Here are the hosting providers I know:
                  ${hosting['providers'].map((p) => p['name']).join(', ')}</p>
                `, () => {});
                throw new Error(`
                  Unknown provider ${providerName}.
                  Is it configured on this servier? Here are the hosting providers I know: <ul>${hosting['providers']
                  .map((p) => '<li>' + p['name'] + '</li>')
                  .join('')}</ul>
                `);
              }
              cbk(null, null, ({
                    'file': file,
                    'publicationPath': folder,
                    'provider': storedProvider
                  } as PublicationOptions));
            });
          }
        } else {
          cbk(null, null, ({
            'file': file,
            'publicationPath': folder,
            'provider': provider
          } as PublicationOptions));
        }
      }
    }
  }
}
