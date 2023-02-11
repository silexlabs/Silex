"use strict";
/**
 * @fileoverview Helpers for common tasks, these functions are cross platform
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTagName = exports.renderList = void 0;
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
function renderList(itemTemplateString, data) {
    let res = '';
    // for each item in data, e.g. each page in the list
    data.forEach((itemData) => {
        // build an item
        let item = itemTemplateString;
        // replace each key by its value
        for (const key in itemData) {
            const value = itemData[key];
            item = item.replace(new RegExp('{{' + key + '}}', 'g'), value);
        }
        // add the item to the rendered template
        res += item;
    });
    return res;
}
exports.renderList = renderList;
function setTagName(el, tag) {
    if (el.tagName.toLowerCase() === 'body')
        throw new Error('Forbidden to change tag name of body');
    const replacement = el.ownerDocument.createElement(tag);
    el.getAttributeNames()
        .forEach((attr) => replacement.setAttribute(attr, el.getAttribute(attr)));
    while (el.firstChild) {
        replacement.appendChild(el.firstChild);
    }
    el.parentNode.replaceChild(replacement, el);
    return replacement;
}
exports.setTagName = setTagName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC91dGlscy9kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsTUFBTTtBQUNOLDREQUE0RDtBQUM1RCxNQUFNO0FBQ04sK0RBQStEO0FBQy9ELGdDQUFnQztBQUNoQywwQkFBMEI7QUFDMUIsMEJBQTBCO0FBQzFCLHlCQUF5QjtBQUN6QixhQUFhO0FBQ2IsT0FBTztBQUNQLCtDQUErQztBQUMvQyxJQUFJO0FBRUo7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLGtCQUEwQixFQUFFLElBQVc7SUFDaEUsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFBO0lBRVosb0RBQW9EO0lBQ3BELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtRQUN4QixnQkFBZ0I7UUFDaEIsSUFBSSxJQUFJLEdBQUcsa0JBQWtCLENBQUE7UUFFN0IsZ0NBQWdDO1FBQ2hDLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFO1lBQzFCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUMzQixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtTQUMvRDtRQUVELHdDQUF3QztRQUN4QyxHQUFHLElBQUksSUFBSSxDQUFBO0lBQ2IsQ0FBQyxDQUFDLENBQUE7SUFDRixPQUFPLEdBQUcsQ0FBQTtBQUNaLENBQUM7QUFsQkQsZ0NBa0JDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEVBQWUsRUFBRSxHQUFXO0lBQ3JELElBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFBO0lBQy9GLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3ZELEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtTQUNyQixPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3pFLE9BQU0sRUFBRSxDQUFDLFVBQVUsRUFBRTtRQUNuQixXQUFXLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUN2QztJQUNELEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUMzQyxPQUFPLFdBQVcsQ0FBQTtBQUNwQixDQUFDO0FBVkQsZ0NBVUMifQ==