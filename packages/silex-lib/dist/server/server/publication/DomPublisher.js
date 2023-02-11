"use strict";
/**
 * @fileoverview Helper class used to cleanup the DOM when publishing a website
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitPages = exports.domToFileOperations = exports.splitInFiles = exports.extractAssets = exports.cleanup = void 0;
const url_1 = require("url");
const Path = require("path");
const constants_1 = require("../../constants");
const DomTools_1 = require("../utils/DomTools");
/**
 * cleanup the provided dom from markup useless outside the editor
 * remove Silex specific data from HTML
 * create an external CSS file
 * generates a list of js scripts and assets to be eported with the file
 */
function cleanup(win) {
    const doc = win.document;
    // cleanupFirefoxInlines();
    // remove publication path
    // remove JSON styles
    // remove prodotype previews
    Array.from(doc.querySelectorAll(constants_1.Constants.ELEMENTS_TO_REMOVE_AT_PUBLISH.join(', ')))
        .forEach((tagToRemove) => {
        tagToRemove.parentElement.removeChild(tagToRemove);
    });
    [
        constants_1.Constants.TYPE_ATTR,
        constants_1.Constants.ELEMENT_ID_ATTR_NAME,
        constants_1.Constants.STATIC_ASSET_ATTR,
        constants_1.Constants.PRODOTYPE_DEPENDENCY_ATTR,
        constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME,
        constants_1.Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
        constants_1.Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
        constants_1.Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
        constants_1.Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
        constants_1.Constants.PREVENT_SELECTABLE_CLASS_NAME,
        constants_1.Constants.PREVENT_DRAGGABLE_CLASS_NAME,
        constants_1.Constants.PREVENT_DROPPABLE_CLASS_NAME,
        'linktype',
    ]
        .forEach((attr) => {
        Array.from(doc.querySelectorAll(`[${attr}]`))
            .forEach(el => {
            el.removeAttribute(attr);
        });
    });
    // remote type attribute of JS script tags
    // remove w3c warning "The type attribute is unnecessary for JavaScript resources"
    // FIXME: we should just remove type from all the components and silex script tags, but for now it is useful to keep it during edition as some selectors rely on it for now
    Array.from(doc.querySelectorAll('script[type="text/javascript"]'))
        .forEach(el => {
        el.removeAttribute('type');
    });
    // remove empty style attributes
    Array.from(doc.querySelectorAll('[style=""]'))
        .forEach(el => {
        el.removeAttribute('style');
    });
}
exports.cleanup = cleanup;
/**
 * build an array of assets to be included in the publication, with their destination paths
 * baseUrl: url of the folder containing the website HTML file, e.g `http://localhost:6805/ce/fs/get/tmp/`
 * rootUrl: url of the folder where we will publish, e.g `http://localhost:6805/ce/fs/get/tmp/pub/`
 * hookedRootUrl: url returned by getRootUrl from the hosting provider
 * rootPath: absolute path of the publication folder, e.g  `tmp/pub`
 * getDestFolder: destination folder for each file, possibly modified by the hosting probider hooks
 * win: the mutable DOM
 */
function extractAssets({ baseUrl, rootUrl, hookedRootUrl, rootPath, win, getDestFolder, }) {
    const files = [];
    DomTools_1.default.transformPaths(win, null, (path, el, isInHead) => {
        // el may be null if the path comes from the JSON object holding Silex data
        // This is never supposed to happen because the tag holding the JSON object
        // is removed from the head tag in DomPublisher::cleanup.
        // But sometimes it appears that the tags are in the body
        // Maybe we should change cleanup to look for the tagsToRemove also in the body?
        const tagName = el ? el.tagName : null;
        const url = new url_1.URL(path, baseUrl);
        if (isDownloadable(url, rootUrl)) {
            const fileName = Path.basename(url.pathname);
            const destFolder = getDestFolder(Path.extname(url.pathname), tagName);
            if (destFolder) {
                const destPath = `${destFolder}/${fileName}`;
                files.push({
                    original: path,
                    srcPath: url.href,
                    destPath: rootPath + '/' + destPath,
                    tagName,
                    displayName: fileName,
                });
                if (!!hookedRootUrl) {
                    return hookedRootUrl + destPath;
                }
                else if (tagName) {
                    // not an URL from a style sheet
                    return destPath;
                }
                else {
                    // URL from a style sheet
                    // called from '/css'
                    return '../' + destPath;
                }
            }
        }
        return null;
    });
    return files;
}
exports.extractAssets = extractAssets;
/**
 * extract the js and css from the single editable HTML file
 * insert the user head tag in the DOM
 * converts custom links of editable version to standard <a> tags
 */
function splitInFiles({ hookedRootUrl, win, userHead, }) {
    const doc = win.document;
    // final js script to store in js/script.js
    const scriptTags = [];
    Array.from(doc.head.querySelectorAll('script'))
        .forEach((tag) => {
        if (!tag.src && tag.innerHTML) {
            tag.parentElement.removeChild(tag);
            scriptTags.push(tag);
        }
    });
    // link the user's script
    if (scriptTags.length > 0) {
        const scriptTagSrc = doc.createElement('script');
        scriptTagSrc.src = `${hookedRootUrl || ''}js/script.js`;
        doc.head.appendChild(scriptTagSrc);
    }
    // add head css
    // and components css
    const styleTags = [];
    Array.from(doc.querySelectorAll('style'))
        .forEach((tag) => {
        tag.parentElement.removeChild(tag);
        styleTags.push(tag);
    });
    // link the user's stylesheet
    if (styleTags.length > 0) {
        const cssTagSrc = doc.createElement('link');
        cssTagSrc.href = `${hookedRootUrl || ''}css/styles.css`;
        cssTagSrc.rel = 'stylesheet';
        doc.head.appendChild(cssTagSrc);
    }
    // put back the user head now that all other scrips and styles are moved to external files
    doc.head.innerHTML += userHead;
    // doc.head.appendChild(doc.createTextNode(userHead));
    return {
        scriptTags,
        styleTags,
    };
}
exports.splitInFiles = splitInFiles;
/**
 * det if a given URL is supposed to be downloaded locally
 * @returns true if the url is relative or it is a known domain (sttic.silex.me)
 */
function isDownloadable(url, rootUrl) {
    // do not download files with GET params since it is probably dynamic
    return url.search === ''
        // do not download data:* images
        && url.protocol !== 'data:'
        && (!rootUrl || rootUrl.startsWith(url.origin));
}
/**
 * get a page name, with a hook and default value (index.html for the first page)
 */
function getPageName(permalinkHook, pageName, initialFirstPageName, newFirstPageName) {
    return permalinkHook(pageName === initialFirstPageName && newFirstPageName ? newFirstPageName : pageName + '.html');
}
/**
 * convert a list of html elements to unifile write operations
 */
function domToFileOperations(tags, path, displayName) {
    return {
        name: 'writefile',
        displayName,
        path,
        content: tags.reduce((prev, tag) => prev + '\n' + tag.innerHTML, ''),
    };
}
exports.domToFileOperations = domToFileOperations;
/**
 * split the editable HTML into pages
 * @returns unifile actions to write files
 */
function splitPages({ newFirstPageName, permalinkHook, pageTitleHook, pageLinkHook, win, data, rootPath, getDestFolder, }) {
    const doc = win.document;
    doc.body.classList.add(constants_1.Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME);
    // remove unused scripts when there is no deeplink navigation anymore
    ['js/jquery-ui.js', 'js/pageable.js']
        .map((path) => doc.querySelector(`script[src="${path}"]`))
        .filter((el) => !!el) // when not updated yet to the latest version, the URLs are not relative
        .forEach((el) => el.parentElement.removeChild(el));
    // split in multiple pages
    if (data.pages.length === 0) {
        throw new Error('The website has 0 pages.');
    }
    const initialFirstPageName = data.pages[0].id;
    return data.pages
        .map((page) => {
        return {
            name: page.id,
            fileName: getPageName(permalinkHook, page.id, initialFirstPageName, newFirstPageName),
            page,
        };
    })
        .map(({ name, fileName, page }) => {
        // clone the document
        const clone = doc.cloneNode(true);
        // update title
        const titleTag = clone.head.querySelector('title');
        if (titleTag) {
            titleTag.innerHTML = pageTitleHook(page);
        }
        // add page name on the body (used in front-end.js)
        clone.body.setAttribute('data-current-page', name);
        // remove elements from other pages
        Array.from(clone.querySelectorAll(`.${constants_1.Constants.PAGED_CLASS_NAME}`))
            .forEach((el) => {
            if (el.classList.contains(name)) {
                el.classList.add(constants_1.Constants.PAGED_VISIBLE_CLASS_NAME);
            }
            else {
                el.parentElement.removeChild(el);
            }
        });
        // update links
        Array.from(clone.querySelectorAll('a'))
            .filter((el) => el.hash.startsWith(constants_1.Constants.PAGE_NAME_PREFIX + constants_1.Constants.PAGE_ID_PREFIX))
            .forEach((el) => {
            // split page name and anchor, e.g. #!page-page-1#anchor1
            const [pageName, anchor] = el.hash.substr(constants_1.Constants.PAGE_NAME_PREFIX.length).split('#');
            // get the name of the page, with hook and default name (index.html for the first page)
            const newName = getPageName(permalinkHook, pageName, initialFirstPageName, newFirstPageName);
            el.href = pageLinkHook(newName) + (anchor ? '#' + anchor : '');
            // mark link as active if it links to the current page
            if (pageName === name) {
                el.classList.add(constants_1.Constants.PAGE_LINK_ACTIVE_CLASS_NAME);
            }
            else {
                el.classList.remove(constants_1.Constants.PAGE_LINK_ACTIVE_CLASS_NAME); // may be added when you save the file
            }
        });
        // remove useless css classes
        // do not do this before as these classes are needed until the last moment, e.g. to select paged elements
        constants_1.Constants.SILEX_CLASS_NAMES_TO_REMOVE_AT_PUBLISH.forEach((className) => {
            Array.from(clone.getElementsByClassName(className))
                .forEach((el) => el.classList.remove(className));
        });
        // create a unifile batch action
        return {
            name: 'writefile',
            path: rootPath + '/' + getDestFolder('.html', null) + '/' + fileName,
            displayName: fileName,
            content: '<!doctype html>' + clone.documentElement.outerHTML,
        };
    });
}
exports.splitPages = splitPages;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9tUHVibGlzaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9wdWJsaWNhdGlvbi9Eb21QdWJsaXNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBSUgsNkJBQXlCO0FBQ3pCLDZCQUE0QjtBQUc1QiwrQ0FBMkM7QUFHM0MsZ0RBQXdDO0FBRXhDOzs7OztHQUtHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLEdBQWM7SUFDcEMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQTtJQUV4QiwyQkFBMkI7SUFFM0IsMEJBQTBCO0lBQzFCLHFCQUFxQjtJQUNyQiw0QkFBNEI7SUFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMscUJBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNuRixPQUFPLENBQUMsQ0FBQyxXQUF3QixFQUFFLEVBQUU7UUFDcEMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDcEQsQ0FBQyxDQUFDLENBTUQ7SUFBQTtRQUNDLHFCQUFTLENBQUMsU0FBUztRQUNuQixxQkFBUyxDQUFDLG9CQUFvQjtRQUM5QixxQkFBUyxDQUFDLGlCQUFpQjtRQUMzQixxQkFBUyxDQUFDLHlCQUF5QjtRQUNuQyxxQkFBUyxDQUFDLDRCQUE0QjtRQUN0QyxxQkFBUyxDQUFDLGdDQUFnQztRQUMxQyxxQkFBUyxDQUFDLGlDQUFpQztRQUMzQyxxQkFBUyxDQUFDLG1DQUFtQztRQUM3QyxxQkFBUyxDQUFDLGtDQUFrQztRQUM1QyxxQkFBUyxDQUFDLDZCQUE2QjtRQUN2QyxxQkFBUyxDQUFDLDRCQUE0QjtRQUN0QyxxQkFBUyxDQUFDLDRCQUE0QjtRQUN0QyxVQUFVO0tBQ1g7U0FDQSxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRTtRQUN4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