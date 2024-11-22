"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobManager = void 0;
exports.startJob = startJob;
exports.getJob = getJob;
exports.jobSuccess = jobSuccess;
exports.jobError = jobError;
exports.killJob = killJob;
const types_1 = require("../types");
const TIME_TO_KEEP_AFTER_STOP = 60 * 10 * 1000;
const jobs = new Array();
const timers = new WeakMap();
const processKey = Math.ceil(Math.random() * 1000000);
let nextJobId = 0;
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
function getJob(id) {
    return jobs.find(job => job.jobId === id);
}
function jobSuccess(id, message = '') {
    return end(id, types_1.JobStatus.SUCCESS, message);
}
function jobError(id, message = '') {
    return end(id, types_1.JobStatus.ERROR, message);
}
function killJob(job) {
    clearTimeout(timers.get(job));
    timers.delete(job);
    jobs.splice(jobs.findIndex(j => job.jobId === j.jobId), 1);
}
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
exports.jobManager = { startJob, jobSuccess, jobError };
