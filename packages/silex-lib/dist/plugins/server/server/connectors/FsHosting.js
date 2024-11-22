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
        // Call write without id or folder so that it goes in / (path will be modified by publication transformers)
        await this.write(session, '', files, '', async ({ status, message }) => {
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
    async getUrl(session, id) {
        const filePath = (0, path_1.join)(this.options.path, id, 'index.html');
        const fileUrl = new URL(filePath, 'file://');
        return fileUrl.toString();
    }
}
exports.FsHosting = FsHosting;
//# sourceMappingURL=FsHosting.js.map