/**
 * @fileoverview Helpers for common tasks, these functions are cross platform
 *
 */

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
export function renderList(itemTemplateString: string, data: any[]): string {
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

export function setTagName(el: HTMLElement, tag: string): HTMLElement {
  if(el.tagName.toLowerCase() === 'body') throw new Error('Forbidden to change tag name of body')
  const replacement = el.ownerDocument.createElement(tag)
  el.getAttributeNames()
  .forEach((attr) => replacement.setAttribute(attr, el.getAttribute(attr)))
  while(el.firstChild) {
    replacement.appendChild(el.firstChild)
  }
  el.parentNode.replaceChild(replacement, el)
  return replacement
}
