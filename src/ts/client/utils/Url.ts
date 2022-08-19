/**
 * @fileoverview Helper class for common tasks
 *
 */

import { FileInfo } from '../io/CloudStorage'

export class Url {
  /**
   * name of the get param used to store the timestamp (cache control)
   */
  static CACHE_CONTROL_PARAM_NAME = 'silex-cache-control'

  /**
   * get the GET params from the URL
   */
  static getUrlParams(): any {
    return window.location.search
    .substr(1)
    .split('&')
    .reduce((aggr, next) => {
      const split = next.split('=')
      if (split.length === 2) {
        aggr[split[0]] = split[1]
      }
      return aggr
    }, {})
  }
  /**
   * set a field in a FileInfo object, and update the `url` attribute accordingly
   * @param attributes a partial FileInfo object
   */
  static updateFileInfo(
      fileInfo: FileInfo, attributes: any): FileInfo {
    if (!fileInfo) {
      return null
    }
    const fileInfoNew = Object.assign({}, fileInfo, attributes)
    return (Object.assign({}, fileInfoNew, {
      url: Url.getBaseUrl() + fileInfoNew.service + '/get/' + fileInfoNew.path,
    }) as FileInfo)
  }

  /**
   * Get path of Silex server
   * Remove the file name from location.pathname
   */
  static getPath() {
    return window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'))
  }

  /**
   * Get base URL of Silex server
   * Remove the file name from location.href
   */
  static getBaseUrl() {
    return window.location.href.substr(0, window.location.href.lastIndexOf('/'))
  }

  /**
   * Get root of a URL or Silex app
   * @param opt_url URL or null
   * @return the base url
   * example: "" returns https://editor.silex.me
   * example: https://duckduckgo.com returns https://duckduckgo.com
   * example: https://duckduckgo.com/ returns https://duckduckgo.com
   * example: https://duckduckgo.com/?q=javascript returns https://duckduckgo.com
   * example: https://duckduckgo.com/abc/ returns https://duckduckgo.com
   */
  static getRootUrl(opt_url?: string): string {
    const url = opt_url || window.location.href

    // const rootUrl = /http.?:\/\/(.*)\//.match()[0];
    const start = url.indexOf('//')
    const end = url.indexOf('/', start + 2)
    return url.substr(0, end)
  }

  /**
   * Get host of Silex app
   * @param opt_url URL or null
   * @return the base url
   * example: https://duckduckgo.com returns duckduckgo.com
   * example: https://duckduckgo.com/ returns duckduckgo.com
   * example: https://duckduckgo.com/?q=javascript returns duckduckgo.com
   * example: https://duckduckgo.com/abc/ returns duckduckgo.com
   */
  static getHost(opt_url?: string): string {
    const root = Url.getRootUrl(opt_url)
    const host = root.substr(root.indexOf('//') + 2)
    return host
  }

  /**
   * Check if an URL is relative or absolute
   * @return true if the url is absolute
   */
  static isAbsoluteUrl(url: string): boolean {
    return url.indexOf('http') === 0 || url.indexOf('//') === 0
  }

  /**
   * remove the url() css keyword
   * also remove the '' or "" if any
   * example: url(http://silex.me) would return http://silex.me
   * @param url + keyword as for background-image
   * @return URL without keyword
   */
  static removeUrlKeyword(url: string): string {
    // removes the url() keyword
    if (url.startsWith('url(')) {
      url = url.substr(4)
    }
    if (url.endsWith(')')) {
      url = url.substr(0, url.length - 1)
    }

    // remove the ''
    if (url.startsWith('\'') || url.startsWith('"')) {
      url = url.substr(1)
    }
    if (url.endsWith('\'') || url.endsWith('"')) {
      url = url.substr(0, url.length - 1)
    }

    // workaround firefox going crazy
    if (url.startsWith('&quot;')) {
      url = url.substr(6)
    }
    if (url.endsWith('&quot;')) {
      url = url.substr(0, url.length - 6)
    }
    if (url.startsWith('%5C')) {
      url = url.substr(3)
    }
    if (url.startsWith('%22')) {
      url = url.substr(3)
    }
    if (url.endsWith('%22')) {
      url = url.substr(0, url.length - 3)
    }
    if (url.endsWith('%5C')) {
      url = url.substr(0, url.length - 3)
    }
    return url
  }

  /**
   * add the url() css keyword
   * simple quotes are added so that the URL may contain parenthesis
   * and it does not disturb the inline style double quotes
   * example: http://silex.me returns url("http://silex.me")
   * @return url + keyword as for background-image
   */
  static addUrlKeyword(url: string): string {
    return `url('${url}')`
  }

  /**
   * add cache control to an URL
   * handle the cases where there is a ? or & or an existing cache control
   * example: Url.addCacheControl('aaaaaaaa.com') returns
   * 'aaaaaaaa.com?silex-cache-control=09238734099890'
   */
  static addCacheControl(url: string): string {
    // remove existing cache control if any
    url = Url.removeCacheControl(url)

    // add an url separator
    if (url.indexOf('?') > 0) {
      url += '&'
    } else {
      url += '?'
    }

    // add the timestamp
    url += Url.CACHE_CONTROL_PARAM_NAME + '=' + Date.now()

    // return the new url
    return url
  }

  /**
   * remove cache control from an URL
   * handle the cases where there are other params in get
   * works fine when url contains several URLs with cache control or other text
   * (like a full image tag with src='') example:
   * Url.addCacheControl('aaaaaaaa.com?silex-cache-control=09238734099890')
   * returns 'aaaaaaaa.com'
   */
  static removeCacheControl(url: string): string {
    // only when there is an existing cache control
    if (url.indexOf(Url.CACHE_CONTROL_PARAM_NAME) > 0) {
      const re = new RegExp(
          '([?|&|&amp;]' + Url.CACHE_CONTROL_PARAM_NAME + '=[0-9]*[&*]?)',
          'gi')
      url = url.replace(re, (match, group1, group2) => {
        // if there is a ? or & then return ?
        // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
        // aaaaaaaa.com?silex-cache-control=09238734099890
        // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
        // aaaaaaaa.com?xxx&silex-cache-control=09238734&ccsqcqsc&
        if (group1.charAt(0) === '?' &&
            group1.charAt(group1.length - 1) === '&') {
          return '?'
        } else {
          if (group1.charAt(group1.length - 1) === '&' ||
              group1.charAt(0) === '&') {
            return '&'
          } else {
            return ''
          }
        }
      })
    }

    // return the new url
    return url
  }
}
