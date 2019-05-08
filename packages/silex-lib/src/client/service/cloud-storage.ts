import {FileInfo} from '../types';

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
 * @fileoverview Service used to interact with the unifile server.
 *     This class is a singleton.
 *
 */

import {CloudExplorer} from '../externs';
import {SilexNotification} from '../utils/notification';
import { getUiElements } from '../view/UiElements';

/**
 * the Silex CloudStorage service
 * load and save data to and from the cloud storage services
 * this is a singleton
 */
export class CloudStorage {
  /**
   * reference to the filepicker instance
   */
  ce: CloudExplorer = null;
  cbks: any;

  static instance: CloudStorage;
  static getInstance() {
    CloudStorage.instance = CloudStorage.instance || new CloudStorage();
    return CloudStorage.instance;
  }

  ready(cbk: () => any) {
    const uiElements = getUiElements();
    // cloud explorer instance
    if (uiElements.fileExplorer.contentWindow['ce']) {
      this.ce = (uiElements.fileExplorer.contentWindow['ce'] as CloudExplorer);
      cbk();
    } else {
      if (this.cbks == null) {
        this.cbks = [];
        uiElements.fileExplorer.addEventListener('load', (e) => {
          this.ce = (uiElements.fileExplorer.contentWindow['ce'] as CloudExplorer);
          this.cbks.forEach((cbk) => cbk());
          this.cbks = [];
        });
      }
      this.cbks.push(cbk);
    }
  }

  /**
   * save a file
   */
  write(
      fileInfo: FileInfo, rawData: string, userHead: string, cbk: () => any,
      opt_errCbk?: ((p1: Object, p2: string) => any)) {
    // // save the data
    // this.ce.write(new Blob([rawData], {type: 'text/plain'}), fileInfo)
    // .then(() => {
    //   cbk();
    // })
    // .catch(e => {
    //   console.error('Error: could not write file', fileInfo, e);
    //   if (opt_errCbk) opt_errCbk(/** @type {Object} */ (e));
    // });
    const oReq = new XMLHttpRequest();
    oReq.onload = () => {
      if (oReq.status === 200) {
        cbk();
      } else {
        const err = new Event('error');
        let msg = this.getErrorMessage(oReq);
        if (opt_errCbk) {
          opt_errCbk(err, msg);
        }
      }
    };
    const url = `/website/ce/${fileInfo.service}/put/${fileInfo.path}`;
    oReq.open('PUT', url);
    oReq.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
    oReq.send(JSON.stringify({'html': rawData, 'userHead': userHead}));
  }

  /**
   * load text blob from unifile
   */
  read(
      fileInfo: FileInfo, cbk: (p1: string, p2: string) => any,
      opt_errCbk?: ((p1: Object, p2: string) => any)) {
    this.loadLocal(fileInfo.absPath, cbk, opt_errCbk);
  }

  /**
   * get an error message out of a CloudExplorer's router error response
   * @return the error message
   */
  getErrorMessage(oReq): string {
    let msg = '';
    try {
      const response = JSON.parse(oReq.responseText);
      if (response['message']) {
        msg = response['message'];
      }
    } catch (e) {
    }
    if (msg === '') {
      if (oReq.responseText !== '') {
        msg = oReq.responseText;
      } else {
        switch (oReq.status) {
          case 404:
            msg = 'File not found.';
            break;
          case 401:
            msg =
                'You are not connected to the cloud service you are trying to use.';
            break;
          default:
            msg = 'Unknown error with HTTP status ' + oReq.status;
        }
      }
    }
    return msg === '' ? null : msg;
  }

  /**
   * load data
   */
  loadLocal(
      absPath: string, cbk: (p1: string, p2: string) => any,
      opt_errCbk?: ((p1: Object, p2: string) => any)) {
    const url = '/website' + absPath;
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('load', (e) => {
      // success of the request
      if (oReq.status === 200) {
        const data = JSON.parse(oReq.responseText);

        // warn the user
        if (data['message']) {
          SilexNotification.alert('Open a website', data['message'], function() {});
        }
        cbk(data['html'], data['userHead']);
      } else {
        const err = new Event('error');
        let msg = this.getErrorMessage(oReq);
        opt_errCbk(err, msg);
      }
    });
    oReq.addEventListener('error', (e) => {
      console.error('could not load website', absPath, 'from', url, e);
      if (opt_errCbk) {
        opt_errCbk(
            e,
            'Network error, please check your internet connection or try again later.');
      }
    });
    oReq.open('GET', url);
    oReq.send();
  }

  getServices(
      cbk: (p1: any[]) => any,
      opt_errCbk?: ((p1: any, p2: string) => any)) {
    this.ce.getServices()
    .then((services) => {
      cbk(services);
    })
    .catch((e) => {
      console.error('Error: could not get the list of services', e);
      if (opt_errCbk) {
        opt_errCbk(e, 'Error: could not get the list of services');
      } else {
        cbk([]);
      }
    });
  }
}
