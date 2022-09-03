/**
 * @fileoverview Service used to interact with the unifile server.
 *     This class is a singleton.
 *
 */
import { getUiElements } from '../ui-store/UiElements'
import { CloudExplorer } from '../externs'
import { Notification } from '../components/Notification'
import { PersistantData } from '../store/types'
import { Url } from '../utils/Url'

// FIXME: choose between path and folder + name, remove absPath
// This comes from Cloud Explorer
export interface FileInfo {
  path: string,
  service: string,
  name: string,
  isDir: boolean,
  mime: string,
  absPath: string,
  folder?: string,
  size?: number,
  modified?: string,
}

/**
 * the Silex CloudStorage service
 * load and save data to and from the cloud storage services
 * this is a singleton
 */
export class CloudStorage {

  static instance: CloudStorage
  static getInstance() {
    CloudStorage.instance = CloudStorage.instance || new CloudStorage()
    return CloudStorage.instance
  }
  /**
   * reference to the filepicker instance
   */
  ce: CloudExplorer = null
  cbks: any

  ready(cbk: () => any) {
    const uiElements = getUiElements()
    // cloud explorer instance
    // tslint:disable:no-string-literal
    if (uiElements.fileExplorer.contentWindow['ce']) {
      this.ce = (uiElements.fileExplorer.contentWindow['ce'] as CloudExplorer)
      cbk()
    } else {
      if (this.cbks == null) {
        this.cbks = []
        uiElements.fileExplorer.addEventListener('load', (e) => {
          this.ce = (uiElements.fileExplorer.contentWindow['ce'] as CloudExplorer)
          this.cbks.forEach((_) => _())
          this.cbks = []
        })
      }
      this.cbks.push(cbk)
    }
  }

  /**
   * save a file
   */
  write(
      fileInfo: FileInfo, html: string, data: PersistantData, cbk: () => any,
      opt_errCbk?: ((p1: any, p2: string, code: number) => any)) {
    // // save the data
    // this.ce.write(new Blob([html], {type: 'text/plain'}), fileInfo)
    // .then(() => {
    //   cbk();
    // })
    // .catch(e => {
    //   console.error('Error: could not write file', fileInfo, e);
    //   if (opt_errCbk) opt_errCbk(/** @type {any} */ (e));
    // });
    const oReq = new XMLHttpRequest()
    oReq.onload = () => {
      if (oReq.status === 200) {
        cbk()
      } else {
        const err = new Event('error')
        const msg = this.getErrorMessage(oReq)
        if (opt_errCbk) {
          opt_errCbk(err, msg, oReq.status)
        }
      }
    }
    const url = Url.getBaseUrl() + `/website/ce/${fileInfo.service}/put/${fileInfo.path}` // add base url in case we serve silex with a rootPath
    oReq.open('PUT', url)
    oReq.setRequestHeader('Content-Type', 'text/plain; charset=utf-8')
    oReq.send(JSON.stringify({html, data}))
  }

  /**
   * get an error message out of a CloudExplorer's router error response
   * @return the error message
   */
  getErrorMessage(oReq): string {
    let msg = ''
    try {
      const response = JSON.parse(oReq.responseText)
      if (response.message) {
        msg = response.message
      }
    } catch (e) {
    }
    if (msg === '') {
      if (oReq.responseText !== '') {
        msg = oReq.responseText
      } else {
        switch (oReq.status) {
          case 404:
            msg = 'File not found.'
            break
          case 401:
            msg =
                'You are not connected to the cloud service you are trying to use.'
            break
          default:
            msg = 'Unknown error with HTTP status ' + oReq.status
        }
      }
    }
    return msg === '' ? null : msg
  }

  /**
   * load a website from the api
   */
  loadWebsite(
      absPath: string, cbk: (p1: string, data: PersistantData) => any,
      opt_errCbk?: ((p1: any, p2: string, code: number) => any)) {
    const prefix = Url.getPath()
    const absPathNoPrefix = absPath.startsWith(prefix) ? absPath.replace(prefix, '') : absPath
    const url = Url.getBaseUrl() + '/website' + absPathNoPrefix  // add base url in case we serve silex with a rootPath
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('load', (e) => {
      // success of the request
      if (oReq.status === 200) {
        const json = JSON.parse(oReq.responseText)

        // warn the user
        if (json.message) {
          Notification.alert('Website updated', json.message, () => {})
        }
        cbk(json.html, json.data as PersistantData)
      } else {
        const err = new Event('error')
        const msg = this.getErrorMessage(oReq)
        opt_errCbk(err, msg, oReq.status)
      }
    })
    oReq.addEventListener('error', (e) => {
      console.error('could not load website', absPath, 'from', url, e)
      if (opt_errCbk) {
        opt_errCbk(
            e,
            'Network error, please check your internet connection or try again later.', oReq.status)
      }
    })
    oReq.open('GET', url)
    oReq.send()
  }

  getServices(
      cbk: (p1: any[]) => any,
      opt_errCbk?: ((p1: any, p2: string) => any)) {
    this.ce.getServices()
    .then((services) => {
      cbk(services)
    })
    .catch((e) => {
      console.error('Error: could not get the list of services', e)
      if (opt_errCbk) {
        opt_errCbk(e, 'Error: could not get the list of services')
      } else {
        cbk([])
      }
    })
  }
}
