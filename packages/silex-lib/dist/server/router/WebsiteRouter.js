"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectPath = void 0;
const cheerio_1 = require("cheerio");
const cssurl_1 = require("cssurl");
const express_1 = require("express");
const formidable_1 = require("formidable");
const path_1 = require("path");
const os_1 = require("os");
const promises_1 = require("node:fs/promises");
const utils_1 = require("../../utils");
const types_1 = require("../../types");
const FS_ROOT = process.env.FS_ROOT || (0, path_1.join)((0, os_1.homedir)(), '.silex');
const PROJECT_FILE_NAME = '/.silex.data.json';
function projectPath(projectId) {
    return (0, path_1.join)(FS_ROOT, projectId);
}
exports.projectPath = projectPath;
function WebsiteRouter() {
    const router = (0, express_1.Router)();
    router.get('/website', readWebsite);
    router.post('/website', writeWebsite);
    router.get(/\/assets\/(.*)/, readAsset);
    router.post('/assets', writeAsset);
    mkdirIfExists(FS_ROOT);
    return router;
}
exports.default = WebsiteRouter;
async function mkdirIfExists(path, options = null) {
    try {
        return await (0, promises_1.mkdir)(path, options);
    }
    catch (err) {
        if (err.code === 'EEXIST') {
            return;
        }
        else {
            throw err;
        }
    }
}
async function readWebsite(req, res) {
    try {
        const data = await (0, promises_1.readFile)(projectPath(req.query.projectId) + PROJECT_FILE_NAME);
        res
            .type('application/json')
            .send(data);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            res.json({});
        }
        else {
            console.error('Read file error', err);
            res.status(400).json({ message: 'Read file error: ' + err.message, code: err.code });
        }
    }
}
const SETTINGS_FILE_NAME = '/.silex.json';
async function getSettings(projectId) {
    try {
        const settingsBuffer = await (0, promises_1.readFile)(projectPath(projectId) + SETTINGS_FILE_NAME);
        return {
            ...types_1.defaultSettings,
            ...JSON.parse(settingsBuffer.toString()),
        };
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return types_1.defaultSettings;
        }
        else {
            throw err;
        }
    }
}
function fromBody(body) {
    try {
        return [{
                assets: body.assets,
                pages: body.pages,
                files: body.files,
                styles: body.styles,
                settings: body.settings,
                name: body.name,
                fonts: body.fonts,
                symbols: body.symbols,
            }, null];
    }
    catch (err) {
        console.error('Could not parse body data', body, err);
        return [null, err];
    }
}
async function writeWebsite(req, res) {
    const projectId = req.query.projectId;
    const [data, err] = fromBody(req.body);
    if (err) {
        res.status(400).json({ message: 'Error writing data file, could not parse the provided body: ' + err.message, code: err.code });
        return;
    }
    try {
        await (0, promises_1.writeFile)(projectPath(projectId) + PROJECT_FILE_NAME, JSON.stringify(data));
    }
    catch (err) {
        console.error('Error writing data file', err);
        res.status(500).json({ message: 'Error writing data file: ' + err.message, code: err.code });
        return;
    }
    const settings = await getSettings(projectId);
    const projectFolder = projectPath(projectId);
    const htmlFolder = (0, path_1.join)(projectFolder, settings.html.path);
    const cssFolder = (0, path_1.join)(projectFolder, settings.css.path);
    try {
        await mkdirIfExists(htmlFolder, { recursive: true, });
        await mkdirIfExists(cssFolder, { recursive: true, });
    }
    catch (err) {
        console.error('Error: could not create folder ', cssFolder, err);
        res.status(400).json({ message: 'Error: could not create folder: ' + err.message, code: err.code });
        return;
    }
    data.pages
        .forEach(async (page, idx) => {
        function getSetting(name) {
            if (page.settings && page.settings[name])
                return page.settings[name];
            return data.settings[name];
        }
        const pageName = page.type === 'main' ? 'index' : page.name;
        let html;
        try {
            const $ = (0, cheerio_1.load)(data.files[idx].html);
            $('head').append(`<link rel="stylesheet" href="${settings.prefix}${settings.css.path}/${(0, utils_1.getPageSlug)(pageName)}.css" />`);
            $('head').append(getSetting('head'));
            if (!$('head > title').length)
                $('head').append('<title/>');
            $('head > title').html(getSetting('title'));
            if (!$('head > link[rel="icon"]').length)
                $('head').append('<link rel="icon" />');
            $('link[rel="icon"]').attr('href', getSetting('favicon'));
            ['description', 'og:title', 'og:description', 'og:image'].forEach(prop => {
                const sel = `meta[property="${prop}"]`;
                if (!$(sel).length)
                    $('head').append(`<meta property="${prop}" />`);
                $(sel).attr('content', getSetting(prop));
            });
            $('html').attr('lang', getSetting('lang'));
            html = $.html();
        }
        catch (err) {
            console.error('Error processing HTML', page, err);
            res.status(400).json({ message: 'Error processing HTML: ' + err.message, code: err.code });
            return;
        }
        let css = data.files[idx].css;
        try {
            if (cssFolder != projectFolder) {
                const rewriter = new cssurl_1.URLRewriter(function (url) {
                    const translator = new cssurl_1.URLTranslator();
                    return translator.translate(url, projectFolder, cssFolder);
                });
                css = rewriter.rewrite(css);
            }
        }
        catch (err) {
            console.error('Error processing CSS', page, err);
            res.status(400).json({ message: 'Error processing CSS: ' + err.message, code: err.code });
            return;
        }
        try {
            await (0, promises_1.writeFile)((0, path_1.join)(htmlFolder, (0, utils_1.getPageSlug)(pageName) + '.html'), html);
            await (0, promises_1.writeFile)((0, path_1.join)(cssFolder, (0, utils_1.getPageSlug)(pageName) + '.css'), css);
        }
        catch (err) {
            console.error('Error writing file', page, err);
            res.status(400).json({ message: 'Error writing file: ' + err.message, code: err.code });
            return;
        }
    });
    res.json({
        message: 'OK',
    });
}
async function readAsset(req, res) {
    const projectId = req.query.projectId;
    const settings = await getSettings(projectId);
    const uploadDir = (0, path_1.join)(projectPath(projectId), settings.assets.path);
    const fileName = req.params[0];
    res.sendFile((0, path_1.join)(uploadDir, fileName));
}
async function writeAsset(req, res) {
    const projectId = req.query.projectId;
    const settings = await getSettings(projectId);
    const uploadDir = (0, path_1.join)(projectPath(projectId), settings.assets.path);
    await mkdirIfExists(uploadDir, { recursive: true, });
    const form = (0, formidable_1.default)({
        uploadDir,
        filename: (name, ext, part, _form) => `${name}${ext}`,
        multiples: true,
        keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error parsing upload data', err);
            res
                .status(400)
                .json({ message: 'Error parsing upload data: ' + err.message, code: err.code });
            return;
        }
        const data = [].concat(files['files[]'])
            .map(file => {
            const { originalFilename, filepath } = file;
            return `${settings.prefix}${settings.assets.path}/${originalFilename}?projectId=${projectId}`;
        });
        res.json({ data });
    });
}
