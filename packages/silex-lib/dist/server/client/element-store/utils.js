"use strict";
/**
 * @fileoverview Cross platform, it needs to run client and server side
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexOfElement = exports.browse = exports.editLink = exports.isVisibleInPage = exports.getAllStyles = exports.getDisplayName = exports.getDropStyle = exports.getCreationDropZone = exports.getBoundingBox = exports.getElementRect = exports.getElementStyle = exports.getNewId = exports.getDefaultStyle = exports.getEmptyElementData = exports.getCreateAction = exports.INITIAL_ELEMENT_SIZE = void 0;
const types_1 = require("./types");
const FileExplorer_1 = require("../components/dialog/FileExplorer");
const Notification_1 = require("../components/Notification");
const dom_1 = require("./dom");
const filters_1 = require("./filters");
const index_1 = require("./index");
const index_2 = require("../site-store/index");
const component_1 = require("./component");
const LinkDialog_1 = require("../components/dialog/LinkDialog");
const styles_1 = require("../utils/styles");
/**
 * constant for the prefix of the IDs given to Silex editable elements
 */
const ELEMENT_ID_PREFIX = 'silex-id-';
/**
 * constant for default size of an element
 */
exports.INITIAL_ELEMENT_SIZE = 100;
/**
 * get the states needed to add a new element to the store
 * @returns [elementToBeCreated, parentToBeUpdated]
 */
async function getCreateAction({ type, parent, isSectionContent, componentName }) {
    // create the element ready to be added to the stage
    const [element] = index_1.fromElementData([
        getEmptyElementData({
            id: getNewId(),
            type,
            isSectionContent,
            isBody: false
        })
    ]);
    const newParent = {
        ...parent,
        children: parent.children.concat(element.id),
    };
    // apply component styles etc
    if (!!componentName) {
        const newElement = await component_1.initComponent(element, componentName);
        return [{
                ...newElement,
                selected: true,
            },
            newParent,
        ];
    }
    return [{
            ...element,
            selected: true,
        },
        newParent,
    ];
}
exports.getCreateAction = getCreateAction;
function getEmptyElementData({ id, type, isSectionContent, isBody }) {
    return {
        id,
        tagName: type === types_1.ElementType.SECTION ? 'SECTION' : 'DIV',
        type,
        alt: null,
        title: null,
        isSectionContent,
        visibility: {
            desktop: true,
            mobile: true,
        },
        style: {
            desktop: JSON.parse(JSON.stringify({
                'width': exports.INITIAL_ELEMENT_SIZE + 'px',
                'height': exports.INITIAL_ELEMENT_SIZE + 'px',
                'background-color': type === types_1.ElementType.HTML || type === types_1.ElementType.CONTAINER ? 'rgb(255, 255, 255)' : undefined,
                ...getDefaultStyle({ type, isSectionContent, isBody }),
            })),
            mobile: {},
        },
        data: {
            component: null,
        },
        children: [],
        pageNames: [],
        classList: [],
        attr: {},
        link: null,
        enableEdit: type !== types_1.ElementType.SECTION && type !== types_1.ElementType.CONTAINER,
        enableDrag: /* type !== ElementType.SECTION && */ !isSectionContent,
        enableDrop: type === types_1.ElementType.SECTION || type === types_1.ElementType.CONTAINER,
        enableResize: type === types_1.ElementType.SECTION ? { top: false, bottom: false, left: false, right: false }
            : isSectionContent ? { top: true, bottom: true, left: true, right: true }
                : { top: true, bottom: true, left: true, right: true },
        selected: false,
        useMinHeight: type !== types_1.ElementType.IMAGE,
        innerHtml: type === types_1.ElementType.TEXT ? 'New text box'
            : type === types_1.ElementType.HTML ? '<p>New <strong>HTML</strong> box</p>'
                : '',
    };
}
exports.getEmptyElementData = getEmptyElementData;
function getDefaultStyle({ type, isSectionContent, isBody }) {
    // define the type specific styles
    const editableStyle = {
        position: 'absolute',
    };
    const bodyStyle = {
        position: 'static',
    };
    const section = {
        'position': 'static',
        'top': undefined,
        'left': undefined,
        'height': undefined,
        'width': undefined,
    };
    const sectionContent = {
        'position': 'relative',
        'top': undefined,
        'left': undefined,
        'width': undefined,
        'margin-left': 'auto',
        'margin-right': 'auto',
    };
    return Object.assign(editableStyle, type === types_1.ElementType.SECTION ? section : isSectionContent ? sectionContent : isBody ? bodyStyle : {});
}
exports.getDefaultStyle = getDefaultStyle;
let nextId = 0;
/**
 * Create new IDs
 */
function generateElementId() {
    let uniqueId;
    do {
        uniqueId = Date.now().toString() + '-' + nextId++;
    } while (filters_1.getElementById(uniqueId));
    return uniqueId;
}
function getNewId() {
    return ELEMENT_ID_PREFIX + generateElementId();
}
exports.getNewId = getNewId;
/**
 * get a given style for an element
 * to get the mobile style we may return the desktop style
 * because on mobile we apply the desktop style unless overriden for mobile only
 */
function getElementStyle(element, styleName, mobile) {
    if (mobile) {
        return typeof (element.style.mobile[styleName]) !== 'undefined' ?
            element.style.mobile[styleName] :
            (styleName === 'left' || styleName === 'top') && (!element.style.mobile.display || element.style.mobile.display === 'static') ?
                undefined :
                element.style.desktop[styleName];
    }
    return element.style.desktop[styleName];
}
exports.getElementStyle = getElementStyle;
// /**
//  * get an element size
//  * this takes into account all cases, i.e. element with style, section width, section height, section container whidth
//  * also takes the max width in mobile editor
//  */
// export function getElementSize(win: Window, element: ElementState, mobile: boolean, elements = getElements()): Size {
//   const result: Size = {width: -1, height: -1}
//   const width = getElementStyle(element, 'width', mobile)
//   if (width) result.width = parseInt(width)
//   else if (element.type === ElementType.SECTION) result.width = win.innerWidth
//   else if (element.isSectionContent) result.width = getSite().width
//   else {
//     console.error('Error: container has no width', element)
//     throw new Error('Can not get size of this element as it has no width')
//   }
//   if (mobile) result.width = Math.min(result.width, Constants.MOBILE_BREAKPOINT)
//
//   const height = getElementStyle(element, 'height', mobile)
//   if (height) result.height = parseInt(height)
//   else if (element.type === ElementType.SECTION) {
//     const sectionContent = getChildren(element, elements).find((el) => el.isSectionContent)
//     if(sectionContent) result.height = getElementSize(win, sectionContent, mobile).height
//     else result.height = 0
//     // else result.height = parseInt(getStyle(sectionContent, 'height', mobile))
//   } else {
//     console.error('Error: container has no height', element)
//     throw new Error('Can not get size of this element as it has no height')
//   }
//   return result
// }
// /**
//  * compute new element data
//  * center the element in the container
//  */
// export function center({element, parent, win, opt_offset = 0}: {
//   win: Window,
//   element: ElementState,
//   parent: ElementState,
//   opt_offset?: number,
// }): Point {
//   const parentSize = getElementSize(win, parent, false)
//   const elementSize = getElementSize(win, element, false)
//
//   const posX = Math.round((parentSize.width / 2) - (elementSize.width / 2))
//   const posY = Math.round((parentSize.height / 2) - (elementSize.height / 2))
//   return {
//     top: opt_offset + posY,
//     left: opt_offset + posX,
//   }
// }
function getElementRect(element, mobile) {
    if (element.isSectionContent && !mobile)
        return {
            top: null,
            left: null,
            width: index_2.getSite().width + 'px',
            height: getElementStyle(element, 'height', mobile),
        };
    else
        return {
            top: getElementStyle(element, 'top', mobile),
            left: getElementStyle(element, 'left', mobile),
            width: getElementStyle(element, 'width', mobile),
            height: getElementStyle(element, 'height', mobile),
        };
}
exports.getElementRect = getElementRect;
/**
 * get the bounding box of some elements relative to their common parent
 * width, height, top, left, right integers in pixels
 * Achtung: elements need to have their top, left, width, height styles set
 */
function getBoundingBox(rects) {
    return rects.reduce((aggr, rect) => {
        const box = {
            top: parseInt(rect.top || '0'),
            left: parseInt(rect.left || '0'),
            width: parseInt(rect.width || '0'),
            height: parseInt(rect.height || '0'),
            bottom: parseInt(rect.top || '0') + parseInt(rect.height || '0'),
            right: parseInt(rect.left || '0') + parseInt(rect.width || '0'),
        };
        const newRect = {
            top: Math.min(aggr.top, box.top),
            left: Math.min(aggr.left, box.left),
            bottom: Math.max(aggr.bottom, box.bottom),
            right: Math.max(aggr.right, box.right),
        };
        return {
            ...newRect,
            width: newRect.right - newRect.left,
            height: newRect.bottom - newRect.top,
        };
    }, {
        top: Infinity,
        left: Infinity,
        bottom: -Infinity,
        right: -Infinity,
        width: -Infinity,
        height: -Infinity,
    });
}
exports.getBoundingBox = getBoundingBox;
// /**
//  * get the bounding box of some elements relative to their common parent
//  * width, height, top, left, right integers in pixels
//  * Achtung: elements need to have their top, left, width, height styles set
//  */
// export function getBoundingBox(elements: ElementData[], mobile: boolean): FullBox {
//   // first check that elements have the required properties and share the same parent
//   if (elements
//     .some((element) => !['top', 'left', 'width', 'height']
//         .every((prop) => getElementStyle(element, prop, mobile) !== undefined))) {
//     return null
//   }
//
//   // compute the box dimentions
//   return elements.reduce((aggr, element) => {
//     const box: FullBox = {
//       top: parseInt(getElementStyle(element, 'top', mobile)),
//       left: parseInt(getElementStyle(element, 'left', mobile)),
//       width: parseInt(getElementStyle(element, 'width', mobile)),
//       height: parseInt(getElementStyle(element, 'height', mobile)),
//       bottom: parseInt(getElementStyle(element, 'top', mobile)) + parseInt(getElementStyle(element, 'height', mobile)),
//       right: parseInt(getElementStyle(element, 'left', mobile)) + parseInt(getElementStyle(element, 'width', mobile)),
//     }
//     return {
//       top: Math.min(aggr.top, box.top),
//       left: Math.min(aggr.left, box.left),
//       bottom: Math.max(aggr.bottom, box.bottom),
//       right: Math.max(aggr.right, box.right),
//       width: Math.max(aggr.width, box.width),
//       height: Math.max(aggr.height, box.height),
//     }
//   }, {
//     top: Infinity,
//     left: Infinity,
//     bottom: -Infinity,
//     right: -Infinity,
//     width: -Infinity,
//     height: -Infinity,
//   } as FullBox)
// }
function getCreationDropZone(isSection, stageEl) {
    if (isSection) {
        return filters_1.getBody();
    }
    // other than sections
    // find the topmost element in the middle of the stage
    const doc = stageEl.contentDocument;
    // compute stage size
    const stageSize = stageEl.getBoundingClientRect();
    const posX = Math.round((stageSize.width / 2)); // - (width / 2))
    const posY = Math.round((stageSize.height / 2)); // - (height / 2))
    // find the tpopmost in the DOM
    return doc.elementsFromPoint(posX, posY)
        // retrieve the model which holds this HTML element
        .map((domEl) => index_1.getElements().find((el) => dom_1.getDomElement(doc, el) === domEl))
        .filter((el) => !!el && el.enableDrop)
        // just the top most element
        .shift();
}
exports.getCreationDropZone = getCreationDropZone;
/**
 * get the final style for the element to be centered in the viewport
 */
function getDropStyle({ stageSize, parentSize, elementSize, offset = 0 }) {
    // get coords of element to be in the center of the viewport
    const topCenter = Math.round((stageSize.height / 2) - (elementSize.height / 2) - parentSize.top);
    const leftCenter = Math.round((stageSize.width / 2) - (elementSize.width / 2) - parentSize.left);
    // apply offset
    const topOffset = topCenter + offset;
    const leftOffset = leftCenter + offset;
    // constrain the element to be inside the container
    const top = Math.max(0, Math.min(topOffset, parentSize.height - elementSize.height));
    const left = Math.max(0, Math.min(leftOffset, parentSize.width - elementSize.width));
    return { top, left };
}
exports.getDropStyle = getDropStyle;
/**
 * get a human readable name for this element
 */
function getDisplayName(element) {
    if (component_1.isComponent(element)) {
        return `${element.data.component.templateName}`;
    }
    if (element.isSectionContent) {
        return 'Section Container';
    }
    switch (element.type) {
        case types_1.ElementType.TEXT: return 'Text';
        case types_1.ElementType.IMAGE: return 'Image';
        case types_1.ElementType.CONTAINER: return 'Container';
        case types_1.ElementType.HTML: return 'Html';
        // case ElementType.CONTAINER_CONTENT: return 'Container';
        case types_1.ElementType.SECTION: return 'Section';
    }
}
exports.getDisplayName = getDisplayName;
/**
 * @param doc docment of the iframe containing the website
 * @return the string defining all elements styles
 */
function getAllStyles() {
    const styles = index_1.getElements()
        .map((el) => ({
        desktop: Object.keys(el.style.desktop).length ? el.style.desktop : null,
        mobile: Object.keys(el.style.mobile).length ? el.style.mobile : null,
        useMinHeight: el.useMinHeight,
        id: el.id,
    }))
        .reduce((prev, { mobile, desktop, useMinHeight, id }) => ({
        desktop: prev.desktop + (desktop ? `\n.${id} {\n${styles_1.styleToString(desktop, useMinHeight, '\n    ')}\n}\n` : ''),
        mobile: prev.mobile + (mobile ? `\n.${id} {\n${styles_1.styleToString(mobile, useMinHeight, '\n    ')}\n}\n` : ''),
    }), {
        desktop: '',
        mobile: '',
    });
    return `${styles.desktop}\n\n${dom_1.addMediaQuery(styles.mobile)}\n`;
}
exports.getAllStyles = getAllStyles;
/**
 * @returns true if the element and all of its parents are visible in the given page
 */
function isVisibleInPage(element, pageId) {
    return !filters_1.getAllParents(element)
        .concat(element)
        // find one which is not visible => break
        .find((el) => el.pageNames.length > 0 && !el.pageNames.includes(pageId));
}
exports.isVisibleInPage = isVisibleInPage;
function editLink(e, linkData, cbk) {
    e.preventDefault();
    LinkDialog_1.openLinkDialog({
        data: linkData,
        cbk,
    });
}
exports.editLink = editLink;
function browse(e, cbk) {
    e.preventDefault();
    // browse with CE
    const promise = FileExplorer_1.FileExplorer.getInstance().openFile();
    // handle the result
    promise
        .then((fileInfo) => {
        if (fileInfo) {
            cbk([fileInfo]);
        }
    })
        .catch((error) => {
        Notification_1.Notification.notifyError('Error: I could not select the file. <br /><br />' + (error.message || ''));
    });
}
exports.browse = browse;
/**
 * get the index of the element in the DOM
 */
function indexOfElement(element) {
    const len = element.parentElement.childNodes.length;
    for (let idx = 0; idx < len; idx++) {
        if (element.parentElement.childNodes[idx] === element) {
            return idx;
        }
    }
    return -1;
}
exports.indexOfElement = indexOfElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L2VsZW1lbnQtc3RvcmUvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsbUNBU2dCO0FBQ2hCLG9FQUFnRTtBQUVoRSw2REFBeUQ7QUFDekQsK0JBQW9EO0FBQ3BELHVDQUFrRTtBQUNsRSxtQ0FBc0Q7QUFDdEQsK0NBQTZDO0FBQzdDLDJDQUF3RDtBQUN4RCxnRUFBZ0U7QUFDaEUsNENBQStDO0FBRS9DOztHQUVHO0FBQ0gsTUFBTSxpQkFBaUIsR0FBRyxXQUFXLENBQUE7QUFFckM7O0dBRUc7QUFDVSxRQUFBLG9CQUFvQixHQUFHLEdBQUcsQ0FBQTtBQUV2Qzs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsZUFBZSxDQUFDLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBS25GO0lBQ0Msb0RBQW9EO0lBQ3BELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyx1QkFBZSxDQUFDO1FBQ2hDLG1CQUFtQixDQUFDO1lBQ2xCLEVBQUUsRUFBRSxRQUFRLEVBQUU7WUFDZCxJQUFJO1lBQ0osZ0JBQWdCO1lBQ2hCLE1BQU0sRUFBRSxLQUFLO1NBQ2QsQ0FBQztLQUNILENBQUMsQ0FBQTtJQUNGLE1BQU0sU0FBUyxHQUFHO1FBQ2hCLEdBQUcsTUFBTTtRQUNULFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0tBQzdDLENBQUE7SUFFRCw2QkFBNkI7SUFDN0IsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFO1FBQ25CLE1BQU0sVUFBVSxHQUFHLE1BQU0seUJBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7UUFDOUQsT0FBTyxDQUFDO2dCQUNKLEdBQUcsVUFBVTtnQkFDYixRQUFRLEVBQUUsSUFBSTthQUNmO1lBQ0QsU0FB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