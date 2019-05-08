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
 * @fileoverview Helper class for common tasks
 *
 */

import {FileInfo} from '../types';

export class Url {
  /**
   * set a field in a FileInfo object, and update the `url` attribute accordingly
   * @param attributes a partial FileInfo object
   */
  static updateFileInfo(
      fileInfo: FileInfo, attributes: Object): FileInfo {
    if (!fileInfo) {
      return null;
    }
    const fileInfoNew = Object.assign({}, fileInfo, attributes);
    return (Object.assign({}, fileInfoNew, {
      'url': Url.getBaseUrl() + fileInfoNew.service + '/get/' + fileInfoNew.path
    }) as FileInfo);
  }

  /**
   * Get base URL of Silex server
   */
  static getBaseUrl() {
    return window.location.href;
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
    const url = opt_url || window.location.href;

    // const rootUrl = /http.?:\/\/(.*)\//.match()[0];
    const start = url.indexOf('//');
    const end = url.indexOf('/', start + 2);
    return url.substr(0, end);
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
    let root = Url.getRootUrl(opt_url);
    let host = root.substr(root.indexOf('//') + 2);
    return host;
  }

  /**
   * Check if an URL is relative or absolute
   * @return true if the url is absolute
   */
  static isAbsoluteUrl(url: string): boolean {
    return url.indexOf('http') === 0 || url.indexOf('//') === 0;
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
      url = url.substr(4);
    }
    if (url.endsWith(')')) {
      url = url.substr(0, url.length - 1);
    }

    // remove the ''
    if (url.startsWith('\'') || url.startsWith('"')) {
      url = url.substr(1);
    }
    if (url.endsWith('\'') || url.endsWith('"')) {
      url = url.substr(0, url.length - 1);
    }

    // workaround firefox going crazy
    if (url.startsWith('&quot;')) {
      url = url.substr(6);
    }
    if (url.endsWith('&quot;')) {
      url = url.substr(0, url.length - 6);
    }
    if (url.startsWith('%5C')) {
      url = url.substr(3);
    }
    if (url.startsWith('%22')) {
      url = url.substr(3);
    }
    if (url.endsWith('%22')) {
      url = url.substr(0, url.length - 3);
    }
    if (url.endsWith('%5C')) {
      url = url.substr(0, url.length - 3);
    }
    return url;
  }

  /**
   * add the url() css keyword
   * simple quotes are added so that the URL may contain parenthesis
   * and it does not disturb the inline style double quotes
   * example: http://silex.me returns url("http://silex.me")
   * @return url + keyword as for background-image
   */
  static addUrlKeyword(url: string): string {
    return `url('${url}')`;
  }
}
