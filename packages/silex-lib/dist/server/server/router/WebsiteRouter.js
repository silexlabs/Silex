"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unprepareWebsite = exports.prepareWebsite = exports.getSite = void 0;
const jsdom_1 = require("jsdom");
const CloudExplorer = require("cloud-explorer");
const express = require("express");
const nodeModules = require("node_modules-path");
const url_1 = require("url");
const Path = require("path");
const fs = require("fs");
const Zip = require("adm-zip");
const constants_1 = require("../../constants");
const BackwardCompat_1 = require("../utils/BackwardCompat");
const DomTools_1 = require("../utils/DomTools");
function default_1({ port, rootUrl }, unifile) {
    const backwardCompat = new BackwardCompat_1.default(rootUrl);
    const router = express.Router();
    // website specials
    router.get(/\/website\/ce\/(.*)\/get\/(.*)/, readWebsite(rootUrl, unifile, backwardCompat));
    router.get(/\/website\/libs\/templates\/(.*)/, readTemplate(rootUrl, unifile, backwardCompat));
    router.put(/\/website\/ce\/(.*)\/put\/(.*)/, writeWebsite(rootUrl, unifile, backwardCompat));
    // **
    // list templates
    router.use('/get/:folder', getTemplatesList);
    return router;
}
exports.default = default_1;
// function removeSelection(json: any): PersistantData {
//   return {
//     site: json.site,
//     elements: json.elements.map((el) => ({
//       ...el,
//       selected: false, // do not keep selection, this is also done when saving  @see WebsiteRouter
//     })),
//     pages: json.pages.map((p) => ({
//       ...p,
//       opened: false, // do not keep selection, this is also done when saving  @see WebsiteRouter
//     })),
//   }
// }
function isInTemplateFolder(path) {
    if (path.startsWith(Path.join(nodeModules('silex-templates'), 'silex-templates')) ||
        path.startsWith(Path.join(nodeModules('silex-blank-templates'), 'silex-blank-templates'))) {
        return true;
    }
    return false;
}
/**
 * list all the templates of the given folder
 */
function getTemplatesList(req, res, next) {
    const templateFolder = Path.join(nodeModules(req.params.folder), req.params.folder);
    if (!isInTemplateFolder(templateFolder)) {
        console.error('Error while trying to get the json representation of the folder ', templateFolder);
        res.send({ success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - folder does not exist' });
        return;
    }
    fs.readdir(templateFolder, (err, result) => {
        if (err) {
            console.error('Error while trying to get the json representation of the folder ', templateFolder, err);
            res.send({ success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - ' + err });
        }
        else {
            const templateList = result.filter((entry) => {
                const path = Path.join(templateFolder, entry);
                return !(/(^|\/)\.[^\/\.]/g).test(path) // hide hidden files
                    && fs.statSync(path).isDirectory(); // keep only directories
            });
            res.send(templateList);
        }
    });
}
/**
 * get the JSON and HTML data of the website to publish
 */
async function getSite(unifile, session, service, path) {
    if (path.endsWith(SILEX_ZIP_EXT)) {
        const fileBuffer = await unifile.readFile(unifile, service, path);
        const zip = new Zip(fileBuffer);
        const bufferHTML = zip.getEntry('editable.html').getData();
        const bufferJSON = zip.getEntry('editable.html.json').getData();
        return [bufferHTML, bufferJSON];
    }
    else {
        // download html file
        const bufferHTML = await unifile.readFile(session, service, path);
        let bufferJSON;
        try {
            // download json file
            bufferJSON = await unifile.readFile(session, service, path + '.json');
        }
        catch (err) {
            // handle the old sites without a JSON file
            const dom = new jsdom_1.JSDOM(bufferHTML.toString('utf-8'));
            const backwardCompat = new BackwardCompat_1.default(''); // FIXME: useless construct the whole BC object, hasDataFile should be static
            if (backwardCompat.hasDataFile(dom.window.document)) {
                // error loading website data file
                console.error('error loading website data file', err);
                // re-throw
                throw err;
            }
            else {
                // old websites
                return [bufferHTML, null];
            }
        }
        // return both
        return [bufferHTML, bufferJSON];
    }
}
exports.getSite = getSite;
/**
 * load a website from the cloud storage of the user
 */
function readWebsite(rootUrl, unifile, backwardCompat) {
    return async function (req, res, next) {
        const connector = req.params[0];
        const path = req.params[1];
        const url = new url_1.URL(`${rootUrl}/ce/${connector}/get/${Path.dirname(path)}/`);
        try {
            const [siteHtml, siteData] = await getSite(unifile, req.session.unifile, connector, path);
            return sendWebsiteData(res, rootUrl, backwardCompat, siteHtml, siteData, url, false);
        }
        catch (err) {
            console.error('Publication error, could not get website files:', err);
            CloudExplorer.handleError(res, err);
        }
    };
}
/**
 * load a website from a template folder on local disk
 */
function readTemplate(rootUrl, unifile, backwardCompat) {
    return function (req, res, next) {
        const path = req.params[0];
        const localPath = Path.resolve(nodeModules('silex-templates'), path);
        const url = new url_1.URL(`${rootUrl}/libs/templates/${Path.dirname(path)}/`);
        if (isInTemplateFolder(localPath)) {
            fs.readFile(localPath, (err1, htmlBuffer) => {
                if (err1) {
                    CloudExplorer.handleError(res, err1);
                }
                else {
                    fs.readFile(localPath + '.json', (err2, jsonBuffer) => {
                        if (err2) {
                            // old websites
                            sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, null, url, true);
                        }
                        else {
                            sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, jsonBuffer, url, true);
                            // CloudExplorer.handleError(res, err2)
                        }
                    });
                }
            });
        }
        else {
            CloudExplorer.handleError(res, { message: 'Not authorized.', code: 'EACCES' });
        }
    };
}
async function sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, jsonBuffer, url, isTemplate) {
    // remove user head tag to avoid bad markup messing with the website
    const { html } = DomTools_1.default.extractUserHeadTag(htmlBuffer.toString('utf-8'));
    const data = jsonBuffer ? JSON.parse(jsonBuffer.toString('utf-8')) : null; // may be null for older websites
    // from now on use a parsed DOM
    const dom = new jsdom_1.JSDOM(html, { url: url.href });
    if (dom.window.document.body.classList.contains(constants_1.Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME)) {
        console.error('Could not open this website for edition as it is a published Silex website');
        res.status(400).send({
            message: 'Could not open this website for edition as it is a published Silex website, <a href="https://github.com/silexlabs/Silex/wiki/FAQ#why-do-i-get-the-error-could-not-open-this-website-for-edition-as-it-is-a-published-silex-website" target="_blank">Read more about this error here</a>.',
        });
    }
    else {
        try {
            const [wanrningMsg, updatedData] = await backwardCompat.update(dom.window.document, data);
            if (isTemplate) {
                // remove publication path
                delete updatedData.site.publicationPath;
            }
            const preparedData = prepareWebsite(dom, rootUrl, updatedData, url);
            res.send({
                message: wanrningMsg,
                html: dom.serialize(),
                data: preparedData,
            });
            dom.window.close();
        }
        catch (err) {
            console.error('Could not send website data: ', err);
            res.status(400).send({
                message: err.message,
            });
        }
    }
}
const SILEX_ZIP_EXT = '.zip';
/**
 * save a website to the cloud storage of the user
 */
function writeWebsite(rootUrl, unifile, backwardCompat) {
    return function (req, res, next) {
        const connector = req.params[0];
        const path = req.params[1];
        const { data, html } = JSON.parse(req.body);
        const url = new url_1.URL(`${rootUrl}/ce/${connector}/get/${Path.dirname(path)}/`);
        const [unpreparedData, dom] = unprepareWebsite(new jsdom_1.JSDOM(html, { url: url.href }), data, rootUrl, url);
        const str = dom.serialize();
        const fullHtml = DomTools_1.default.insertUserHeadTag(str, unpreparedData.site.headUser);
        dom.window.close();
        if (path.endsWith(SILEX_ZIP_EXT)) {
            try {
                const zip = new Zip();
                zip.addFile('editable.html', Buffer.from(fullHtml));
                zip.addFile('editable.html.json', Buffer.from(JSON.stringify(unpreparedData)));
                unifile.writeFile(req.session.unifile || {}, connector, path, zip.toBuffer())
                    .catch((err) => {
                    console.error('unifile error catched:', err);
                    CloudExplorer.handleError(res, err);
                });
                res.send('Ok');
            }
            catch (err) {
                console.error('Zip file error:', err);
                CloudExplorer.handleError(res, err);
            }
        }
        else {
            unifile.batch(req.session.unifile || {}, connector, [{
                    name: 'writeFile',
                    path,
                    content: fullHtml,
                }, {
                    name: 'writeFile',
                    path: path + '.json',
                    content: JSON.stringify(unpreparedData),
                }])
                .then((result) => {
                res.send(result);
            })
                .catch((err) => {
                console.error('unifile error catched:', err);
                CloudExplorer.handleError(res, err);
            });
        }
    };
}
/**
 * prepare website for edit mode
 * make all URLs absolute (so that images are still found when I "save as" my website to another folder)
 * exported for tests
 */
function prepareWebsite(dom, rootUrl, data, baseUrl) {
    // URLs
    const transformedData = DomTools_1.default.transformPaths(dom.window, data, (path, el, isInHead) => {
        // page links
        if (path.startsWith(constants_1.Constants.PAGE_NAME_PREFIX))
            return path;
        // keep absolute paths because we do not want `/test` to become `http://localhost:6805/test`
        if (Path.isAbsolute(path))
            return path;
        // make relative URLs absolute
        const url = new url_1.URL(path, baseUrl);
        return url.href;
    });
    // update context classes
    Array.from(dom.window.document
        .querySelectorAll('.' + constants_1.Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME))
        .forEach((el) => el.classList.remove(constants_1.Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME));
    dom.window.document.body.classList.add(constants_1.Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME);
    deactivateScripts(dom);
    // add /css/editable.css
    const tag = dom.window.document.createElement('link');
    tag.rel = 'stylesheet';
    tag.href = rootUrl + '/css/editable.css';
    tag.classList.add(constants_1.Constants.SILEX_TEMP_TAGS_CSS_CLASS);
    dom.window.document.head.appendChild(tag);
    return transformedData;
}
exports.prepareWebsite = prepareWebsite;
/**
 * prepare website for being saved
 * * make all URLs relative to current path
 * * remove useless markup and css classes
 * @param rootUrl is the URL of Silex instance, e.g. `https://editor.silex.me/`
 * @param baseUrl is the URL of the folder containing the website HTML page, e.g. `https://editor.silex.me/ce/dropbox/get/tmp/`
 */
function unprepareWebsite(dom, data, rootUrl, baseUrl) {
    // markup
    dom.window.document.body.classList.add(constants_1.Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME);
    dom.window.document.body.classList.remove(constants_1.Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME);
    reactivateScripts(dom);
    restoreIFrames(dom);
    cleanupNoscripts(dom);
    // URLs
    const transformedData = DomTools_1.default.transformPaths(dom.window, data, (path, el) => {
        const url = new url_1.URL(path, baseUrl);
        if (url.href.startsWith(rootUrl)) {
            // path is on the same server
            // e.g an image url like '/ce/dropbox/get/assets/test.png'
            // make it relative
            return Path.relative(baseUrl.pathname, url.pathname);
        }
        return path;
    });
    const cleanedUp = {
        ...transformedData,
        pages: transformedData.pages.map((p) => ({
            ...p,
            opened: false,
        })),
        elements: transformedData.elements.map((el) => ({
            ...el,
            selected: false,
        })),
    };
    // remove temp tags
    Array.from(dom.window.document.querySelectorAll(`
    .${constants_1.Constants.SILEX_TEMP_TAGS_CSS_CLASS},
    #${constants_1.Constants.SILEX_CURRENT_PAGE_ID},
    .${constants_1.Constants.RISZE_HANDLE_CSS_CLASS}`))
        .forEach((el) => {
        el.remove();
    });
    // remove useless css classes
    constants_1.Constants.SILEX_TEMP_CLASS_NAMES.forEach((className) => {
        Array.from(dom.window.document.getElementsByClassName(className))
            .forEach((el) => el.classList.remove(className));
    });
    // cleanup inline styles
    dom.window.document.body.style.overflow = ''; // set by stage
    // cleanup for common bugs, FIXME: remove this
    dom.window.document.body.style.minWidth = ''; // not needed?
    dom.window.document.body.style.minHeight = ''; // not needed?
    return [cleanedUp, dom];
}
exports.unprepareWebsite = unprepareWebsite;
function deactivateScripts(dom) {
    Array.from(dom.window.document.getElementsByTagName('script'))
        .forEach((el) => {
        // do not execute scripts, unless they are silex's static scripts
        // and leave it alone if it has a type different from 'text/javascript'
        if (!el.hasAttribute(constants_1.Constants.STATIC_ASSET_ATTR)
            && !el.hasAttribute(constants_1.Constants.PRODOTYPE_DEPENDENCY_ATTR)
            && (!el.hasAttribute('type') || el.getAttribute('type') === 'text/javascript')) {
            el.setAttribute('type', 'text/notjavascript');
        }
    });
}
function restoreIFrames(dom) {
    Array.from(dom.window.document.querySelectorAll('[data-silex-iframe-src]'))
        .forEach((el) => {
        el.setAttribute('src', el.getAttribute('data-silex-iframe-src'));
        el.removeAttribute('data-silex-iframe-src');
    });
}
function cleanupNoscripts(dom) {
    Array.from(dom.window.document.querySelectorAll('noscript'))
        .forEach((el) => {
        el.innerHTML = decodeHTMLEntities(el.innerHTML);
    });
}
function decodeHTMLEntities(text) {
    const entities = [['amp', '&'], ['apos', '\''], ['#x27', '\''], ['#x2F', '/'], ['#39', '\''], ['#47', '/'], ['lt', '<'], ['gt', '>'], ['nbsp', ' '], ['quot', '"']];
    entities.forEach((entity) => text = text.replace(new RegExp('&' + entity[0] + ';', 'g'), entity[1]));
    return text;
}
function reactivateScripts(dom) {
    Array.from(dom.window.document.querySelectorAll('script[type="text/notjavascript"]'))
        .forEach((el) => el.setAttribute('type', 'text/javascript'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2Vic2l0ZVJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvcm91dGVyL1dlYnNpdGVSb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQTZCO0FBQzdCLGdEQUErQztBQUMvQyxtQ0FBa0M7QUFDbEMsaURBQWdEO0FBRWhELDZCQUF5QjtBQUN6Qiw2QkFBNEI7QUFDNUIseUJBQXdCO0FBQ3hCLCtCQUE4QjtBQUU5QiwrQ0FBMkM7QUFFM0MsNERBQW9EO0FBQ3BELGdEQUF3QztBQUV4QyxtQkFBd0IsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFvQyxFQUFFLE9BQU87SUFDbEYsTUFBTSxjQUFjLEdBQUcsSUFBSSx3QkFBYyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2xELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUUvQixtQkFBbUI7SUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFBO0lBQzNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQTtJQUM5RixNQUFNLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUE7SUFFNUYsS0FBSztJQUNMLGlCQUFpQjtJQUNqQixNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO0lBRTVDLE9BQU8sTUFBTSxDQUFBO0FBQ2YsQ0FBQztBQWRELDRCQWNDO0FBRUQsd0RBQXdEO0FBQ3hELGFBQWE7QUFDYix1QkFBdUI7QUFDdkIsNkNBQTZDO0FBQzdDLGVBQWU7QUFDZixxR0FBcUc7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