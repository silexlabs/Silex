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
Object.defineProperty(exports, "__esModule", { value: true });
const basic_ftp_1 = require("basic-ftp");
const connectors_1 = require("../../server/connectors/connectors");
const validation_1 = require("../../server/utils/validation");
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const path_1 = require("path");
const os_1 = require("os");
const uuid_1 = require("uuid");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
// **
// Utils methos
function formHtml(redirectTo, type, { host, user, pass, port, secure, storageRootPath, publicationPath, websiteUrl }, err = '') {
    return `
    ${err && `<div class="error">${err || ''}</div>`}
    <form method="POST" action="${redirectTo}">
      <label for="host">Host</label>
      <input placeholder="ftp.example.com" type="text" name="host" value="${host || ''}" />
      <label for="user">User</label>
      <input placeholder="user" type="text" name="user" value="${user || ''}" />
      <label for="pass">Pass</label>
      <input placeholder="****" type="password" name="pass" value="${pass || ''}" />
      <label for="port">Port</label>
      <input placeholder="21" type="number" name="port" value="${port || '21'}" />
      <div class="checkbox-container">
        <input class="checkbox" type="checkbox" name="secure" value="true" ${secure ? 'checked' : ''} />
        <label for="secure">Secure</label>
      </div>
      ${type === types_1.ConnectorType.STORAGE ? `
      <details>
        <summary>Storage options</summary>
        <p>If you are not sure, don't change this</p>
        <label for="storageRootPath">Root path where to store the website files</label>
        <input placeholder="/silex/" type="text" name="storageRootPath" value="${storageRootPath || '/silex/'}" />
      </details>
      ` : ''}
      ${type === types_1.ConnectorType.HOSTING ? `
      <fieldset>
        <legend>Publication options</legend>
        <label for="publicationPath">Path where to publish</label>
        <input placeholder="/public_html/" type="text" name="publicationPath" value="${publicationPath || ''}" />
        <label for="websiteUrl">URL where to the site will be accessible</label>
        <input placeholder="https://mysite.com/" type="text" name="websiteUrl" value="${websiteUrl || ''}" />
      </fieldset>
      ` : ''}
      <div class="button-container">
        <button type="submit" class="primary-button">Login</button>
        <button type="button" class="secondary-button">Cancel</button>
      </div>
    </form>
  `;
}
const formCss = `
/* Reset default form styles */
form {
  margin: 0;
  padding: 0;
}

/* Center the form */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

/* Style form container */
form {
  width: 400px;
  padding: 20px;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Style form labels */
label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

/* Style form inputs */
input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
input.checkbox {
  width: 20px;
  height: 20px;
}
fieldset {
  padding: 20px;
}

/* Style form buttons */
.button-container {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.primary-button,
.secondary-button {
  width: 48%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.primary-button {
  background-color: #4caf50;
  color: white;
}

.secondary-button {
  background-color: #e0e0e0;
  color: #333;
}

.primary-button:hover,
.secondary-button:hover {
  background-color: #388e3c;
}

/* Style form checkbox */
.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  margin: 20px 0;
}

.checkbox-container label {
  margin-left: 5px;
  color: #333;
}

/* Style details and summary elements */
details {
  margin-top: 20px;
  color: #333;
}

summary {
  font-weight: bold;
  cursor: pointer;
}

details > p {
  margin-top: 10px;
}
`;
/**
 * @class FtpConnector
 * @implements {HostingConnector}
 * @implements {StorageConnector}
 */
class FtpConnector {
    connectorId = 'ftp';
    displayName = 'Ftp';
    icon = '/assets/ftp.png';
    options;
    connectorType;
    color = '#ffffff';
    background = '#0066CC';
    constructor(config, opts) {
        this.options = {
            path: '',
            assetsFolder: 'assets',
            cssFolder: 'css',
            authorizeUrl: './api/authorize/ftp/',
            authorizePath: './api/authorize/ftp/',
            ...opts,
        };
        if (!this.options.type)
            throw new Error('missing type in option of FtpConnector');
        this.connectorType = (0, connectors_1.toConnectorEnum)(this.options.type);
    }
    // **
    // Utils
    sessionData(session) {
        return session[`ftp-${this.options.type}`] ?? {};
    }
    rootPath(session) {
        return this.connectorType === types_1.ConnectorType.STORAGE ?
            (0, validation_1.requiredParam)(this.sessionData(session).storageRootPath, 'storage root path') :
            (0, validation_1.requiredParam)(this.sessionData(session).publicationPath, 'publication path');
    }
    // **
    // FTP methods
    async write(ftp, path, content, progress) {
        ftp.trackProgress(info => {
            progress && progress(`Uploading ${info.bytes / 1000} KB}`);
        });
        progress && progress('Upload started');
        await ftp.uploadFrom((0, connectors_1.contentToReadable)(content), path);
        progress && progress('Upload complete');
    }
    async read(ftp, path) {
        const tempDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), 'silex-tmp'));
        const tempPath = (0, path_1.join)(tempDir, 'silex-ftp.tmp');
        await ftp.downloadTo(tempPath, path);
        const rStream = (0, fs_1.createReadStream)(tempPath);
        await (0, promises_1.rm)(tempPath);
        await (0, promises_1.rmdir)(tempDir);
        return rStream;
    }
    async readdir(ftp, path) {
        const list = await ftp.list(path);
        return list.map((file) => ({
            name: file.name,
            isDir: file.isDirectory,
            size: file.size,
            createdAt: file.modifiedAt,
            updatedAt: file.modifiedAt,
            metaData: file,
        }));
    }
    async mkdir(ftp, path) {
        return ftp.ensureDir(path);
    }
    async rmdir(ftp, path) {
        return ftp.removeDir(path);
    }
    async unlink(ftp, path) {
        return ftp.remove(path);
    }
    async getClient({ host, user, pass, port, secure }) {
        const ftp = new basic_ftp_1.Client();
        await ftp.access({
            host,
            port,
            user,
            password: pass,
            secure,
        });
        return ftp;
    }
    closeClient(ftp) {
        if (ftp && !ftp.closed) {
            ftp.close();
        }
        else {
            console.warn('ftp already closed');
        }
    }
    // **
    // Connector interface
    getOptions(formData) {
        return {
            // Storage
            storageRootPath: formData['storageRootPath'],
            // Hosting
            publicationPath: formData['publicationPath'],
            websiteUrl: formData['websiteUrl'],
        };
    }
    async getOAuthUrl(session) { return null; }
    async getLoginForm(session, redirectTo) {
        const { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl } = this.sessionData(session);
        return `
        <style>
          ${formCss}
        </style>
        ${formHtml(redirectTo, this.connectorType, { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl })}
      `;
    }
    async getSettingsForm(session, redirectTo) { return null; }
    async setToken(session, token) {
        // Check all required params are present
        const { host, user, pass, port, secure = false, publicationPath, storageRootPath, websiteUrl } = token;
        (0, validation_1.requiredParam)(session, 'session');
        (0, validation_1.requiredParam)(host, 'host');
        (0, validation_1.requiredParam)(user, 'user');
        (0, validation_1.requiredParam)(pass, 'pass');
        (0, validation_1.requiredParam)(port, 'port');
        // Check if the connection is valid
        const ftp = await this.getClient({ host, user, pass, port, secure });
        // Save the token
        session[`ftp-${this.connectorType}`] = { host, user, pass, port, secure, publicationPath, storageRootPath, websiteUrl };
        // Clean up
        this.closeClient(ftp);
    }
    async logout(session) {
        delete session[`ftp-${this.options.type}`];
    }
    async getUser(session) {
        return {
            name: this.sessionData(session).user,
            picture: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'1em\' viewBox=\'0 0 448 512\'%3E%3C!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --%3E%3Cpath d=\'M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z\'/%3E%3C/svg%3E',
            storage: await (0, connectors_1.toConnectorData)(session, this)
        };
    }
    async isLoggedIn(session) {
        try {
            if (!session[`ftp-${this.options.type}`]) {
                return false;
            }
            const ftp = await this.getClient(this.sessionData(session));
            this.closeClient(ftp);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    async setWebsiteMeta(session, id, data) {
        const websiteId = (0, validation_1.requiredParam)(id, 'website id');
        const path = (0, path_1.join)(this.rootPath(session), websiteId, constants_1.WEBSITE_META_DATA_FILE);
        const ftp = await this.getClient(this.sessionData(session));
        await this.write(ftp, path, JSON.stringify(data));
        this.closeClient(ftp);
    }
    async getWebsiteMeta(session, id) {
        try {
            const websiteId = (0, validation_1.requiredParam)(id, 'website id');
            const ftp = await this.getClient(this.sessionData(session));
            // Get stats for the website folder
            const folder = (0, path_1.join)(this.rootPath(session), websiteId);
            const path = (0, path_1.join)(this.rootPath(session), websiteId, constants_1.WEBSITE_META_DATA_FILE);
            const readable = await this.read(ftp, path);
            const meta = JSON.parse(await (0, connectors_1.contentToString)(readable));
            this.closeClient(ftp);
            // Return all meta
            return {
                websiteId,
                ...meta,
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // **
    // Storage interface
    /**
     * Create necessary folders
     * Assets and root folders
     */
    async createWebsite(session) {
        const ftp = await this.getClient(this.sessionData(session));
        // Generate a random id
        const id = (0, uuid_1.v4)();
        // // create root folder
        // const rootPath = join(this.storageRootPath(session), id)
        // await this.mkdir(ftp, rootPath)
        // create assets folder
        const assetsPath = (0, path_1.join)(this.rootPath(session), id, '/assets');
        await this.mkdir(ftp, assetsPath);
        // create website data file
        const websiteDataPath = (0, path_1.join)(this.rootPath(session), id, constants_1.WEBSITE_DATA_FILE);
        await this.write(ftp, websiteDataPath, JSON.stringify(types_1.defaultWebsiteData));
        // create website meta data file
        const websiteMetaDataPath = (0, path_1.join)(this.rootPath(session), id, constants_1.WEBSITE_META_DATA_FILE);
        await this.write(ftp, websiteMetaDataPath, JSON.stringify({}));
        // Clean up
        this.closeClient(ftp);
        // All good
        return id;
    }
    async listWebsites(session) {
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        const files = await this.readdir(ftp, storageRootPath);
        const list = await Promise.all(files.map(async (file) => {
            const websiteId = file.name;
            const websiteMeta = await this.getWebsiteMeta(session, websiteId);
            return websiteMeta;
        }));
        this.closeClient(ftp);
        return list;
    }
    async readWebsite(session, websiteId) {
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        const websiteDataPath = (0, path_1.join)(storageRootPath, websiteId, constants_1.WEBSITE_DATA_FILE);
        const data = await this.read(ftp, websiteDataPath);
        this.closeClient(ftp);
        return data;
    }
    async updateWebsite(session, websiteId, data) {
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        const websiteDataPath = (0, path_1.join)(storageRootPath, websiteId, constants_1.WEBSITE_DATA_FILE);
        await this.write(ftp, websiteDataPath, JSON.stringify(data));
        this.closeClient(ftp);
    }
    async deleteWebsite(session, websiteId) {
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        const websitePath = (0, path_1.join)(storageRootPath, websiteId);
        await this.rmdir(ftp, websitePath);
        this.closeClient(ftp);
    }
    async duplicateWebsite(session, websiteId) {
        const newWebsiteId = (0, uuid_1.v4)();
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        const websitePath = (0, path_1.join)(storageRootPath, websiteId);
        const newWebsitePath = (0, path_1.join)(storageRootPath, newWebsiteId);
        const tempDir = await (0, promises_1.mkdtemp)((0, os_1.tmpdir)());
        await ftp.downloadToDir(websitePath, tempDir);
        await ftp.uploadFromDir(tempDir, newWebsitePath);
        this.closeClient(ftp);
    }
    async writeAssets(session, id, files, statusCbk) {
        return this.writeFile(session, id, files, this.options.assetsFolder, statusCbk);
    }
    async writeFile(session, id, files, relativePath, statusCbk) {
        // Connect to FTP server
        statusCbk && statusCbk({
            message: 'Connecting to FTP server',
            status: types_1.JobStatus.IN_PROGRESS,
        });
        const ftp = await this.getClient(this.sessionData(session));
        const rootPath = this.rootPath(session);
        // Make sure that root folder exists
        statusCbk && statusCbk({
            message: 'Making sure that root folder exists',
            status: types_1.JobStatus.IN_PROGRESS,
        });
        // Useless as ftp write will create the folder
        // await this.mkdir(ftp, rootPath)
        // Write files
        let lastFile;
        try {
            // Sequentially write files
            for (const file of files) {
                statusCbk && statusCbk({
                    message: `Writing file ${file.path}`,
                    status: types_1.JobStatus.IN_PROGRESS,
                });
                const dstPath = (0, path_1.join)(this.options.path, rootPath, id, relativePath, file.path);
                lastFile = file;
                const result = await this.write(ftp, dstPath, file.content, message => {
                    statusCbk && statusCbk({
                        message: `Writing file ${file.path.split('/').pop()} to ${dstPath.split('/').slice(0, -1).join('/')}: ${message}`,
                        status: types_1.JobStatus.IN_PROGRESS,
                    });
                });
            }
            this.closeClient(ftp);
            statusCbk && statusCbk({
                message: `Finished writing ${files.length} files to ${rootPath}`,
                status: types_1.JobStatus.SUCCESS,
            });
        }
        catch (err) {
            // Not sure why it never gets here
            statusCbk && statusCbk({
                message: `Error writing file ${lastFile?.path}: ${err.message}`,
                status: types_1.JobStatus.ERROR,
            });
            this.closeClient(ftp);
        }
    }
    async readAsset(session, id, path) {
        if (!this.sessionData(session))
            throw new Error('Not logged in');
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        const dirPath = (0, path_1.join)(this.options.path, storageRootPath, id, this.options.assetsFolder, path);
        const asset = await this.read(ftp, dirPath);
        this.closeClient(ftp);
        return asset;
    }
    async deleteAssets(session, id, paths) {
        const storageRootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        await Promise.all(paths.map((path) => this.unlink(ftp, (0, path_1.join)(this.options.path, storageRootPath, id, this.options.assetsFolder, path))));
        this.closeClient(ftp);
    }
    // **
    // Hosting interface
    async getUrl(session, id) {
        // FIXME: do not store websiteUrl in the session, but in the website data
        console.warn('FIXME: do not store websiteUrl in the session, but in the website data');
        return this.sessionData(session).websiteUrl ?? '';
    }
    async publish(session, id, files, { startJob, jobSuccess, jobError }) {
        const job = startJob(`Publishing to ${this.displayName}`);
        job.logs = [[`Publishing to ${this.displayName}`]];
        job.errors = [[]];
        // Create folders
        const rootPath = this.rootPath(session);
        const ftp = await this.getClient(this.sessionData(session));
        await this.mkdir(ftp, rootPath);
        await this.mkdir(ftp, (0, path_1.join)(rootPath, this.options.assetsFolder));
        await this.mkdir(ftp, (0, path_1.join)(rootPath, this.options.cssFolder));
        // Write files
        // Do not await for the result, return the job and continue the publication in the background
        this.writeFile(session, '', files, '', async ({ status, message }) => {
            // Update the job status
            job.status = status;
            job.message = message;
            job.logs[0].push(message);
            if (status === types_1.JobStatus.SUCCESS) {
                jobSuccess(job.jobId, message);
            }
            else if (status === types_1.JobStatus.ERROR) {
                job.errors[0].push(message);
                jobError(job.jobId, message);
            }
        });
        return job;
    }
}
exports.default = FtpConnector;
//# sourceMappingURL=FtpConnector.js.map