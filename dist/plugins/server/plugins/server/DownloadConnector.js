"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const archiver_1 = __importDefault(require("archiver"));
const types_1 = require("../../types");
const os_1 = require("os");
const events_1 = require("../../server/events");
const ZIP_ICON = '/assets/download.png';
class default_1 {
    connectorId = 'download-connector';
    displayName = 'Download zip file';
    icon = ZIP_ICON;
    disableLogout = false;
    options;
    connectorType = types_1.ConnectorType.HOSTING;
    color = '#ffffff';
    background = '#006400';
    constructor(config) {
        // Add a route to serve the zip file
        config.on(events_1.ServerEvent.STARTUP_END, ({ app }) => {
            app.get('/download/:tmpZipFile', async (req, res) => {
                const path = `${(0, os_1.tmpdir)()}/${req.params.tmpZipFile}`;
                res.sendFile(path, {}, (err) => {
                    if (err) {
                        console.error('[DownloadConnector] Error while sending file', err);
                        res.status(500).send(`
              <h1>Error</h1>
              <p>There was an error while getting the zip file of your website</p>
              <p>${err.message}</p>
            `);
                    }
                });
            });
        });
    }
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
        return null;
    }
    async publish(session, websiteId, files, jobManager) {
        const job = jobManager.startJob(`Publishing to ${this.displayName}`);
        this.startPublishingInBackground(session, websiteId, files, job);
        return job;
    }
    async startPublishingInBackground(session, websiteId, files, job) {
        const fileName = `${websiteId}-${Date.now()}-${Math.random().toString(36).substring(7)}.zip`;
        return new Promise((resolve, reject) => {
            let resolved = false;
            try {
                // Generate a temporary path for the zip file, in the OS tmp folder, with the website id, the date and random string
                const path = `${(0, os_1.tmpdir)()}/${fileName}`;
                // create a file to stream archive data to.
                const output = (0, fs_1.createWriteStream)(path);
                const archive = (0, archiver_1.default)('zip', {
                    zlib: { level: 9 } // Sets the compression level.
                });
                // Listen to archive events
                // listen for all archive data to be written
                // 'close' event is fired only when a file descriptor is involved
                output.on('close', function () {
                    !resolved && resolve(path);
                    resolved = true;
                });
                // good practice to catch warnings (ie stat failures and other non-blocking errors)
                archive.on('warning', function (err) {
                    if (err.code === 'ENOENT') {
                        // log warning
                    }
                    else {
                        !resolved && reject(err);
                        resolved = true;
                    }
                });
                // good practice to catch this error explicitly
                archive.on('error', function (err) {
                    !resolved && reject(err);
                    resolved = true;
                });
                // pipe archive data to the filey
                archive.pipe(output);
                // append files
                for (const file of files) {
                    job.message = `Adding ${file.path} to the zip file`;
                    // Handle content as string, buffer or readable
                    archive.append(file.content, { name: file.path });
                }
                // finalize the archive (ie we are done appending files but streams have to finish yet)
                job.message = 'Finalizing the zip file';
                return archive.finalize()
                    .then(() => path);
            }
            catch (err) {
                console.error('Error while creating the zip file', err);
                job.message = `Error while creating the zip file: ${err.message}`;
                job.status = types_1.JobStatus.ERROR;
                !resolved && reject(err);
                resolved = true;
            }
        })
            .then(path => {
            job.message = `Zip file created, <a href="/download/${fileName}" target="_blank">download it now</a>`;
            job.status = types_1.JobStatus.SUCCESS;
        });
    }
    async getUrl(session, websiteId) {
        return '';
    }
}
exports.default = default_1;
//# sourceMappingURL=DownloadConnector.js.map