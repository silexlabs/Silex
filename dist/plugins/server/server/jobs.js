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
exports.jobManager = void 0;
exports.startJob = startJob;
exports.getJob = getJob;
exports.jobSuccess = jobSuccess;
exports.jobError = jobError;
exports.killJob = killJob;
const types_1 = require("../types");
// Delay after which the job is deleted from memory
const TIME_TO_KEEP_AFTER_STOP = 60 * 10 * 1000; // 10 min
// Store the jobs in memory
const jobs = new Array();
const timers = new WeakMap();
// Key which will change on server restart
const processKey = Math.ceil(Math.random() * 1000000);
// Next id for the next job
let nextJobId = 0;
// Create a new job
function startJob(message = '') {
    const jobId = `${processKey}_${++nextJobId}`;
    const job = {
        jobId,
        status: types_1.JobStatus.IN_PROGRESS,
        message: message
    };
    jobs.push(job);
    return job;
}
// Retriev a job if it exists
function getJob(id) {
    return jobs.find(job => job.jobId === id);
}
// End the job with success
function jobSuccess(id, message = '') {
    return end(id, types_1.JobStatus.SUCCESS, message);
}
// End the job with error
function jobError(id, message = '') {
    return end(id, types_1.JobStatus.ERROR, message);
}
// Remove a job from memory
// This is also used in unit tests to avoid memory lea
function killJob(job) {
    clearTimeout(timers.get(job));
    timers.delete(job);
    jobs.splice(jobs.findIndex(j => job.jobId === j.jobId), 1);
}
// End the job
function end(id, status, message = '') {
    const job = getJob(id);
    if (job) {
        job.status = status;
        if (message)
            job.message = message;
        timers.set(job, setTimeout(() => killJob(job), TIME_TO_KEEP_AFTER_STOP));
        return true;
    }
    return false;
}
// Export the job manager
exports.jobManager = { startJob, jobSuccess, jobError };
//# sourceMappingURL=jobs.js.map