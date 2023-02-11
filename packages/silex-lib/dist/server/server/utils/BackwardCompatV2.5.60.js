"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicationPath = exports.getSiteFromDom = exports.getPagesFromDom = exports.writeSiteStyles = exports.writeStyles = exports.getElementsFromDomBC = exports.cleanupBefore = exports.getElementDataBC = exports.loadProperties = void 0;
const jsBeautify = require("js-beautify");
const types_1 = require("../../client/element-store/types");
const constants_1 = require("../../constants");
const utils_1 = require("../../client/element-store/utils");
const dom_1 = require("../../client/site-store/dom");
const dom_2 = require("../../client/element-store/dom");
const DomTools_1 = require("./DomTools");
const componentsV2_5_60_1 = require("./componentsV2.5.60");
const SILEX_CLASS_NAMES_TO_IGNORE = [
    'silex-container-content',
    constants_1.Constants.PREVENT_DROPPABLE_CLASS_NAME,
    constants_1.Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT,
    constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME,
    constants_1.Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
    constants_1.Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
    constants_1.Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
    constants_1.Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
    constants_1.Constants.PREVENT_SELECTABLE_CLASS_NAME,
    constants_1.Constants.PREVENT_DRAGGABLE_CLASS_NAME,
    constants_1.Constants.EDITABLE_CLASS_NAME,
    constants_1.Constants.ENABLE_MOBILE_CSS_CLASS,
    constants_1.Constants.PAGED_CLASS_NAME,
    constants_1.Constants.PAGED_HIDDEN_CLASS_NAME,
    constants_1.Constants.PAGED_VISIBLE_CLASS_NAME,
    constants_1.Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
    constants_1.Constants.PAGE_LINK_ACTIVE_CLASS_NAME,
    constants_1.Constants.STAGE_COMPONENT_SELECTED_CLASS_NAME,
    constants_1.Constants.STAGE_COMPONENT_NOT_SELECTED_CLASS_NAME,
    constants_1.Constants.SELECTED_CLASS_NAME,
    constants_1.Constants.RESIZING_CLASS_NAME,
    constants_1.Constants.DRAGGING_CLASS_NAME,
    types_1.ElementType.CONTAINER,
    types_1.ElementType.SECTION,
    types_1.ElementType.IMAGE,
    types_1.ElementType.TEXT,
    types_1.ElementType.HTML,
    constants_1.Constants.ELEMENT_CONTENT_CLASS_NAME,
    constants_1.Constants.HIDE_ON_MOBILE,
    constants_1.Constants.HIDE_ON_DESKTOP,
    constants_1.Constants.COMPONENT_CLASS_NAME,
    constants_1.Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME,
    constants_1.Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME,
    constants_1.Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME,
    constants_1.Constants.BODY_STYLE_CSS_CLASS,
];
////////////////////////////////////////////////////////////
// Elements
/**
 * get/set Silex ID
 * @return uniqueId
 */
function getElementId(element) {
    return element.getAttribute(constants_1.Constants.ELEMENT_ID_ATTR_NAME);
}
const EMPTY_PRODOTYPE_DATA = { component: {}, style: {} };
function loadProperties(doc) {
    const styleTag = doc.querySelector('.' + constants_1.Constants.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null) {
        const styles = JSON.parse(styleTag.innerHTML)[0];
        return {
            fonts: styles.fonts || [],
            dataSources: styles.dataSources || {},
            stylesObj: styles.desktop || {},
            mobileStylesObj: styles.mobile || {},
            prodotypeDataObj: styles.prodotypeData &&
                styles.prodotypeData.component &&
                styles.prodotypeData.style ?
                {
                    component: styles.prodotypeData.component,
                    style: styles.prodotypeData.style,
                } :
                EMPTY_PRODOTYPE_DATA,
        };
    }
    else {
        console.info('Warning: no JSON styles array found in the dom');
        return {
            fonts: [],
            dataSources: {},
            stylesObj: {},
            mobileStylesObj: {},
            prodotypeDataObj: EMPTY_PRODOTYPE_DATA,
        };
    }
}
exports.loadProperties = loadProperties;
const EDITABLE = [types_1.ElementType.HTML, types_1.ElementType.IMAGE, types_1.ElementType.TEXT];
const DROPPABLE = [types_1.ElementType.CONTAINER, types_1.ElementType.SECTION];
const HAVE_INNER_HTML = [types_1.ElementType.HTML, types_1.ElementType.TEXT, types_1.ElementType.IMAGE];
const HAVE_ALT = [types_1.ElementType.IMAGE];
function getElementDataBC(doc, data, element) {
    const linkValue = element.getAttribute('data-silex-href');
    const linkType = linkValue ? linkValue.startsWith('#!page-') ? types_1.LinkType.PAGE : types_1.LinkType.URL : null;
    const id = getElementId(element);
    const isBody = element.classList.contains('body-initial');
    const type = isBody ? types_1.ElementType.CONTAINER : getTypeBC(element); // sometimes body has no type attr
    const isSectionContent = element.classList.contains(constants_1.Constants.ELEMENT_CONTENT_CLASS_NAME);
    const pages = getPagesForElementBC(doc, element);
    return {
        id,
        pageNames: pages.map((p) => p.id),
        classList: element.className
            .split(' ')
            .filter((c) => c !== id)
            .filter((c) => !pages.find((p) => p.id === c))
            .filter((c) => !SILEX_CLASS_NAMES_TO_IGNORE.includes(c)),
        tagName: 'DIV',
        type,
        isSectionContent,
        title: element.title,
        alt: HAVE_ALT.includes(type) ? element.querySelector('img').alt : null,
        children: Array.from(element.children)
            .filter((child) => child.classList.contains(constants_1.Constants.EDITABLE_CLASS_NAME))
            .map((el) => getElementId(el)),
        link: linkType && linkValue ? {
            linkType,
            href: linkValue,
        } : null,
        enableEdit: EDITABLE.includes(type),
        enableDrag: type === types_1.ElementType.SECTION || !element.classList.contains(constants_1.Constants.PREVENT_DRAGGABLE_CLASS_NAME),
        enableDrop: DROPPABLE.includes(type) && !element.classList.contains(constants_1.Constants.PREVENT_DROPPABLE_CLASS_NAME),
        enableResize: {
            top: !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
            bottom: !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
            left: type !== types_1.ElementType.SECTION && !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME),
            right: type !== types_1.ElementType.SECTION && !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(constants_1.Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME),
        },
        selected: false,
        useMinHeight: type !== types_1.ElementType.IMAGE && !element.classList.contains(constants_1.Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT),
        visibility: {
            desktop: !element.classList.contains(constants_1.Constants.HIDE_ON_DESKTOP),
            mobile: !element.classList.contains(constants_1.Constants.HIDE_ON_MOBILE),
        },
        style: {
            desktop: getStylesFromDomBC({
                data,
                element,
                mobile: false,
                type,
                isSectionContent,
                isBody,
            }),
            mobile: getStylesFromDomBC({
                data,
                element,
                mobile: true,
                type,
                isSectionContent,
                isBody,
            }),
        },
        data: {
            component: getComponentDataFromDomBC(data, element),
        },
        innerHtml: HAVE_INNER_HTML.includes(type) ? dom_2.getInnerHtml(element) : '',
    };
}
exports.getElementDataBC = getElementDataBC;
/**
 * cleanup the dom before converting all elements
 */
function cleanupBefore(doc) {
    Array.from(doc.querySelectorAll('.image-element img'))
        .forEach((element) => element.classList.remove(constants_1.Constants.ELEMENT_CONTENT_CLASS_NAME));
}
exports.cleanupBefore = cleanupBefore;
/**
 * get all elements visible when the given page is opened
 */
function getElementsFromDomBC(doc) {
    const data = loadProperties(doc);
    return Array.from(doc.querySelectorAll(`.${constants_1.Constants.EDITABLE_CLASS_NAME}`))
        .map((element) => getElementDataBC(doc, data, element));
}
exports.getElementsFromDomBC = getElementsFromDomBC;
function writeStyles(doc, elements) {
    elements.forEach((el) => {
        dom_2.writeStyleToDom(doc, el, false);
        dom_2.writeStyleToDom(doc, el, true);
    });
}
exports.writeStyles = writeStyles;
function writeSiteStyles(doc, site) {
    // website width
    dom_1.setWebsiteWidthInDom(doc, site.width);
}
exports.writeSiteStyles = writeSiteStyles;
function getStylesFromDomBC({ data, element, mobile, type, isSectionContent, isBody }) {
    const elementId = getElementId(element);
    const targetObj = (mobile ? data.mobileStylesObj : data.stylesObj);
    const style = targetObj[elementId] || {};
    // create the style applied byt the editor
    const silexInlineStyle = {
        ...style,
        height: style.height || style['min-height'],
    };
    delete silexInlineStyle['min-height'];
    if (isBody) {
        delete silexInlineStyle.height;
    }
    if (mobile) {
        return {
            ...silexInlineStyle,
        };
    }
    else {
        return JSON.parse(JSON.stringify({
            ...silexInlineStyle,
            ...utils_1.getDefaultStyle({ type, isSectionContent, isBody }),
        }));
    }
}
function getComponentDataFromDomBC(data, element) {
    const elementId = getElementId(element);
    if (data.prodotypeDataObj.component[elementId]) {
        const justData = {
            ...data.prodotypeDataObj.component[elementId],
        };
        delete justData.displayName;
        delete justData.name;
        delete justData.templateName;
        return {
            displayName: data.prodotypeDataObj.component[elementId].displayName,
            name: data.prodotypeDataObj.component[elementId].name,
            templateName: data.prodotypeDataObj.component[elementId].templateName,
            data: justData,
        };
    }
    return null;
}
/**
 * get/set type of the element
 * @param element   created by silex, either a text box, image, ...
 * @return           the type of element
 * example: for a container this will return "container"
 */
function getTypeBC(element) {
    switch (element.getAttribute(constants_1.Constants.TYPE_ATTR)) {
        case types_1.ElementType.CONTAINER.toString(): return element.classList.contains('section-element') ? types_1.ElementType.SECTION : types_1.ElementType.CONTAINER;
        case types_1.ElementType.SECTION.toString(): return types_1.ElementType.SECTION;
        case types_1.ElementType.IMAGE.toString(): return types_1.ElementType.IMAGE;
        case types_1.ElementType.TEXT.toString(): return types_1.ElementType.TEXT;
        case types_1.ElementType.HTML.toString(): return types_1.ElementType.HTML;
    }
    console.error('unknown type', element);
    throw new Error('unknown type ' + element.getAttribute(constants_1.Constants.TYPE_ATTR));
}
/**
 * get the pages on which this element is visible
 */
function getPagesForElementBC(doc, element) {
    return getPagesFromDom(doc).filter((pageData) => element.classList.contains(pageData.id));
}
////////////////////////////////////////////////////////////
// Pages
/**
 * Util function to get page data from name
 */
function getPageDataFromElement(element) {
    const pageName = element.getAttribute('id');
    return {
        id: pageName,
        displayName: element.innerHTML,
        link: {
            linkType: types_1.LinkType.PAGE,
            href: '#!' + pageName,
        },
        // opened: getCurrentPageName() === pageName,
        canDelete: !element.hasAttribute(constants_1.Constants.PAGE_PREVENT_DELETE),
        canProperties: !element.hasAttribute(constants_1.Constants.PAGE_PREVENT_PROPERTIES),
        canMove: !element.hasAttribute(constants_1.Constants.PAGE_PREVENT_MOVE),
        canRename: !element.hasAttribute(constants_1.Constants.PAGE_PREVENT_RENAME),
    };
}
// /**
//  * Util function to get page data from name
//  */
// function getPageData(doc, pageName): PageData {
//   const element = doc.getElementById(pageName) as HTMLAnchorElement
//   if (element) {
//     return getPageDataFromElement(element)
//   } else {
//     // this happens while undoing or redoing
//     // or when the page does not exist
//     return null
//   }
// }
/**
 * get the pages from the dom
 * @return an array of the page names I have found in the DOM
 */
function getPagesFromDom(doc) {
    return Array.from(doc.body.querySelectorAll(`a[data-silex-type="${constants_1.Constants.TYPE_PAGE}"]`))
        .map((element) => getPageDataFromElement(element));
}
exports.getPagesFromDom = getPagesFromDom;
/////////////////////////////////////////////////////////////////////////
// Site
function getSiteFromDom(doc) {
    const properties = loadProperties(doc);
    return {
        title: doc.querySelector('title').innerHTML,
        description: getMeta(doc, 'description'),
        enableMobile: doc.body.classList.contains(constants_1.Constants.ENABLE_MOBILE_CSS_CLASS),
        publicationPath: getPublicationPath(doc),
        websiteUrl: getMeta(doc, 'websiteUrl'),
        faviconPath: getFaviconPath(doc),
        thumbnailSocialPath: getMeta(doc, 'og:image') || getMeta(doc, 'twitter:image'),
        descriptionSocial: getMeta(doc, 'twitter:description') || getMeta(doc, 'og:description'),
        titleSocial: getMeta(doc, 'twitter:title') || getMeta(doc, 'og:title'),
        lang: doc.querySelector('html').lang,
        width: getWebsiteWidth(doc),
        headUser: DomTools_1.default.extractUserHeadTag(doc.head.innerHTML).userHead,
        headStyle: getHeadStyle(doc),
        headScript: getHeadScript(doc),
        hostingProvider: getMeta(doc, 'hostingProvider'),
        twitterSocial: getMeta(doc, 'twitter:site'),
        dataSources: properties.dataSources,
        fonts: properties.fonts,
        styles: properties.prodotypeDataObj.style,
        isTemplate: false,
        file: null,
        prodotypeDependencies: getDependenciesFromDom(properties),
        data: {},
    };
}
exports.getSiteFromDom = getSiteFromDom;
function getDependenciesFromDom(properties) {
    const res = {};
    Object.keys(properties.prodotypeDataObj.component)
        .map((compName) => ({
        compName,
        templateName: properties.prodotypeDataObj.component[compName].templateName,
    }))
        .map(({ compName, templateName }) => ({
        compName,
        dependencies: componentsV2_5_60_1.default[templateName] ? componentsV2_5_60_1.default[templateName].dependencies : [],
    }))
        .filter(({ dependencies }) => !!dependencies)
        .forEach(({ compName, dependencies }) => {
        res[compName] = [dependencies];
    });
    return res;
}
function getMeta(doc, name) {
    const metaNode = doc.querySelector('meta[name="' + name + '"]');
    if (metaNode) {
        return metaNode.getAttribute('content');
    }
    else {
        return null;
    }
}
function getPublicationPath(doc) {
    const fileInfo = getMeta(doc, 'publicationPath');
    try {
        return fileInfo == null ? null : JSON.parse(fileInfo);
    }
    catch (e) {
        // this happens with old publication path (just a string)
        return null;
    }
}
exports.getPublicationPath = getPublicationPath;
function getFaviconPath(doc) {
    const faviconTag = doc.querySelector('link[rel="shortcut icon"]');
    if (faviconTag) {
        return faviconTag.getAttribute('href');
    }
    return null;
}
function getWebsiteWidth(doc) {
    const width = getMeta(doc, 'website-width');
    return !!width ? parseInt(width) : null;
}
const BEAUTIFY_CSS_OPTIONS = {
    indent_size: 2,
};
function getHeadStyle(doc) {
    // get silex styles from the DOM
    const silexStyle = doc.head.querySelector('.' + constants_1.Constants.SILEX_STYLE_ELEMENT_CSS_CLASS);
    if (!silexStyle) {
        console.warn('no silex editable styles defined');
        return '';
    }
    // tslint:disable:no-string-literal
    return jsBeautify.css_beautify(silexStyle.innerHTML, BEAUTIFY_CSS_OPTIONS);
}
function getHeadScript(doc) {
    // get silex scripts from the DOM
    const scriptTag = doc.querySelector('.' + constants_1.Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS);
    if (!scriptTag) {
        return '';
    }
    return scriptTag.innerHTML;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFja3dhcmRDb21wYXRWMi41LjYwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci91dGlscy9CYWNrd2FyZENvbXBhdFYyLjUuNjAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMENBQXlDO0FBRXpDLDREQUFvSTtBQUNwSSwrQ0FBMkM7QUFJM0MsNERBQWtFO0FBQ2xFLHFEQUFrRTtBQUNsRSx3REFBOEY7QUFDOUYseUNBQWlDO0FBQ2pDLDJEQUE4QztBQWtCOUMsTUFBTSwyQkFBMkIsR0FBRztJQUNsQyx5QkFBeUI7SUFDekIscUJBQVMsQ0FBQyw0QkFBNEI7SUFDdEMscUJBQVMsQ0FBQyw4QkFBOEI7SUFDeEMscUJBQVMsQ0FBQyw0QkFBNEI7SUFDdEMscUJBQVMsQ0FBQyxnQ0FBZ0M7SUFDMUMscUJBQVMsQ0FBQyxpQ0FBaUM7SUFDM0MscUJBQVMsQ0FBQyxtQ0FBbUM7SUFDN0MscUJBQVMsQ0FBQyxrQ0FBa0M7SUFDNUMscUJBQVMsQ0FBQyw2QkFBNkI7SUFDdkMscUJBQVMsQ0FBQyw0QkFBNEI7SUFDdEMscUJBQVMsQ0FBQyxtQkFBbUI7SUFDN0IscUJBQVMsQ0FBQyx1QkFBdUI7SUFDakMscUJBQVMsQ0FBQyxnQkFBZ0I7SUFDMUIscUJBQVMsQ0FBQyx1QkFBdUI7SUFDakMscUJBQVMsQ0FBQyx3QkFBd0I7SUFDbEMscUJBQVMsQ0FBQyxnQ0FBZ0M7SUFDMUMscUJBQVMsQ0FBQywyQkFBMkI7SUFDckMscUJBQVMsQ0FBQyxtQ0FBbUM7SUFDN0MscUJBQVMsQ0FBQyx1Q0FBdUM7SUFDakQscUJBQVMsQ0FBQyxtQkFBbUI7SUFDN0IscUJBQVMsQ0FBQyxtQkFBbUI7SUFDN0IscUJBQVMsQ0FBQyxtQkFBbUI7SUFDN0IsbUJBQVcsQ0FBQyxTQUFTO0lBQ3JCLG1CQUFXLENBQUMsT0FBTztJQUNuQixtQkFBVyxDQUFDLEtBQUs7SUFDakIsbUJBQVcsQ0FBQyxJQUFJO0lBQ2hCLG1C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