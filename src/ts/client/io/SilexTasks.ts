/**
 * @fileoverview Service used to interact with the unifile server.
 *     The Silex "tasks" are nodejs methods which Silex adds to the unifle API.
 *     This class is a singleton.
 *
 */

import {Hosting, Provider, VHost} from '../site-store/types'
import {PublicationOptions} from '../site-store/types'
import { Url } from '../utils/Url'
/**
 * the Silex SilexTasks singleton
 * based on http://www.inkfilepicker.com/
 * load and save data to and from the cloud storage services
 * FIXME: use types common to front and back end
 */
export class SilexTasks {

  static instance: SilexTasks
  static getInstance() {
    SilexTasks.instance = SilexTasks.instance || new SilexTasks()
    return SilexTasks.instance
  }
  /**
   * publish a website to a given folder
   * @param cbk called when success
   * @param opt_errCbk to receive the json response
   */
  publish(options: PublicationOptions, cbk: (p1: string) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(Url.getPath() + '/tasks/publish', JSON.stringify(options), 'POST', (json) => cbk(json), opt_errCbk) // add base url in case we serve silex with a rootPath
  }

  /**
   * get the state of the current publication
   * @param cbk to receive the json response
   * @param opt_errCbk to receive the json response
   */
  publishState(cbk: (p1: {message: string, stop: boolean}) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(Url.getPath() + '/tasks/publishState', '', 'GET', cbk, opt_errCbk) // add base url in case we serve silex with a rootPath
  }

  /**
   * get the state of the current publication
   * @param cbk to receive the json response
   * @param opt_errCbk to receive the json response
   */
  hosting(cbk: (p1: Hosting) => void, opt_errCbk?: (p1: string) => void) {
    this.callServer(Url.getPath() + '/hosting/', '', 'GET', cbk, opt_errCbk) // add base url in case we serve silex with a rootPath
  }

  /**
   * get the login URL
   * @param cbk to receive the json response
   */
  authorize(provider: Provider, cbk: (p1: string) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(provider.authorizeUrl, '', 'POST', cbk, opt_errCbk)
  }

  /**
   * get the vhosts for a provider to which we are connected
   * @param cbk to receive the json response
   */
  vhosts(provider: Provider, cbk: (p1: VHost[]) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(provider.vhostsUrl, '', 'GET', cbk, opt_errCbk)
  }

  /**
   * get the domain name for a vhost
   * @param cbk to receive the json response
   */
  domain(vhost: VHost, cbk: (p1?: {domain: string, url: string, status: string}) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(vhost.domainUrl, '', 'GET', cbk, opt_errCbk)
  }

  /**
   * update the domain name for a vhost
   * @param cbk to receive the json response
   */
  updateDomain(vhost: VHost, newDomain: string, cbk: (p1: {domain: string, https: boolean}) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(vhost.domainUrl, JSON.stringify({domain: newDomain}), 'POST', cbk,   opt_errCbk)
  }

  /**
   * remove the domain name for a vhost
   * @param cbk to receive the json response
   */
  removeDomain(vhost: VHost, newDomain: string, cbk: (p1: {domain: string, https: boolean}) => any, opt_errCbk?: (p1: string) => any) {
    this.callServer(vhost.domainUrl, JSON.stringify({domain: newDomain}), 'DELETE',   cbk, opt_errCbk)
  }

  /**
   * @param cbk to receive the json response
   * @param opt_errCbk to receive the json response
   */
  callServer(url: string, data: string, method: string, cbk, opt_errCbk?: (p1: string) => any) {
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('load', (e) => {
      let message: string = oReq.responseText
      let json: any = null
      try {
        json = (JSON.parse(oReq.responseText))
        message = (json.message as string)
      } catch (e) {
      }

      // handle the case where the response is just a string, e.g. an URL in the
      // case of oauth

      // may be an empty response or a "Internal Server Error" string
      // success of the request
      if (oReq.status === 200) {
        cbk(json || oReq.responseText)
      } else {
        console.error('Error while trying to connect with back end', message)
        if (opt_errCbk) {
          opt_errCbk(json ? json.message : message)
        }
      }
    })
    oReq.addEventListener('error', (e) => {
      console.error('could not load website', e)
      if (opt_errCbk) {
        opt_errCbk(
            'Network error, please check your internet connection or try again later.')
      }
    })
    oReq.open(method, url)
    oReq.setRequestHeader('Content-Type', 'application/json')
    oReq.send(data)
  }
}
