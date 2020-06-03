
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

import { Url } from './Url'

/**
 * @fileoverview Helper class for common tasks
 *
 */

/**
 * @struct
 * TODO: split into functions and move to site/utils.ts
 */
export class Dom {

  // /**
  //  * refresh an image with its latest version on the server
  //  */
  // static refreshImage(img: HTMLImageElement, cbk: () => any) {
  //   const initialUrl = img.src;
  //   img.onload = (e) => {
  //     // stop the process
  //     img.onload = null;
  //     cbk();
  //   };
  //   img.src = Url.addCacheControl(initialUrl);
  // }

  /**
   * render a template by duplicating the itemTemplateString and inserting the
   * data in it
   * @param
   * @param  data                 the array of strings conaining the data
   * @return the template string with the data in it
   */
  static renderList(itemTemplateString: string, data: any[]): string {
    let res = ''

    // for each item in data, e.g. each page in the list
    data.forEach((itemData) => {
      // build an item
      let item = itemTemplateString

      // replace each key by its value
      for (const key in itemData) {
        const value = itemData[key]
        item = item.replace(new RegExp('{{' + key + '}}', 'g'), value)
      }

      // add the item to the rendered template
      res += item
    })
    return res
  }

  constructor() {
    throw new Error('this is a static class and it canot be instanciated')
  }
}
