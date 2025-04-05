"use strict";
/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
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
/**
 * @fileoverview Website plugin for Silex
 * This plugin provides the website API to Silex server
 */
function default_1(config, opts = {}) {
    // Options with defaults
    const options = {
        // Default constants
        assetsPath: '/assets',
        // Options
        ...opts
    };
    // Create a new router
    const router = (0, express_1.Router)();
    // Load website data
    router.get(constants_1.API_WEBSITE_READ, async (req, res, next) => {
        const query = req.query;
        const { websiteId, connectorId } = query;
        const session = req['session'];
        if (!websiteId) {
            // List websites
            next();
            return;
        }
        try {
            // Get website data
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
    // List websites
    router.get(constants_1.API_WEBSITE_LIST, async (req, res) => {
        const query = req.query;
        const { connectorId } = query;
        const session = req['session'];
        try {
            // List websites
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
    // Save website data
    router.post(constants_1.API_WEBSITE_WRITE, async (req, res) => {
        try {
            // Check input
            const query = req.query;
            const body = req.body;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            const websiteData = (0, validation_1.requiredParam)(body, 'Website data');
            const connectorId = query.connectorId; // Optional
            // Hook to modify the website data before saving
            config.emit(events_1.ServerEvent.WEBSITE_STORE_START, { websiteId, websiteData, connectorId });
            // Save website data
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
    // Create website or update website meta
    router.put(constants_1.API_WEBSITE_CREATE, async (req, res) => {
        try {
            // Check input
            const session = req['session'];
            const query = req.query;
            const body = req.body;
            const websiteMeta = (0, validation_1.requiredParam)(body, 'Website meta');
            const connectorId = query.connectorId;
            const connector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId);
            if (!connector) {
                throw new types_1.ApiError(`Connector ${connectorId} not found`, 500);
            }
            // Create website
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
    // Update website meta
    router.post(constants_1.API_WEBSITE_META_WRITE, async (req, res) => {
        try {
            // Check input
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
            // Update website meta
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
    // Get website meta
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
    // Delete website
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
    // Duplicate website
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
    // Load assets
    router.get(constants_1.API_WEBSITE_ASSET_READ + '/:path', async (req, res) => {
        {
            try {
                const query = req.query;
                const params = req.params;
                const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
                const path = (0, validation_1.requiredParam)(params.path, 'path');
                const asset = await readAsset(req['session'], websiteId, path, query.connectorId);
                // Set content type
                res.contentType((0, path_1.basename)(path));
                // Send the file
                if (asset instanceof stream_1.Readable) {
                    // Stream
                    asset.pipe(res);
                }
                else {
                    // Buffer or string
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
    // Upload assets
    router.post(constants_1.API_WEBSITE_ASSETS_WRITE, async (req, res) => {
        try {
            // Check input
            const query = req.query;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'Website id');
            // Get the file data from the request
            const form = (0, formidable_1.default)({
                multiples: true,
                keepExtensions: true,
            });
            const connectorId = query.connectorId; // Optional
            // Retrive the files
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
            // Hook to modify the files
            config.emit(events_1.ServerEvent.WEBSITE_ASSET_STORE_START, { files, websiteId, connectorId });
            // Write the files
            const result = await writeAssets(req['session'], websiteId, files, connectorId);
            // Base URL of silex serve
            const baseUrl = new URL(config.url).pathname.replace(/\/$/, '');
            // Return the file URLs to insert in the website
            // As expected by grapesjs (https://grapesjs.com/docs/modules/Assets.html#uploading-assets)
            const data = result.map(path => (0, path_1.join)(
            // We should return path without this line, as it is saved, not as it is displayed
            // But this url is sent straight to grapesjs, so we need to return the url as it is displayed
            baseUrl, constants_1.API_PATH, constants_1.API_WEBSITE_PATH, constants_1.API_WEBSITE_ASSET_READ, path)
                + `?websiteId=${websiteId}&connectorId=${connectorId ? connectorId : ''}` // As expected by wesite API (readAsset)
            );
            // Return the file URLs
            res.json({
                data,
            });
            // Hook for plugins
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
            // Hook for plugins
            config.emit(events_1.ServerEvent.WEBSITE_ASSET_STORE_END, e);
        }
    });
    /**
     * Get the desired connector
     * Can be the default connector or a specific one
     */
    async function getStorageConnector(session, connectorId) {
        const storageConnector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId); //  ?? config.getStorageConnectors()[0]
        if (!storageConnector) {
            throw new types_1.ApiError('No storage connector found', 404);
        }
        if (!await storageConnector.isLoggedIn(session)) {
            throw new types_1.ApiError('Not logged in', 401);
        }
        return storageConnector;
    }
    /**
     * Read the website data
     */
    async function readWebsite(session, websiteId, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // Return website data
        return storageConnector.readWebsite(session, websiteId);
    }
    /**
     * List existing websites
     */
    async function listWebsites(session, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // List websites
        return storageConnector.listWebsites(session);
    }
    /**
     * Write the website data to the connector
     */
    async function writeWebsite(session, websiteId, websiteData, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // Write the website data
        await storageConnector.updateWebsite(session, websiteId, websiteData);
    }
    /**
     * Delete a website
     */
    async function deleteWebsite(session, websiteId, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // Delete the website
        return storageConnector.deleteWebsite(session, websiteId);
    }
    /**
     * Duplicate a website
     */
    async function duplicateWebsite(session, websiteId, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // Duplicate the website
        return storageConnector.duplicateWebsite(session, websiteId);
    }
    /**
     * Read an asset
     */
    async function readAsset(session, websiteId, fileName, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // Read the asset from the connector
        return storageConnector.readAsset(session, websiteId, `/${fileName}`);
    }
    /**
     * Write an asset to the connector
     * @returns File names on the storage connector, always starting with a slash
     */
    async function writeAssets(session, websiteId, files, connectorId) {
        // Get the desired connector
        const storageConnector = await getStorageConnector(session, connectorId);
        // Clean up the path
        const cleanPathFiles = files.map(file => ({
            ...file,
            path: file.path.replace('/assets/', '/'), // Remove the assets folder added by GrapesJS
        }));
        // Write the asset to the connector
        const result = await storageConnector.writeAssets(session, websiteId, cleanPathFiles);
        // Return the files URLs with the website id
        return files
            // Use the original path or the one returned by the connector
            .map(({ path }, idx) => result && result[idx] ? result[idx] : path);
        // Make it an absolute path with the website id and the connector id as query params
        //.map((path) => toAssetUrl(path, config.url, websiteId, connectorId))
    }
    return router;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic2l0ZUFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvYXBpL3dlYnNpdGVBcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7Ozs7QUFvQkgsNEJBMGFDO0FBNWJELHFDQUFnQztBQUNoQyw0REFBbUM7QUFFbkMsK0NBQW1SO0FBQ25SLDJCQUFxQztBQUNyQyx1Q0FBZ3BCO0FBQ2hwQix5REFBZ0k7QUFDaEksbUNBQWlDO0FBQ2pDLG9EQUFtRDtBQUNuRCwrQkFBcUM7QUFFckMsc0NBQTZKO0FBRTdKOzs7R0FHRztBQUVILG1CQUF5QixNQUFvQixFQUFFLElBQUksR0FBRyxFQUFFO0lBQ3RELHdCQUF3QjtJQUN4QixNQUFNLE9BQU8sR0FBRztRQUNkLG9CQUFvQjtRQUNwQixVQUFVLEVBQUUsU0FBUztRQUNyQixVQUFVO1FBQ1YsR0FBRyxJQUFJO0tBQ1IsQ0FBQTtJQUVELHNCQUFzQjtJQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFNLEdBQUUsQ0FBQTtJQUV2QixvQkFBb0I7SUFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0QkFBZ0IsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUNwRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBNEIsQ0FBQTtRQUM5QyxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQTtRQUN4QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFxQixDQUFBO1FBQ2xELElBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNkLGdCQUFnQjtZQUNoQixJQUFJLEVBQUUsQ0FBQTtZQUNOLE9BQU07UUFDUixDQUFDO1FBQ0QsSUFBSSxDQUFDO1lBQ0gsbUJBQW1CO1lBQ25CLE1BQU0sV0FBVyxHQUEyQixNQUFNLFdBQVcsQ0FDM0Qs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