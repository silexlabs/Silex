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
//# sourceMappingURL=FsStorage.js.map