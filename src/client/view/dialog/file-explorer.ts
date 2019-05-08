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


import {CloudStorage} from '../../service/cloud-storage';
import {Model} from '../../types';
import {Controller} from '../../types';
import {FileInfo} from '../../types';
import {CloudExplorer} from '../../externs';
import {ModalDialog} from '../../view/ModalDialog';

/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
export class FileExplorer {
  static get IMAGE_EXTENSIONS() {
    return ['.jpg', '.jpeg', '.png', '.gif'];
  }
  static get HTML_EXTENSIONS() {
    return ['.html', '.htm'];
  }

  /**
   * reference to the filepicker instance
   */
  ce: CloudExplorer = null;

  // make this a dialog
  modalDialog: any;

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {
    // cloud explorer instance
    CloudStorage.getInstance().ready(() => {
      this.ce = CloudStorage.getInstance().ce;
    });
    this.modalDialog = new ModalDialog({name: 'File explorer', element: element, onOpen: (args) => {}, onClose: () => {}});
  }

  /**
   * method passed to then in order to add the desired path format everywhere in
   * silex
   */
  addAbsPath(fileInfo: FileInfo): FileInfo {
    if (fileInfo === null) {
      return fileInfo;
    }

    // case of cancel
    return (
        Object.assign(
            {'absPath': `/ce/${fileInfo.service}/get/${fileInfo.path}`},
            fileInfo) as FileInfo);
  }

  /**
   * pick file
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  openFile(opt_extensions?: string[]): Promise<FileInfo> {
    this.open();
    return this.ce.openFile(opt_extensions)
        .then((fileInfo) => this.addAbsPath(fileInfo))
        .then((fileInfo) => {
          this.close();
          return fileInfo;
        });
  }

  /**
   * pick multiple files
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  openFiles(opt_extensions?: string[]): Promise<FileInfo> {
    this.open();
    return this.ce.openFiles(opt_extensions)
        .then((fileInfo) => this.addAbsPath(fileInfo))
        .then((fileInfo) => {
          this.close();
          return fileInfo;
        });
  }

  /**
   * pick a folder
   */
  openFolder(): Promise<FileInfo> {
    this.open();
    return this.ce.openFolder()
        .then((fileInfo) => this.addAbsPath(fileInfo))
        .then((fileInfo) => {
          this.close();
          return fileInfo;
        });
  }

  /**
   * choose a name for the file
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  saveAs(defaultName: string, opt_extensions?: string[]):
      Promise<FileInfo> {
    this.open();
    return this.ce.saveAs(defaultName, opt_extensions)
        .then((fileInfo) => this.addAbsPath(fileInfo))
        .then((fileInfo) => {
          this.close();
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
