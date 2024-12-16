"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FsHosting = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = require("path");
const FsStorage_1 = require("./FsStorage");
const types_1 = require("../../types");
class FsHosting extends FsStorage_1.FsStorage {
    connectorId = 'fs-hosting';
    displayName = 'File system hosting';
    connectorType = types_1.ConnectorType.HOSTING;
    async initFs() {
        const stat = await promises_1.default.stat(this.options.path).catch(() => null);
        if (!stat) {
            await promises_1.default.mkdir((0, path_1.join)(this.options.path, 'assets'), { recursive: true });
            await promises_1.default.mkdir((0, path_1.join)(this.options.path, 'css'), { recursive: true });
            console.info(`> [FsHosting] Created folders assets/ and css/ in ${this.options.path}`);
        }
    }
    async publish(session, id, files, { startJob, jobSuccess, jobError }) {
        const job = startJob(`Publishing to ${this.displayName}`);
        job.logs = [[`Publishing to ${this.displayName}`]];
        job.errors = [[]];
        await this.write(session, '', files, '', async ({ status, message }) => {
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
    async getUrl(session, id) {
        const filePath = (0, path_1.join)(this.options.path, id, 'index.html');
        const fileUrl = new URL(filePath, 'file://');
        return fileUrl.toString();
    }
}
exports.FsHosting = FsHosting;
