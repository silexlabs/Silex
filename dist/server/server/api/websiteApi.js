"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const formidable_1 = __importDefault(require("formidable"));
const constants_1 = require("../../constants");
const fs_1 = require("fs");
const types_1 = require("../../types");
const connectors_1 = require("../connectors/connectors");
const stream_1 = require("stream");
const validation_1 = require("../utils/validation");
const path_1 = require("path");
const events_1 = require("../events");
function default_1(config, opts = {}) {
    const options = {
        assetsPath: '/assets',
        ...opts
    };
    const router = (0, express_1.Router)();
    router.get(constants_1.API_WEBSITE_READ, async (req, res, next) => {
        const query = req.query;
        const { websiteId, connectorId } = query;
        const session = req['session'];
        if (!websiteId) {
            next();
            return;
        }
        try {
            const websiteData = await readWebsite(session, websiteId, connectorId);
            if (websiteData instanceof stream_1.Readable) {
                websiteData.pipe(res.type('application/json'));
            }
            else {
                res.json(websiteData);
            }
        }
        catch (e) {
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.get(constants_1.API_WEBSITE_LIST, async (req, res) => {
        const query = req.query;
        const { connectorId } = query;
        const session = req['session'];
        try {
            const websites = await listWebsites(req['session'], query.connectorId);
            res.json(websites);
        }
        catch (e) {
            console.error('Error getting website data', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.post(constants_1.API_WEBSITE_WRITE, async (req, res) => {
        try {
            const query = req.query;
            const body = req.body;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            const websiteData = (0, validation_1.requiredParam)(body, 'Website data');
            const connectorId = query.connectorId;
            config.emit(events_1.ServerEvent.WEBSITE_STORE_START, { websiteId, websiteData, connectorId });
            await writeWebsite(req['session'], websiteId, websiteData, connectorId);
            config.emit(events_1.ServerEvent.WEBSITE_STORE_END, null);
            res.status(200).json({ message: 'Website saved' });
        }
        catch (e) {
            console.error('Error saving website data', e);
            config.emit(events_1.ServerEvent.WEBSITE_STORE_END, e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.put(constants_1.API_WEBSITE_CREATE, async (req, res) => {
        try {
            const session = req['session'];
            const query = req.query;
            const body = req.body;
            const websiteMeta = (0, validation_1.requiredParam)(body, 'Website meta');
            const connectorId = query.connectorId;
            const connector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId);
            if (!connector) {
                throw new types_1.ApiError(`Connector ${connectorId} not found`, 500);
            }
            await connector.createWebsite(session, websiteMeta);
            res.json({ message: 'Website meta saved' });
        }
        catch (e) {
            console.error('Error saving website meta', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.post(constants_1.API_WEBSITE_META_WRITE, async (req, res) => {
        try {
            const session = req['session'];
            const query = req.query;
            const body = req.body;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            const websiteMeta = (0, validation_1.requiredParam)(body, 'Website meta');
            const connectorId = query.connectorId;
            const connector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId);
            if (!connector) {
                throw new types_1.ApiError(`Connector ${connectorId} not found`, 500);
            }
            await connector.setWebsiteMeta(session, websiteId, websiteMeta);
            res.json({ message: 'Website meta saved' });
        }
        catch (e) {
            console.error('Error saving website meta', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.get(constants_1.API_WEBSITE_META_READ, async (req, res) => {
        try {
            const session = req['session'];
            const query = req.query;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            const connectorId = query.connectorId;
            const connector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId);
            if (!connector) {
                throw new types_1.ApiError(`Connector ${connectorId} not found`, 500);
            }
            const websiteMeta = await connector.getWebsiteMeta(session, websiteId);
            res.json(websiteMeta);
        }
        catch (e) {
            console.error('Error getting website meta', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.delete(constants_1.API_WEBSITE_DELETE, async (req, res) => {
        try {
            const query = req.query;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            await deleteWebsite(req['session'], websiteId, query.connectorId);
            res.status(200).json({ message: 'Website deleted' });
        }
        catch (e) {
            console.error('Error deleting website data', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.post(constants_1.API_WEBSITE_DUPLICATE, async (req, res) => {
        try {
            const query = req.query;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'New website id');
            await duplicateWebsite(req['session'], websiteId, query.connectorId);
            res.status(200).json({ message: 'Website duplicated' });
        }
        catch (e) {
            console.error('Error duplicating website data', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
        }
    });
    router.get(constants_1.API_WEBSITE_ASSET_READ + '/:path', async (req, res) => {
        {
            try {
                const query = req.query;
                const params = req.params;
                const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
                const path = (0, validation_1.requiredParam)(params.path, 'path');
                const asset = await readAsset(req['session'], websiteId, path, query.connectorId);
                res.contentType((0, path_1.basename)(path));
                if (asset instanceof stream_1.Readable) {
                    asset.pipe(res);
                }
                else {
                    res.send(asset);
                }
            }
            catch (e) {
                console.error('Error getting asset', e);
                if (e.httpStatusCode) {
                    res.status(e.httpStatusCode).json({ message: e.message });
                }
                else {
                    res.status(500).json({ message: e.message });
                }
            }
        }
    });
    router.post(constants_1.API_WEBSITE_ASSETS_WRITE, async (req, res) => {
        try {
            const query = req.query;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            const form = (0, formidable_1.default)({
                multiples: true,
                keepExtensions: true,
            });
            const connectorId = query.connectorId;
            const files = await new Promise((resolve, reject) => {
                form.parse(req, async (err, fields, _files) => {
                    if (err) {
                        console.error('Error parsing upload data', err);
                        reject(new types_1.ApiError('Error parsing upload data: ' + err.message, 400));
                    }
                    else {
                        const files = [].concat(_files['files[]'])
                            .map(file => file.toJSON())
                            .map(file => ({
                            path: `/${file.originalFilename}`,
                            content: (0, fs_1.createReadStream)(file.filepath),
                        }));
                        resolve(files);
                    }
                });
            });
            config.emit(events_1.ServerEvent.WEBSITE_ASSET_STORE_START, { files, websiteId, connectorId });
            const result = await writeAssets(req['session'], websiteId, files, connectorId);
            const baseUrl = new URL(config.url).pathname.replace(/\/$/, '');
            const data = result.map(path => (0, path_1.join)(baseUrl, constants_1.API_PATH, constants_1.API_WEBSITE_PATH, constants_1.API_WEBSITE_ASSET_READ, path)
                + `?websiteId=${websiteId}&connectorId=${connectorId ? connectorId : ''}`);
            res.json({
                data,
            });
            config.emit(events_1.ServerEvent.WEBSITE_ASSET_STORE_END, null);
        }
        catch (e) {
            console.error('Error uploading assets', e);
            if (e.httpStatusCode) {
                res.status(e.httpStatusCode).json({ message: e.message });
            }
            else {
                res.status(500).json({ message: e.message });
            }
            config.emit(events_1.ServerEvent.WEBSITE_ASSET_STORE_END, e);
        }
    });
    async function getStorageConnector(session, connectorId) {
        const storageConnector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId);
        if (!storageConnector) {
            throw new types_1.ApiError('No storage connector found', 404);
        }
        if (!await storageConnector.isLoggedIn(session)) {
            throw new types_1.ApiError('Not logged in', 401);
        }
        return storageConnector;
    }
    async function readWebsite(session, websiteId, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        return storageConnector.readWebsite(session, websiteId);
    }
    async function listWebsites(session, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        return storageConnector.listWebsites(session);
    }
    async function writeWebsite(session, websiteId, websiteData, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        await storageConnector.updateWebsite(session, websiteId, websiteData);
    }
    async function deleteWebsite(session, websiteId, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        return storageConnector.deleteWebsite(session, websiteId);
    }
    async function duplicateWebsite(session, websiteId, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        return storageConnector.duplicateWebsite(session, websiteId);
    }
    async function readAsset(session, websiteId, fileName, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        return storageConnector.readAsset(session, websiteId, `/${fileName}`);
    }
    async function writeAssets(session, websiteId, files, connectorId) {
        const storageConnector = await getStorageConnector(session, connectorId);
        const cleanPathFiles = files.map(file => ({
            ...file,
            path: file.path.replace('/assets/', '/'),
        }));
        const result = await storageConnector.writeAssets(session, websiteId, cleanPathFiles);
        return files
            .map(({ path }, idx) => result && result[idx] ? result[idx] : path);
    }
    return router;
}
