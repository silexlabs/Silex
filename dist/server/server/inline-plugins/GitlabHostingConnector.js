"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const GitlabConnector_1 = __importDefault(require("./GitlabConnector"));
const types_1 = require("../../common/types");
const promises_1 = require("timers/promises");
const waitTimeOut = 5000;
const jobPollInterval = 10000;
const jobCompletionTimeOut = 45 * 60 * 1000;
const SILEX_OVERWRITE_NOTICE = '# silexOverwrite: true';
const GITLAB_RUNNING_STATUSES = ['created', 'waiting_for_resource', 'preparing', 'pending', 'running'];
const GITLAB_SUCCESS_STATUSES = ['success'];
const GITLAB_FAILED_STATUSES = ['failed', 'canceled', 'skipped'];
function filterTraceLines(trace) {
    const ansiEscape = /\x1b\[[0-9;?]*[a-zA-Z]/g;
    return trace.split('\n')
        .map(l => l.replace(ansiEscape, '').trim())
        .filter(l => l.length > 0)
        .filter(l => !l.match(/^section_/))
        .map(l => l.replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*\d*O?\s*/, ''))
        .filter(l => !l.includes('Using Docker executor'))
        .filter(l => !l.includes('Pulling docker image'))
        .filter(l => !l.includes('Fetching changes'))
        .filter(l => !l.includes('Checking out'))
        .filter(l => !l.includes('Skipping Git submodules'))
        .filter(l => !l.includes('Getting source from Git'))
        .filter(l => !l.includes('Executing "step_script"'))
        .filter(l => !l.includes('Restoring cache'))
        .filter(l => !l.includes('Saving cache'))
        .filter(l => !l.match(/^\s*\$\s/))
        .filter(l => !l.match(/^Running with gitlab-runner/))
        .filter(l => !l.match(/^Preparing the .* executor/))
        .filter(l => !l.match(/^Using .* as base image/))
        .filter(l => l.trim().length > 0);
}
function parseJobTrace(trace) {
    const lines = filterTraceLines(trace);
    if (trace.includes('[11ty]')) {
        if (trace.includes('[11ty] Wrote') || trace.includes('[11ty] Copied')) {
            const wroteMatch = trace.match(/\[11ty\] Wrote (\d+)/i);
            const copiedMatch = trace.match(/\[11ty\] Copied (\d+)/i);
            const parts = [];
            if (wroteMatch)
                parts.push(`${wroteMatch[1]} pages generated`);
            if (copiedMatch)
                parts.push(`${copiedMatch[1]} files copied`);
            if (parts.length)
                return parts.join(', ');
        }
        const eleventyMatch = trace.match(/\[11ty\].*?(\d+)\s+files?/i);
        if (eleventyMatch) {
            return `Generating ${eleventyMatch[1]} pages...`;
        }
        return 'Building pages...';
    }
    if (trace.includes('npm') && trace.includes('install')) {
        return 'Installing dependencies...';
    }
    if (trace.includes('npx') && trace.includes('eleventy')) {
        return 'Running page generator...';
    }
    if (trace.includes('Uploading artifacts')) {
        return 'Preparing files for deployment...';
    }
    if (trace.includes('CI_PAGES_URL') || trace.includes('will be deployed')) {
        return 'Finalizing deployment...';
    }
    if (trace.includes('Job succeeded')) {
        return 'Build complete';
    }
    const errorMatch = trace.match(/error[:\s]+(.{0,100})/i);
    if (errorMatch) {
        const errorMsg = errorMatch[1].trim().substring(0, 60);
        return `Error: ${errorMsg}${errorMsg.length >= 60 ? '...' : ''}`;
    }
    return '';
}
class GitlabHostingConnector extends GitlabConnector_1.default {
    displayName = 'Gitlab hosting';
    connectorType = types_1.ConnectorType.HOSTING;
    constructor(config, opts) {
        super(config, opts);
        this.options.assetsFolder = 'public';
    }
    async publish(session, websiteId, files, { startJob, jobSuccess, jobError }) {
        const job = startJob(`Publishing to ${this.displayName}`);
        job.logs = [[`Publishing to ${this.displayName}`]];
        job.errors = [[]];
        const pathYml = '.gitlab-ci.yml';
        const contentYml = (0, dedent_1.default) `
      ${SILEX_OVERWRITE_NOTICE}
      # You will want to remove these lines if you customize your build process
      # Silex will overwrite this file unless you remove these lines
      # This is the default build process for plain eleventy sites
      image: node:20
      pages:
        stage: deploy
        environment: production
        script:${files.find(file => file.path.includes('.11tydata.')) ? `
          - npx @11ty/eleventy@v3.0.0-alpha.20 --input=public --output=_site
          - mkdir -p public/css public/assets && cp -R public/css public/assets _site/
          - rm -rf public && mv _site public`
            : ''}
          - echo "The site will be deployed to $CI_PAGES_URL"
        artifacts:
          paths:
            - public
        rules:
          - if: '$CI_COMMIT_TAG'
          - if: '$CI_PIPELINE_SOURCE == "trigger"'
    `;
        try {
            job.message = `Checking if ${pathYml} needs to be created or updated...`;
            job.logs[0].push(job.message);
            const originalCi = await this.readFile(session, websiteId, pathYml);
            if (originalCi.toString().startsWith(SILEX_OVERWRITE_NOTICE)) {
                job.message = `Updating ${pathYml}...`;
                job.logs[0].push(job.message);
                await this.updateFile(session, websiteId, pathYml, contentYml);
            }
        }
        catch (e) {
            if (e.statusCode === 404 || e.httpStatusCode === 404 || e.message.endsWith('A file with this name doesn\'t exist')) {
                job.message = `Creating ${pathYml}...`;
                job.logs[0].push(job.message);
                await this.createFile(session, websiteId, pathYml, contentYml);
            }
            else {
                jobError(job.jobId, e.message);
            }
        }
        this.writeAssets(session, websiteId, files, async ({ status, message }) => {
            if (status === types_1.JobStatus.SUCCESS) {
                const successTag = await this.createTag(session, websiteId, job, { startJob, jobSuccess, jobError });
                if (!successTag) {
                    return;
                }
                try {
                    job.message = 'Getting the website URL...';
                    job.logs[0].push(job.message);
                    const gitlabUrl = await this.getUrl(session, websiteId);
                    job.logs[0].push(`Website URL: ${gitlabUrl}`);
                    job.message = 'Getting the admin URL...';
                    job.logs[0].push(job.message);
                    const adminUrl = await this.getAdminUrl(session, websiteId);
                    job.logs[0].push(`Admin URL: ${adminUrl}`);
                    job.message = 'Getting the page URL...';
                    job.logs[0].push(job.message);
                    const pageUrl = await this.getPageUrl(session, websiteId, adminUrl);
                    job.logs[0].push(`Page URL: ${pageUrl}`);
                    job.message = 'Starting build...';
                    job.logs[0].push(job.message);
                    const result = await this.waitForGitlabJobCompletion(session, websiteId, job, adminUrl, successTag, gitlabUrl, pageUrl);
                    if (result.success) {
                        jobSuccess(job.jobId, result.message);
                    }
                    else {
                        jobError(job.jobId, result.message);
                    }
                }
                catch (error) {
                    console.error('Error during getting the website URLs:', error.message);
                    jobError(job.jobId, `Failed to get the website URLs: ${error.message}`);
                }
            }
            else if (status === types_1.JobStatus.ERROR) {
                job.errors[0].push(message);
                jobError(job.jobId, message);
            }
            else {
                job.status = status;
                job.message = message;
                job.logs[0].push(message);
            }
        }, true)
            .catch(e => {
            console.error('Error uploading files to gitlab:', e.message);
            jobError(job.jobId, `Failed to upload files: ${e.message}`);
        });
        return job;
    }
    async getUrl(session, websiteId) {
        const response = await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/pages`,
            method: 'GET'
        });
        return response.url;
    }
    async getAdminUrl(session, websiteId) {
        const projectInfo = await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}`,
            method: 'GET'
        });
        return projectInfo.web_url;
    }
    async getPageUrl(session, websiteId, projectUrl) {
        return `${projectUrl}/pages`;
    }
    async waitForGitlabJobCompletion(session, websiteId, job, projectUrl, tag, gitlabUrl, pageUrl) {
        const t0 = Date.now();
        let gitlabJobId = null;
        let gitlabJobLogsUrl = null;
        while (!gitlabJobId && (Date.now() - t0) < this.options.timeOut) {
            try {
                const jobs = await this.callApi({
                    session,
                    path: `api/v4/projects/${websiteId}/jobs`,
                    method: 'GET'
                });
                const matchingJob = jobs.find(j => j.ref === tag);
                if (matchingJob) {
                    gitlabJobId = matchingJob.id;
                    gitlabJobLogsUrl = `${projectUrl}/-/jobs/${matchingJob.id}`;
                    job.logs[0].push('Build started');
                    job.message = `
            <p><strong>Building...</strong></p>
            <div class="buttons">
              <a href="${gitlabJobLogsUrl}" target="_blank" class="silex-button silex-button--secondary">View build logs</a>
            </div>
          `;
                }
            }
            catch (e) {
                console.error('Error fetching GitLab jobs:', e.message);
            }
            if (!gitlabJobId) {
                await (0, promises_1.setTimeout)(waitTimeOut);
            }
        }
        if (!gitlabJobId) {
            let errorMessage = 'Could not start the build. The server may be busy or unavailable.';
            if (this.isUsingOfficialInstance()) {
                const verifyURL = 'https://gitlab.com/-/identity_verification';
                errorMessage +=
                    `<div class="notice">
              If your GitLab account is recent, you may need to <a href="${verifyURL}" target="_blank">verify it here</a>
              before you can publish websites.
           </div>`;
            }
            return { success: false, message: errorMessage };
        }
        let lastTraceLength = 0;
        while ((Date.now() - t0) < jobCompletionTimeOut) {
            try {
                const gitlabJob = await this.callApi({
                    session,
                    path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}`,
                    method: 'GET'
                });
                const jobStatus = gitlabJob.status;
                let traceInfo = '';
                try {
                    const trace = await this.callApi({
                        session,
                        path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}/trace`,
                        method: 'GET'
                    });
                    if (typeof trace === 'string' && trace.length > lastTraceLength) {
                        const newTrace = trace.substring(lastTraceLength);
                        traceInfo = parseJobTrace(newTrace);
                        lastTraceLength = trace.length;
                        const filteredLines = filterTraceLines(newTrace);
                        if (filteredLines.length > 0) {
                            const linesToAdd = filteredLines.slice(-50);
                            job.logs[0].push(...linesToAdd);
                        }
                    }
                }
                catch (e) {
                }
                const statusMap = {
                    'created': 'Starting',
                    'waiting_for_resource': 'Waiting for server',
                    'preparing': 'Preparing',
                    'pending': 'Queued',
                    'running': 'Building',
                    'success': 'Complete',
                    'failed': 'Failed',
                    'canceled': 'Canceled',
                    'skipped': 'Skipped',
                };
                const statusDisplay = statusMap[jobStatus] || jobStatus;
                const progressInfo = traceInfo ? ` - ${traceInfo}` : '';
                job.message = `
          <p><strong>${statusDisplay}</strong>${progressInfo}</p>
          <div class="buttons">
            <a href="${gitlabJobLogsUrl}" target="_blank" class="silex-button silex-button--secondary">View build logs</a>
          </div>
        `;
                if (GITLAB_SUCCESS_STATUSES.includes(jobStatus)) {
                    try {
                        const finalTrace = await this.callApi({
                            session,
                            path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}/trace`,
                            method: 'GET'
                        });
                        if (typeof finalTrace === 'string') {
                            const allFilteredLines = filterTraceLines(finalTrace);
                            job.logs[0].push('--- Build Summary ---');
                            job.logs[0].push(...allFilteredLines.slice(-30));
                        }
                    }
                    catch (e) {
                    }
                    const message = `
            <p><strong>Your website is now live!</strong></p>
            <div class="buttons">
              <a href="${gitlabUrl}" target="_blank" class="silex-button silex-button--primary">View your website</a>
              <a href="${pageUrl}" target="_blank" class="silex-button silex-button--secondary">GitLab Pages settings</a>
            </div>
          `;
                    job.logs[0].push('Build completed successfully');
                    return { success: true, message };
                }
                if (GITLAB_FAILED_STATUSES.includes(jobStatus)) {
                    const failureReason = gitlabJob.failure_reason || 'Build error';
                    try {
                        const finalTrace = await this.callApi({
                            session,
                            path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}/trace`,
                            method: 'GET'
                        });
                        if (typeof finalTrace === 'string') {
                            const allFilteredLines = filterTraceLines(finalTrace);
                            job.logs[0].push('--- Error Details ---');
                            job.logs[0].push(...allFilteredLines.slice(-50));
                        }
                    }
                    catch (e) {
                    }
                    const message = `
            <p><strong>Build failed:</strong> ${failureReason}</p>
            <div class="buttons">
              <a href="${gitlabJobLogsUrl}" target="_blank" class="silex-button silex-button--primary">View build logs</a>
              <a href="${pageUrl}" target="_blank" class="silex-button silex-button--secondary">Settings</a>
            </div>
          `;
                    job.logs[0].push(`Build failed: ${failureReason}`);
                    return { success: false, message };
                }
                await (0, promises_1.setTimeout)(jobPollInterval);
            }
            catch (e) {
                console.error('Error polling GitLab job status:', e.message);
                await (0, promises_1.setTimeout)(jobPollInterval);
            }
        }
        const message = `
      <p><strong>Build is taking longer than expected</strong></p>
      <p>Your website may still be published successfully.</p>
      <div class="buttons">
        <a href="${gitlabUrl}" target="_blank" class="silex-button silex-button--primary">Check your website</a>
        <a href="${gitlabJobLogsUrl}" target="_blank" class="silex-button silex-button--secondary">Check build status</a>
      </div>
    `;
        job.logs[0].push('Timeout waiting for build completion');
        return { success: false, message };
    }
    async createTag(session, websiteId, job, { startJob, jobSuccess, jobError }) {
        const projectId = websiteId;
        const newTag = '_silex_' + Date.now();
        try {
            job.message = 'Triggering build...';
            job.logs[0].push(job.message);
            await this.callApi({
                session,
                path: `api/v4/projects/${projectId}/repository/tags`,
                method: 'POST',
                requestBody: {
                    tag_name: newTag,
                    ref: 'main',
                    message: 'Publication from Silex',
                }
            });
        }
        catch (error) {
            console.error('Error during creating new tag:', error.message);
            jobError(job.jobId, `Failed to start build: ${error.message}`);
            return null;
        }
        return newTag;
    }
}
exports.default = GitlabHostingConnector;
