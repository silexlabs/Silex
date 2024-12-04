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
exports.FsStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = require("fs");
const connectors_1 = require("./connectors");
const path_1 = require("path");
const types_1 = require("../../types");
const os_1 = require("os");
const validation_1 = require("../utils/validation");
const constants_1 = require("../../constants");
const stream_1 = require("stream");
const uuid_1 = require("uuid");
// Variables needed for jest tests
if (!globalThis.__dirname) {
    // @ts-ignore
    globalThis.__dirname = (0, path_1.dirname)(process.cwd() + '/src/ts/server/connectors/FsStorage.ts');
    console.info('Redefining __dirname', globalThis.__dirname);
}
// Copy a folder recursively
async function copyDir(src, dest) {
    await promises_1.default.mkdir(dest, { recursive: true });
    const entries = await promises_1.default.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = (0, path_1.join)(src, entry.name);
        const destPath = (0, path_1.join)(dest, entry.name);
        entry.isDirectory() ?
            await copyDir(srcPath, destPath) :
            await promises_1.default.copyFile(srcPath, destPath);
    }
}
const USER_ICON = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'1em\' viewBox=\'0 0 448 512\'%3E%3Cpath d=\'M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z\'/%3E%3C/svg%3E';
const FILE_ICON = '/assets/laptop.png';
class FsStorage {
    connectorId = 'fs-storage';
    displayName = 'File system storage';
    icon = FILE_ICON;
    disableLogout = true;
    options;
    connectorType = types_1.ConnectorType.STORAGE;
    color = '#ffffff';
    background = '#006400';
    constructor(config, opts) {
        this.options = {
            path: (0, path_1.join)(__dirname, '..', '..', '..', '..', 'data'),
            assetsFolder: '/assets',
            ...opts,
        };
        this.initFs();
    }
    async initFs() {
        const stat = await promises_1.default.stat(this.options.path).catch(() => null);
        if (!stat) {
            // create data folder with a default website
            const id = constants_1.DEFAULT_WEBSITE_ID;
            await promises_1.default.mkdir((0, path_1.join)(this.options.path, id, this.options.assetsFolder), { recursive: true });
            await this.setWebsiteMeta({}, id, { name: 'Default website', connectorUserSettings: {} });
            await this.updateWebsite({}, id, types_1.defaultWebsiteData);
            console.info(`> [FsStorage] Created ${id} in ${this.options.path}`);
        }
    }
    // ********************
    // Job utils methods
    // ********************
    updateStatus(filesStatuses, status, statusCbk) {
        statusCbk && statusCbk({
            message: `<p>Writing files:<ul><li>${filesStatuses.map(({ file, message }) => `${file.path}: ${message}`).join('</li><li>')}</li></ul></p>`,
            status,
        });
    }
    initStatus(files) {
        return files.map(file => ({
            file,
            message: 'Waiting',
            status: types_1.JobStatus.IN_PROGRESS,
        }));
    }
    // ********************
    // Connector interface
    // ********************
    getOptions(formData) {
        return {};
    }
    async getOAuthUrl(session) { return null; }
    async getLoginForm(session, redirectTo) {
        return null;
    }
    async getSettingsForm(session, redirectTo) {
        return null;
    }
    async isLoggedIn(session) {
        return true;
    }
    async setToken(session, query) { }
    async logout(session) { }
    async getUser(session) {
        const { username, } = (0, os_1.userInfo)();
        return {
            name: username,
            picture: USER_ICON,
            storage: await (0, connectors_1.toConnectorData)(session, this),
        };
    }
    async setWebsiteMeta(session, id, data) {
        const websiteId = (0, validation_1.requiredParam)(id, 'website id');
        const content = JSON.stringify(data);
        const path = (0, path_1.join)(this.options.path, id, constants_1.WEBSITE_META_DATA_FILE);
        await promises_1.default.writeFile(path, content);
    }
    async getWebsiteMeta(session, id) {
        const websiteId = (0, validation_1.requiredParam)(id, 'website id');
        // Get stats for website folder
        const fileStat = await promises_1.default.stat((0, path_1.join)(this.options.path, websiteId));
        const path = (0, path_1.join)(this.options.path, websiteId, constants_1.WEBSITE_META_DATA_FILE);
        // Get meta file
        const content = await promises_1.default.readFile(path);
        const meta = await JSON.parse(content.toString());
        // Return all meta
        return {
            websiteId,
            name: meta.name,
            imageUrl: meta.imageUrl,
            connectorUserSettings: meta.connectorUserSettings,
            createdAt: fileStat.birthtime,
            updatedAt: fileStat.mtime,
        };
    }
    // ********************
    // Storage interface
    // ********************
    async createWebsite(session, meta) {
        const id = (0, uuid_1.v4)();
        await promises_1.default.mkdir((0, path_1.join)(this.options.path, id, this.options.assetsFolder), { recursive: true });
        await this.setWebsiteMeta(session, id, meta);
        await this.updateWebsite(session, id, types_1.defaultWebsiteData);
        return id;
    }
    async readWebsite(session, websiteId) {
        const id = (0, validation_1.requiredParam)(websiteId, 'website id');
        const path = (0, path_1.join)(this.options.path, id, constants_1.WEBSITE_DATA_FILE);
        const content = await promises_1.default.readFile(path);
        return JSON.parse(content.toString());
    }
    async updateWebsite(session, websiteId, data) {
        const id = (0, validation_1.requiredParam)(websiteId, 'website id');
        const path = (0, path_1.join)(this.options.path, id, constants_1.WEBSITE_DATA_FILE);
        await promises_1.default.writeFile(path, JSON.stringify(data));
    }
    async deleteWebsite(session, websiteId) {
        const id = (0, validation_1.requiredParam)(websiteId, 'website id');
        const path = (0, path_1.join)(this.options.path, id);
        return promises_1.default.rmdir(path, { recursive: true });
    }
    async duplicateWebsite(session, websiteId) {
        const newWebsiteId = (0, uuid_1.v4)();
        const from = (0, path_1.join)(this.options.path, websiteId);
        const to = (0, path_1.join)(this.options.path, newWebsiteId);
        await copyDir(from, to);
        const meta = await this.getWebsiteMeta(session, websiteId);
        await this.setWebsiteMeta(session, newWebsiteId, {
            ...meta,
            name: `${meta.name} copy`,
        });
    }
    async listWebsites(session) {
        const list = await promises_1.default.readdir(this.options.path);
        return Promise.all(list.map(async (fileName) => {
            const websiteId = fileName;
            return this.getWebsiteMeta(session, websiteId);
        }));
    }
    async getAsset(session, id, path) {
        const fullPath = (0, path_1.join)(this.options.path, id, this.options.assetsFolder, path);
        const content = await promises_1.default.readFile(fullPath);
        return { path, content };
    }
    async writeAssets(session, id, files, statusCbk) {
        return this.write(session, id, files, this.options.assetsFolder, statusCbk);
    }
    async write(session, id, files, assetsFolder, statusCbk) {
        const filesStatuses = this.initStatus(files);
        let error = null;
        for (const fileStatus of filesStatuses) {
            const { file } = fileStatus;
            const path = (0, path_1.join)(this.options.path, id, assetsFolder, file.path);
            if (typeof file.content === 'string' || Buffer.isBuffer(file.content)) {
                fileStatus.message = 'Writing';
                this.updateStatus(filesStatuses, types_1.JobStatus.IN_PROGRESS, statusCbk);
                try {
                    await promises_1.default.writeFile(path, file.content);
                }
                catch (err) {
                    fileStatus.message = `Error (${err})`;
                    this.updateStatus(filesStatuses, types_1.JobStatus.IN_PROGRESS, statusCbk);
                    error = err;
                    continue;
                }
                fileStatus.message = 'Success';
                this.updateStatus(filesStatuses, types_1.JobStatus.IN_PROGRESS, statusCbk);
            }
            else if (file.content instanceof stream_1.Readable) {
                fileStatus.message = 'Writing';
                this.updateStatus(filesStatuses, types_1.JobStatus.IN_PROGRESS, statusCbk);
                const writeStream = (0, fs_1.createWriteStream)(path);
                file.content.pipe(writeStream);
                await new Promise((resolve) => {
                    writeStream.on('finish', () => {
                        fileStatus.message = 'Success';
                        this.updateStatus(filesStatuses, types_1.JobStatus.IN_PROGRESS, statusCbk);
                        resolve(file);
                    });
                    writeStream.on('error', err => {
                        console.error('writeStream error', err);
                        fileStatus.message = `Error (${err})`;
                        this.updateStatus(filesStatuses, types_1.JobStatus.IN_PROGRESS, statusCbk);
                        error = err;
                        resolve(file);
                    });
                });
            }
            else {
                console.error('Invalid file content', typeof file.content);
                throw new Error('Invalid file content: ' + typeof file.content);
            }
        }
        this.updateStatus(filesStatuses, error ? types_1.JobStatus.ERROR : types_1.JobStatus.SUCCESS, statusCbk);
        if (error)
            throw error;
    }
    async deleteAssets(session, id, paths) {
        for (const path of paths) {
            await promises_1.default.unlink((0, path_1.join)(this.options.path, id, path));
        }
    }
    async readAsset(session, websiteId, fileName) {
        const id = (0, validation_1.requiredParam)(websiteId, 'website id');
        const path = (0, path_1.join)(this.options.path, id, this.options.assetsFolder, fileName);
        return await promises_1.default.readFile(path);
    }
}
exports.FsStorage = FsStorage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnNTdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9jb25uZWN0b3JzL0ZzU3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHOzs7Ozs7QUFFSCwyREFBNEI7QUFDNUIsMkJBQXNDO0FBQ3RDLDZDQUFzSTtBQUN0SSwrQkFBb0M7QUFDcEMsdUNBQXdLO0FBQ3hLLDJCQUE2QjtBQUM3QixvREFBbUQ7QUFFbkQsK0NBQStGO0FBQy9GLG1DQUFpQztBQUNqQywrQkFBaUM7QUFHakMsa0NBQWtDO0FBQ2xDLElBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDekIsYUFBYTtJQUNiLFVBQVUsQ0FBQyxTQUFTLEdBQUcsSUFBQSxjQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLHdDQUF3QyxDQUFDLENBQUE7SUFDeEYsT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDNUQsQ0FBQztBQUVELDRCQUE0QjtBQUM1QixLQUFLLFVBQVUsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJO0lBQzlCLE1BQU0sa0JBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDekMsTUFBTSxPQUFPLEdBQUcsTUFBTSxrQkFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUU5RCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQzVCLE1BQU0sT0FBTyxHQUFHLElBQUEsV0FBSSxFQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckMsTUFBTSxRQUFRLEdBQUcsSUFBQSxXQUFJLEVBQUMsSUFBSSxFQUFFLEtB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