

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

/**
 * @struct
 */
export class Dom {

  /**
   * name of the get param used to store the timestamp (cache control)
   * ant
   */
  static CACHE_CONTROL_PARAM_NAME = 'silex-cache-control';

  constructor() {
    throw 'this is a static class and it canot be instanciated';
  }

  /**
   * refresh an image with its latest version on the server
   */
  static refreshImage(img: HTMLImageElement, cbk: () => any) {
    let initialUrl = img.src;
    img.onload = function(e) {
      // stop the process
      img.onload = null;
      cbk();
    };
    img.src = Dom.addCacheControl(initialUrl);
  }

  /**
   * add cache control to an URL
   * handle the cases where there is a ? or & or an existing cache control
   * example: Dom.addCacheControl('aaaaaaaa.com') returns
   * 'aaaaaaaa.com?silex-cache-control=09238734099890'
   */
  static addCacheControl(url: string): string {
    // remove existing cache control if any
    url = Dom.removeCacheControl(url);

    // add an url separator
    if (url.indexOf('?') > 0) {
      url += '&';
    } else {
      url += '?';
    }

    // add the timestamp
    url += Dom.CACHE_CONTROL_PARAM_NAME + '=' + Date.now();

    // return the new url
    return url;
  }

  /**
   * remove cache control from an URL
   * handle the cases where there are other params in get
   * works fine when url contains several URLs with cache control or other text
   * (like a full image tag with src='') example:
   * Dom.addCacheControl('aaaaaaaa.com?silex-cache-control=09238734099890')
   * returns 'aaaaaaaa.com'
   */
  static removeCacheControl(url: string): string {
    // only when there is an existing cache control
    if (url.indexOf(Dom.CACHE_CONTROL_PARAM_NAME) > 0) {
      let re = new RegExp(
          '([?|&|&amp;]' + Dom.CACHE_CONTROL_PARAM_NAME + '=[0-9]*[&*]?)',
          'gi');
      url = url.replace(re, function(match, group1, group2) {
        // if there is a ? or & then return ?
        // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
        // aaaaaaaa.com?silex-cache-control=09238734099890
        // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
        // aaaaaaaa.com?xxx&silex-cache-control=09238734&ccsqcqsc&
        if (group1.charAt(0) === '?' &&
            group1.charAt(group1.length - 1) === '&') {
          return '?';
        } else {
          if (group1.charAt(group1.length - 1) === '&' ||
              group1.charAt(0) === '&') {
            return '&';
          } else {
            return '';
          }
        }
      });
    }

    // return the new url
    return url;
  }

  /**
   * prevent scripts from executing in components, html boxes...
   * @return a safe html string
   */
  static deactivateScripts(html: string): string {
    return html.replace(
        /<script.*class="silex-script".*?>/gi,
        '<script type="text/notjavascript" class="silex-script">');
  }

  /**
   * undo the deactivateScript
   * @return the original html string
   */
  static reactivateScripts(html: string): string {
    return html.replace(
        /type="text\/notjavascript"/gi, 'type="text/javascript"');
  }

  /**
   * render a template by duplicating the itemTemplateString and inserting the
   * data in it
   * @param
   * @param  data                 the array of strings conaining the data
   * @return the template string with the data in it
   */
  static renderList(itemTemplateString: string, data: Object[]): string {
    let res = '';

    // for each item in data, e.g. each page in the list
    data.forEach((itemData) => {
      // build an item
      let item = itemTemplateString;

      // replace each key by its value
      for (let key in itemData) {
        let value = itemData[key];
        item = item.replace(new RegExp('{{' + key + '}}', 'g'), value);
      }

      // add the item to the rendered template
      res += item;
    });
    return res;
  }
}
