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
import { Model, View } from '../ClientTypes';
import { ControllerBase } from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class SettingsDialogController extends ControllerBase {

  constructor(model: Model, view: View) {
    super(model, view);
  }

  // /**
  //  * the user clicked "browse" button in the publish settings panel
  //  */
  // browsePublishPath(opt_cbk) {
  //   // create the promise
  //   const promise = this.view.fileExplorer.openFolder();

  //   // add tracking and undo/redo checkpoint
  //   this.track(promise, 'publish.browse');
  //   this.undoredo(promise);

  //   // handle the result
  //   promise
  //       .then((fileInfo) => {
  //         if (fileInfo) {
  //           // set the new publication path
  //           updateSite({
  //             ...getSite(),
  //             publicationPath: fileInfo,
  //           })

  //           // notify caller (used to reopen settings)
  //           if (opt_cbk) {
  //             opt_cbk();
  //           }
  //         }
  //       })
  //       .catch((error) => {
  //         SilexNotification.notifyError(
  //             'Error: I could not select the publish path. <br /><br />' +
  //             (error.message || ''));
  //       });
  // }

  // /**
  //  * the user clicked "browse" button to choose a favicon
  //  */
  // browseFaviconPath(opt_cbk) {
  //   // create the promise
  //   const promise =
  //       this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS);

  //   // add tracking and undo/redo checkpoint
  //   this.track(promise, 'favicon.browse');
  //   this.undoredo(promise);

  //   // handle the result
  //   promise
  //       .then((fileInfo) => {
  //         if (fileInfo) {
  //           // set the new favicon path
  //           updateSite({
  //             ...getSite(),
  //             faviconPath: fileInfo.absPath,
  //           })

  //           // notify caller (used to reopen settings)
  //           if (opt_cbk) {
  //             opt_cbk();
  //           }
  //         }
  //       })
  //       .catch((error) => {
  //         SilexNotification.notifyError(
  //             'Error: I could not select the favicon. <br /><br />' +
  //             (error.message || ''));
  //       });
  // }

  // /**
  //  * the user clicked "browse" button to choose a thumbnail for social netorks
  //  */
  // browseThumbnailSocialPath(opt_cbk) {
  //   // create the promise
  //   const promise =
  //       this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS);

  //   // add tracking and undo/redo checkpoint
  //   this.track(promise, 'thumbnail-social.browse');
  //   this.undoredo(promise);

  //   // handle the result
  //   promise
  //       .then((fileInfo) => {
  //         if (fileInfo) {
  //           // set the new path
  //           updateSite({
  //             ...getSite(),
  //             thumbnailSocialPath: fileInfo.absPath,
  //           })

  //           // notify caller (used to reopen settings)
  //           if (opt_cbk) {
  //             opt_cbk();
  //           }
  //         }
  //       })
  //       .catch((error) => {
  //         SilexNotification.notifyError(
  //             'Error: I could not select the thumbnail. <br /><br />' +
  //             (error.message || ''));
  //       });
  // }

  // /**
  //  * enable/disable mobile version
  //  */
  // toggleEnableMobile() {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   const site = getSite();
  //   updateSite({
  //     ...site,
  //     enableMobile: !site.enableMobile,
  //   })
  // }

  // /**
  //  * set website width
  //  */
  // setWebsiteWidth(opt_data?: number) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     width: opt_data,
  //   })
  // }

  // /**
  //  * callback for the publication path text input
  //  */
  // setPublicationPath(opt_data?: FileInfo) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     publicationPath: opt_data,
  //   })
  // }

  // use getSite().*
  // /**
  //  * callback for the publication path text input
  //  */
  // getPublicationPath(): FileInfo {
  //   return this.model.head.getPublicationPath();
  // }

  // /**
  //  * callback for the favicon path text input
  //  */
  // setFaviconPath(opt_data?: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     faviconPath: opt_data,
  //   })
  // }

  // /**
  //  * set new file description
  //  */
  // setDescription(opt_data?: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     description: opt_data,
  //   })

  // }

  // /**
  //  * set new title for social networks
  //  */
  // setTitleSocial(opt_data?: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     titleSocial: opt_data,
  //   })
  // }

  // /**
  //  * set new description for social networks
  //  */
  // setDescriptionSocial(opt_data?: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     descriptionSocial: opt_data,
  //   })
  // }

  // /**
  //  * set new thumbnail for social networks
  //  */
  // setThumbnailSocialPath(opt_data?: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     thumbnailSocialPath: opt_data,
  //   })
  // }

  // /**
  //  * set twitter account
  //  */
  // setTwitterSocial(opt_data?: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   updateSite({
  //     ...getSite(),
  //     twitterSocial: opt_data,
  //   })
  // }
}
