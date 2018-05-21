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
 * @fileoverview This is the dialog box containing the
 *     Cloud Explorer file picker
 *     this is only the UI part, to let user choose a file in the cloud
 *     @see silex.service.CloudStorage     for the service/network part
 *
 */


goog.provide('silex.view.dialog.FileExplorer');
goog.require('silex.service.CloudStorage');



/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
class FileExplorer {
  static get IMAGE_EXTENSIONS() { return ['.jpg', '.jpeg', '.png', '.gif']; }
  static get HTML_EXTENSIONS() { return ['.html', '.htm']; }

  /**
   * @param {!Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                               the controller instances
   */
  constructor(element, model, controller) {
    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;

    /**
     * reference to the filepicker instance
     * @type {CloudExplorer}
     */
    this.ce = null;


    // cloud explorer instance
    silex.service.CloudStorage.getInstance().ready(() => {
      this.ce = silex.service.CloudStorage.getInstance().ce;
    });

    // make this a dialog
    this.modalDialog = new ModalDialog({
      element: element,
      onOpen: args => {},
      onClose: () => {},
    });

  }


  /**
   * method passed to then in order to add the desired path format everywhere in silex
   * @param {FileInfo} fileInfo
   * @return {FileInfo}
   */
  addAbsPath(fileInfo) {
    return /** @type {FileInfo} */ (Object.assign({'absPath': `/ce/${ fileInfo.service }/get/${ fileInfo.path }`}, fileInfo));
  }


  /**
   * pick file
   * @param {?Array.<string>=} opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   * @return {Promise.<FileInfo>}
   */
  openFile(opt_extensions) {
    this.open();
    return this.ce.openFile(opt_extensions)
    .then(fileInfo => this.addAbsPath(fileInfo))
    .then(fileInfo => {
      this.close()
      return fileInfo;
    });
  }


  /**
   * pick multiple files
   * @param {?Array.<string>=} opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   * @return {Promise.<FileInfo>}
   */
  openFiles(opt_extensions) {
    this.open();
    return this.ce.openFiles(opt_extensions)
    .then(fileInfo => this.addAbsPath(fileInfo))
    .then(fileInfo => {
      this.close()
      return fileInfo;
    });
  }


  /**
   * pick a folder
   * @return {Promise.<FileInfo>}
   */
  openFolder() {
    this.open();
    return this.ce.openFolder()
    .then(fileInfo => this.addAbsPath(fileInfo))
    .then(fileInfo => {
      this.close()
      return fileInfo;
    });
  }


  /**
   * choose a name for the file
   * @param {string} defaultName
   * @param {?Array.<string>=} opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   * @return {Promise.<FileInfo>}
   */
  saveAs(defaultName, opt_extensions) {
    this.open();
    return this.ce.saveAs(defaultName, opt_extensions)
    .then(fileInfo => this.addAbsPath(fileInfo))
    .then(fileInfo => {
      this.close()
      return fileInfo;
    });
  }

  /**
   * Open the editor
   */
  open() {
    this.modalDialog.open();
  }


  /**
   * Close the editor
   */
  close() {
    this.modalDialog.close();
  }
}

