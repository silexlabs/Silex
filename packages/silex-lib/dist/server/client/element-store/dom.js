"use strict";
/**
 * @fileoverview Dom manipulation methods, mostly used by observers. Cross platform, it needs to run client and server side
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWithProdotype = exports.removeWysihtmlMarkup = exports.executeScripts = exports.addMediaQuery = exports.getInnerHtml = exports.setInnerHtml = exports.getContentNode = exports.showOnMobile = exports.hideOnMobile = exports.showOnDesktop = exports.hideOnDesktop = exports.writeStyleToDom = exports.deleteStyleFromDom = exports.createDomElement = exports.removeElement = exports.setLink = exports.reorderElements = exports.getId = exports.getDomElementById = exports.getDomElement = void 0;
const constants_1 = require("../../constants");
const types_1 = require("./types");
const styles_1 = require("../utils/styles");
function getDomElement(doc, element) {
    return getDomElementById(doc, element.id);
}
exports.getDomElement = getDomElement;
function getDomElementById(doc, elementId) {
    return doc.querySelector(`[${constants_1.Constants.ELEMENT_ID_ATTR_NAME}="${elementId}"]`);
}
exports.getDomElementById = getDomElementById;
function getId(element) {
    return element.getAttribute(constants_1.Constants.ELEMENT_ID_ATTR_NAME);
}
exports.getId = getId;
function reorderElements(parent, elements) {
    // attach to the new parent
    elements
        .forEach((el) => {
        parent.appendChild(el);
        // return el.parentElement !== parent
    });
    // TODO: check that they do not belong to an other element's children list
    // changed.filter((el) => {
    //   if (getElements().filter((el2) => !!el2.children.find((id) => id === el.id)))
    // })
}
exports.reorderElements = reorderElements;
/**
 * set/get a "silex style link" on an element
 */
function setLink(element, link) {
    if (link) {
        element.setAttribute(constants_1.Constants.LINK_ATTR, link.href);
    }
    else {
        element.removeAttribute(constants_1.Constants.LINK_ATTR);
    }
}
exports.setLink = setLink;
/**
 * remove a DOM element
 */
function removeElement(element) {
    element.remove();
}
exports.removeElement = removeElement;
/**
 * element creation
 * create a DOM element, attach it to its container
 * and returns new component data for the element
 * @param type  the type of the element to create,
 *    see TYPE_* constants of the class @see silex.model.Element
 * @return   the newly created element
 */
function createDomElement({ doc, id, type, parent, isSectionContent }) {
    // create the element
    let element = null;
    switch (type) {
        // container
        case types_1.ElementType.CONTAINER:
            element = createContainerElement(doc);
            break;
        // section
        case types_1.ElementType.SECTION:
            element = createSectionElement(doc);
            break;
        // text
        case types_1.ElementType.TEXT:
            element = createTextElement(doc);
            break;
        // HTML box
        case types_1.ElementType.HTML:
            element = createHtmlElement(doc);
            break;
        // Image
        case types_1.ElementType.IMAGE:
            element = createImageElement(doc);
            break;
        default: throw new Error('unknown type: ' + type);
    }
    // init the element
    element.classList.add(constants_1.Constants.EDITABLE_CLASS_NAME);
    // add css class for Silex styles
    element.classList.add(type.toString());
    // element id
    element.setAttribute(constants_1.Constants.ELEMENT_ID_ATTR_NAME, id);
    element.classList.add(id);
    if (parent) {
        // add to the body
        if (type === types_1.ElementType.SECTION && parent !== doc.body) {
            throw new Error('Section can only be added to the body');
        }
        parent.appendChild(element);
    }
    else {
        console.info('element not yet created in the dom');
    }
}
exports.createDomElement = createDomElement;
/**
 * element creation method for a given type
 * called from createElement
 */
function createContainerElement(doc) {
    // create the conatiner
    const element = doc.createElement('div');
    element.setAttribute(constants_1.Constants.TYPE_ATTR, types_1.ElementType.CONTAINER);
    return element;
}
function createElementWithContent(doc, className) {
    // create the element
    const element = doc.createElement('div');
    element.setAttribute(constants_1.Constants.TYPE_ATTR, className);
    // create the container for text content
    const content = doc.createElement('div');
    // add empty content
    element.appendChild(content);
    // add a marker to find the inner content afterwards, with getContent
    content.classList.add(constants_1.Constants.ELEMENT_CONTENT_CLASS_NAME);
    // done
    return element;
}
/**
 * element creation method for a given type
 * called from createElement
 */
function createSectionElement(doc) {
    const element = doc.createElement('div');
    element.setAttribute(constants_1.Constants.TYPE_ATTR, types_1.ElementType.CONTAINER);
    return element;
}
/**
 * element creation method for a given type
 * called from createElement
 */
function createTextElement(doc) {
    // create the element
    const element = createElementWithContent(doc, types_1.ElementType.TEXT);
    // add default content
    const content = getContentNode(element);
    content.innerHTML = '<p>New text box</p>';
    // add normal class for default text formatting
    // sometimes there is only in text node in content
    // e.g. whe select all + remove formatting
    content.classList.add('normal');
    // done
    return element;
}
/**
 * element creation method for a given type
 * called from createElement
 */
function createHtmlElement(doc) {
    // create the element
    const element = doc.createElement('div');
    element.setAttribute(constants_1.Constants.TYPE_ATTR, types_1.ElementType.HTML);
    // create the container for html content
    const htmlContent = doc.createElement('div');
    htmlContent.innerHTML = '<p>New HTML box</p>';
    element.appendChild(htmlContent);
    // add a marker to find the inner content afterwards, with getContent
    htmlContent.classList.add(constants_1.Constants.ELEMENT_CONTENT_CLASS_NAME);
    return element;
}
/**
 * element creation method for a given type
 * called from createElement
 */
function createImageElement(doc) {
    // create the element
    const element = doc.createElement('div');
    element.setAttribute(constants_1.Constants.TYPE_ATTR, types_1.ElementType.IMAGE);
    return element;
}
function deleteStyleFromDom(doc, elementId, isMobile) {
    const styleSheet = getInlineStyleSheet(doc);
    const cssRuleObject = findCssRule(styleSheet, elementId, isMobile);
    // update or create the rule
    if (cssRuleObject) {
        styleSheet.deleteRule(cssRuleObject.index);
    }
}
exports.deleteStyleFromDom = deleteStyleFromDom;
function writeStyleToDom(doc, element, isMobile) {
    // find the index of the rule for the given element
    const elementId = element.id;
    const style = isMobile ? element.style.mobile : element.style.desktop;
    const styleSheet = getInlineStyleSheet(doc);
    deleteStyleFromDom(doc, element.id, isMobile);
    const styleStr = styles_1.styleToString(style, element.useMinHeight);
    // prevent empty rules
    if (styleStr.length) {
        // convert style to string
        // we use the class name because elements have their ID as a css class too
        const ruleStr = `.${elementId} {${styleStr}}`;
        if (isMobile) {
            // add the rule to the dom to see the changes, mobile rules after
            // desktop ones
            styleSheet.insertRule(addMediaQuery(ruleStr), styleSheet.cssRules.length);
        }
        else {
            styleSheet.insertRule(ruleStr, 0);
        }
    }
}
exports.writeStyleToDom = writeStyleToDom;
function getInlineStyleSheet(doc) {
    // make sure of the existance of the style tag with Silex definitions
    let styleTag = doc.querySelector('.' + constants_1.Constants.INLINE_STYLE_TAG_CLASS_NAME);
    if (!styleTag) {
        styleTag = doc.createElement('style');
        styleTag.classList.add(constants_1.Constants.INLINE_STYLE_TAG_CLASS_NAME);
        doc.head.appendChild(styleTag);
    }
    for (const s of doc.styleSheets) {
        const cssStyleSheet = s;
        if ((cssStyleSheet.ownerNode && cssStyleSheet.ownerNode === styleTag) // case of browser
            || cssStyleSheet === styleTag.sheet) {
            return cssStyleSheet;
        }
    }
    console.error('no stylesheet found');
    return null;
}
function findCssRule(styleSheet, elementId, isMobile) {
    // find the rule for the given element
    for (let idx = 0; idx < styleSheet.cssRules.length; idx++) {
        const cssRule = styleSheet.cssRules[idx]; // should it be CSSRule ?
        // we use the class name because elements have their ID as a css class too
        if ((isMobile === false && cssRule.selectorText === '.' + elementId) ||
            (cssRule.media && cssRule.cssRules && cssRule.cssRules[0] &&
                cssRule.cssRules[0].selectorText === '.' + elementId)) {
            return {
                rule: cssRule,
                parent: styleSheet,
                index: idx,
            };
        }
    }
    return null;
}
function hideOnDesktop(domEl) {
    domEl.classList.add(constants_1.Constants.HIDE_ON_DESKTOP);
}
exports.hideOnDesktop = hideOnDesktop;
function showOnDesktop(domEl) {
    domEl.classList.remove(constants_1.Constants.HIDE_ON_DESKTOP);
}
exports.showOnDesktop = showOnDesktop;
function hideOnMobile(domEl) {
    domEl.classList.add(constants_1.Constants.HIDE_ON_MOBILE);
}
exports.hideOnMobile = hideOnMobile;
function showOnMobile(domEl) {
    domEl.classList.remove(constants_1.Constants.HIDE_ON_MOBILE);
}
exports.showOnMobile = showOnMobile;
/**
 * get/set element from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the element which holds the content, i.e. a div, an image, ...
 */
function getContentNode(element) {
    const content = element.querySelector(':scope > .' + constants_1.Constants.ELEMENT_CONTENT_CLASS_NAME);
    return content || element;
}
exports.getContentNode = getContentNode;
/**
 * get/set element from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @param innerHTML the html content
 */
function setInnerHtml(element, innerHTML) {
    // get the container of the html content of the element
    const contentNode = getContentNode(element);
    // deactivate executable scripts and set html
    contentNode.innerHTML = deactivateScripts(innerHTML);
}
exports.setInnerHtml = setInnerHtml;
/**
 * get/set html from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the html content
 */
function getInnerHtml(element) {
    let innerHTML = getContentNode(element).innerHTML;
    // put back executable scripts
    innerHTML = reactivateScripts(innerHTML);
    return innerHTML;
}
exports.getInnerHtml = getInnerHtml;
/**
 * prevent scripts from executing in components, html boxes...
 * FIXME: script tags without type should also be "deactivated", @see WebsiteRouter::deactivateScripts
 * @return a safe html string
 */
function deactivateScripts(html) {
    return html.replace(/<script.*class="silex-script".*?>/gi, '<script type="text/notjavascript" class="silex-script">');
}
/**
 * undo the deactivateScript
 * @return the original html string
 */
function reactivateScripts(html) {
    return html.replace(/type="text\/notjavascript"/gi, 'type="text/javascript"');
}
/**
 * add a media query around the style string
 * will make the style mobile-only
 */
function addMediaQuery(styleStr) {
    return '@media ' + constants_1.Constants.MOBILE_MEDIA_QUERY + '{' + styleStr + '}';
}
exports.addMediaQuery = addMediaQuery;
/**
 * eval the scripts found in an element
 * this is useful when we render a template, since the scripts are executed
 * only when the page loads
 */
function executeScripts(win, element) {
    // execute the scripts
    const scripts = element.querySelectorAll('script');
    for (const el of scripts) {
        // tslint:disable:no-string-literal
        win['eval'](el.innerText);
    }
}
exports.executeScripts = executeScripts;
function removeWysihtmlMarkup(root) {
    Array.from(root.querySelectorAll('.wysihtml-editor')).forEach((el) => {
        el.classList.remove('wysihtml-sandbox');
        el.removeAttribute('contenteditable');
    });
}
exports.removeWysihtmlMarkup = removeWysihtmlMarkup;
/**
 * prodotype render in dom
 */
function renderWithProdotype(prodotypeInstance, options) {
    return prodotypeInstance.decorate(options.templateName, options.data, options.dataSources);
}
exports.renderWithProdotype = renderWithProdotype;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9lbGVtZW50LXN0b3JlL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFHSCwrQ0FBMkM7QUFDM0MsbUNBQWlGO0FBRWpGLDRDQUErQztBQUUvQyxTQUFnQixhQUFhLENBQUMsR0FBaUIsRUFBRSxPQUFxQjtJQUNwRSxPQUFPLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDM0MsQ0FBQztBQUZELHNDQUVDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsR0FBaUIsRUFBRSxTQUFvQjtJQUN2RSxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxxQkFBUyxDQUFDLG9CQUFvQixLQUFLLFNBQVMsSUFBSSxDQUFDLENBQUE7QUFDaEYsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0IsS0FBSyxDQUFDLE9BQW9CO0lBQ3hDLE9BQU8sT0FBTyxDQUFDLFlBQVksQ0FBQyxxQkFBUyxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFDN0QsQ0FBQztBQUZELHNCQUVDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLE1BQW1CLEVBQUUsUUFBdUI7SUFDMUUsMkJBQTJCO0lBQzNCLFFBQVE7U0FDTCxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtRQUNkLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDdEIscUNBQXFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFBO0lBQ0osMEVBQTBFO0lBQzFFLDJCQUEyQjtJQUMzQixrRkFBa0Y7SUFFbEYsS0FBSztBQUNQLENBQUM7QUFaRCwwQ0FZQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLE9BQW9CLEVBQUUsSUFBVTtJQUN0RCxJQUFJLElBQUksRUFBRTtRQUNSLE9BQU8sQ0FBQyxZQUFZLENBQUMscUJBQVMsQ0FBQyxTQUFT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