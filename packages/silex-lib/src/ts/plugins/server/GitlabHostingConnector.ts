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

/**
 * Gitlab hosting connector
 * @fileoverview Gitlab hosting connector for Silex, connect to the user's Gitlab account to host websites with .gitlab-ci.yml file template for plain html by default
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 * @see https://docs.gitlab.com/ee/user/project/pages/getting_started/pages_ci_cd_template.html
 */

import dedent from 'dedent'
import GitlabConnector, { GitlabOptions, GitlabSession} from './GitlabConnector'
import { HostingConnector, ConnectorFile } from '../../server/connectors/connectors'
import { ConnectorType, WebsiteId, JobData, JobStatus, PublicationJobData } from '../../types'
import { JobManager } from '../../server/jobs'
import { ServerConfig } from '../../server/config'
import { setTimeout } from 'timers/promises'

const waitTimeOut = 5000 /* for wait loop waiting for job to appear */
const jobPollInterval = 10000 /* poll job status every 10 seconds */
const jobCompletionTimeOut = 45 * 60 * 1000 /* 45 minutes max for job completion */
const SILEX_OVERWRITE_NOTICE = '# silexOverwrite: true'

// GitLab job statuses that indicate the job is still running
const GITLAB_RUNNING_STATUSES = ['created', 'waiting_for_resource', 'preparing', 'pending', 'running']
// GitLab job statuses that indicate success
const GITLAB_SUCCESS_STATUSES = ['success']
// GitLab job statuses that indicate failure
const GITLAB_FAILED_STATUSES = ['failed', 'canceled', 'skipped']

/**
 * Filter GitLab trace to remove technical noise
 * Returns an array of meaningful log lines
 */
function filterTraceLines(trace: string): string[] {
  return trace.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    // Remove GitLab internal markers
    .filter(l => !l.match(/^section_/))
    // eslint-disable-next-line no-control-regex
    .filter(l => !l.match(/^\x1b/)) // Remove ANSI escape sequences at start
    // Remove timestamps at the beginning of lines
    .map(l => l.replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*\d*O?\s*/, ''))
    // Remove Docker/Git setup noise
    .filter(l => !l.includes('Using Docker executor'))
    .filter(l => !l.includes('Pulling docker image'))
    .filter(l => !l.includes('Fetching changes'))
    .filter(l => !l.includes('Checking out'))
    .filter(l => !l.includes('Skipping Git submodules'))
    .filter(l => !l.includes('Getting source from Git'))
    .filter(l => !l.includes('Executing "step_script"'))
    .filter(l => !l.includes('Restoring cache'))
    .filter(l => !l.includes('Saving cache'))
    .filter(l => !l.match(/^\s*\$\s/)) // Remove shell command echoes
    .filter(l => !l.match(/^Running with gitlab-runner/))
    .filter(l => !l.match(/^Preparing the .* executor/))
    .filter(l => !l.match(/^Using .* as base image/))
    // Keep non-empty lines after filtering
    .filter(l => l.trim().length > 0)
}

/**
 * Parse GitLab/11ty job logs to extract meaningful status
 * Returns a short user-friendly status message
 */
function parseJobTrace(trace: string): string {
  const lines = filterTraceLines(trace)

  // Look for 11ty build progress
  if (trace.includes('[11ty]')) {
    // Look for 11ty completion first
    if (trace.includes('[11ty] Wrote') || trace.includes('[11ty] Copied')) {
      const wroteMatch = trace.match(/\[11ty\] Wrote (\d+)/i)
      const copiedMatch = trace.match(/\[11ty\] Copied (\d+)/i)
      const parts = []
      if (wroteMatch) parts.push(`${wroteMatch[1]} pages generated`)
      if (copiedMatch) parts.push(`${copiedMatch[1]} files copied`)
      if (parts.length) return parts.join(', ')
    }
    // Look for 11ty processing
    const eleventyMatch = trace.match(/\[11ty\].*?(\d+)\s+files?/i)
    if (eleventyMatch) {
      return `Generating ${eleventyMatch[1]} pages...`
    }
    return 'Building pages...'
  }

  // Look for npm/npx installing
  if (trace.includes('npm') && trace.includes('install')) {
    return 'Installing dependencies...'
  }

  // Look for npx running eleventy
  if (trace.includes('npx') && trace.includes('eleventy')) {
    return 'Running page generator...'
  }

  // Look for artifact upload
  if (trace.includes('Uploading artifacts')) {
    return 'Preparing files for deployment...'
  }

  // Look for pages deployment
  if (trace.includes('CI_PAGES_URL') || trace.includes('will be deployed')) {
    return 'Finalizing deployment...'
  }

  // Look for job completion
  if (trace.includes('Job succeeded')) {
    return 'Build complete'
  }

  // Look for errors
  const errorMatch = trace.match(/error[:\s]+(.{0,100})/i)
  if (errorMatch) {
    const errorMsg = errorMatch[1].trim().substring(0, 60)
    return `Error: ${errorMsg}${errorMsg.length >= 60 ? '...' : ''}`
  }

  // Return empty string to avoid showing technical noise
  return ''
}

export default class GitlabHostingConnector extends GitlabConnector implements HostingConnector {

  displayName = 'Gitlab hosting'
  connectorType = ConnectorType.HOSTING

  constructor( config: ServerConfig, opts: Partial<GitlabOptions>) {
    super (config, opts)
    // public directory for standard gitlab pages
    this.options.assetsFolder= 'public'
  }

  async publish(session: GitlabSession, websiteId: WebsiteId, files: ConnectorFile[], {startJob, jobSuccess, jobError}: JobManager): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    /* Configuration file .gitlab-ci.yml contains template for plain html Gitlab pages*/
    const pathYml = '.gitlab-ci.yml'
    const contentYml = dedent`
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
    `
    try {
      job.message = `Checking if ${pathYml} needs to be created or updated...`
      job.logs[0].push(job.message)
      const originalCi = await this.readFile(session, websiteId, pathYml)
      if(originalCi.toString().startsWith(SILEX_OVERWRITE_NOTICE)) {
        job.message = `Updating ${pathYml}...`
        job.logs[0].push(job.message)
        await this.updateFile(session, websiteId, pathYml, contentYml)
      }
    } catch (e) {
      // If the file .gitlab-ci.yml does not exist, create it, otherwise do nothing (do not overwriting existing one)
      if (e.statusCode === 404 || e.httpStatusCode === 404 || e.message.endsWith('A file with this name doesn\'t exist')) {
        job.message = `Creating ${pathYml}...`
        job.logs[0].push(job.message)
        await this.createFile(session, websiteId, pathYml, contentYml)
      } else {
        jobError(job.jobId, e.message)
      }
    }

    // publishing all files for website
    // Do not await for the result, return the job and continue the publication in the background
    //this .startPublicationJob(session, websiteId, files, job, () => this.endPublicationJob(session, websiteId, job))
    this.writeAssets(session, websiteId, files, async ({status, message}) => {
      // Update the job status
      if(status === JobStatus.SUCCESS) {
        /* Squash and tag the commits */
        const successTag = await this.createTag(session, websiteId, job, { startJob, jobSuccess, jobError })
        if(!successTag) {
          // jobError will have been called in createTag
          return
        }
        try {
          job.message = 'Getting the website URL...'
          job.logs[0].push(job.message)
          const gitlabUrl = await this.getUrl(session, websiteId)
          job.logs[0].push(`Website URL: ${gitlabUrl}`)
          job.message = 'Getting the admin URL...'
          job.logs[0].push(job.message)
          const adminUrl = await this.getAdminUrl(session, websiteId)
          job.logs[0].push(`Admin URL: ${adminUrl}`)
          job.message = 'Getting the page URL...'
          job.logs[0].push(job.message)
          const pageUrl = await this.getPageUrl(session, websiteId, adminUrl)
          job.logs[0].push(`Page URL: ${pageUrl}`)

          // Wait for the GitLab job to complete
          job.message = 'Starting build...'
          job.logs[0].push(job.message)
          const result = await this.waitForGitlabJobCompletion(session, websiteId, job, adminUrl, successTag, gitlabUrl, pageUrl)

          if (result.success) {
            jobSuccess(job.jobId, result.message)
          } else {
            jobError(job.jobId, result.message)
          }
        } catch (error) {
          console.error('Error during getting the website URLs:', error.message)
          jobError(job.jobId, `Failed to get the website URLs: ${error.message}`)
        }
      } else if (status === JobStatus.ERROR) {
        job.errors[0].push(message)
        jobError(job.jobId, message)
      } else {
        // Update the job status while uploading files
        job.status = status
        job.message = message
        job.logs[0].push(message)
      }
    }, true)
      .catch(e => {
        console.error('Error uploading files to gitlab:', e.message)
        jobError(job.jobId, `Failed to upload files: ${e.message}`)
      })

    return job
  }

  // async startPublicationJob(session: GitlabSession, websiteId: WebsiteId, files: ConnectorFile[], job: PublicationJobData, endJob: () => void) {
  //   job.message = `Preparing ${files.length} files...`
  //   job.logs[0].push(job.message)
  //   job.status = JobStatus.IN_PROGRESS
  //   job.startTime = Date.now()

  //   // List all the files in assets folder
  //   const existingFiles = await this.ls({
  //     session,
  //     websiteId,
  //     recursive: false,
  //     path: this.options.assetsFolder,
  //   })

  //   // Create the actions for the batch
  //   const filesToUpload = [] as GitlabAction[]
  //   for (const file of files) {
  //     const filePath = this.getAssetPath(file.path, false)
  //     const content = (await contentToBuffer(file.content)).toString('base64')
  //     const existingSha = existingFiles.get(filePath)
  //     const newSha = computeGitBlobSha(content, true)
  //     if (existingSha) {
  //       if (existingSha !== newSha) {
  //         filesToUpload.push({
  //           action: 'update',
  //           file_path: filePath,
  //           content,
  //           encoding: 'base64',
  //         })
  //       } // else: skip unchanged file
  //     } else {
  //       filesToUpload.push({
  //         action: 'create',
  //         file_path: filePath,
  //         content,
  //         encoding: 'base64',
  //       })
  //     }

  /* Get and return Url Gitlab Pages */
  async getUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string> {
    const response = await this.callApi({
      session,
      path: `api/v4/projects/${websiteId}/pages`,
      method: 'GET'
    })
    return response.url
  }

  async getAdminUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string> {
    const projectInfo = await this.callApi({
      session,
      path: `api/v4/projects/${websiteId}`,
      method: 'GET'
    })
    return projectInfo.web_url
  }

  async getPageUrl(session: GitlabSession, websiteId: WebsiteId, projectUrl: string): Promise<string> {
    return `${projectUrl}/pages`
  }

  /**
   * Wait for the GitLab CI/CD job to complete
   * Polls the job status and updates the Silex job with progress
   */
  async waitForGitlabJobCompletion(
    session: GitlabSession,
    websiteId: WebsiteId,
    job: PublicationJobData,
    projectUrl: string,
    tag: string,
    gitlabUrl: string,
    pageUrl: string
  ): Promise<{ success: boolean; message: string }> {
    const t0 = Date.now()
    let gitlabJobId: number | null = null
    let gitlabJobLogsUrl: string | null = null

    // First, wait for the job to appear
    while (!gitlabJobId && (Date.now() - t0) < this.options.timeOut) {
      try {
        const jobs = await this.callApi({
          session,
          path: `api/v4/projects/${websiteId}/jobs`,
          method: 'GET'
        })
        const matchingJob = jobs.find(j => j.ref === tag)
        if (matchingJob) {
          gitlabJobId = matchingJob.id
          gitlabJobLogsUrl = `${projectUrl}/-/jobs/${matchingJob.id}`
          job.logs[0].push('Build started')
          job.message = `
            <p><strong>Building...</strong></p>
            <p><a href="${gitlabJobLogsUrl}" target="_blank">View build logs</a></p>
          `
        }
      } catch (e) {
        console.error('Error fetching GitLab jobs:', e.message)
      }
      if (!gitlabJobId) {
        await setTimeout(waitTimeOut)
      }
    }

    // If job never appeared, handle the error
    if (!gitlabJobId) {
      let errorMessage = 'Could not start the build. The server may be busy or unavailable.'

      if (this.isUsingOfficialInstance()) {
        const verifyURL = 'https://gitlab.com/-/identity_verification'
        errorMessage +=
          `<div class="notice">
              If your GitLab account is recent, you may need to <a href="${verifyURL}" target="_blank">verify it here</a>
              before you can publish websites.
           </div>`
      }

      return { success: false, message: errorMessage }
    }

    // Now poll the job status until it completes
    let lastTraceLength = 0
    while ((Date.now() - t0) < jobCompletionTimeOut) {
      try {
        // Get job status
        const gitlabJob = await this.callApi({
          session,
          path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}`,
          method: 'GET'
        })

        const jobStatus = gitlabJob.status

        // Try to get job trace (logs) for progress info
        let traceInfo = ''
        try {
          const trace = await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}/trace`,
            method: 'GET'
          })
          if (typeof trace === 'string' && trace.length > lastTraceLength) {
            // Parse the new portion of the trace
            const newTrace = trace.substring(lastTraceLength)
            traceInfo = parseJobTrace(newTrace)
            lastTraceLength = trace.length

            // Add filtered log lines to the job logs for the <details> section
            const filteredLines = filterTraceLines(newTrace)
            if (filteredLines.length > 0) {
              // Limit to last 50 lines to avoid overwhelming the logs
              const linesToAdd = filteredLines.slice(-50)
              job.logs[0].push(...linesToAdd)
            }
          }
        } catch (e) {
          // Trace might not be available yet, that's OK
        }

        // Map GitLab status to user-friendly status
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
        }
        const statusDisplay = statusMap[jobStatus] || jobStatus
        const progressInfo = traceInfo ? ` - ${traceInfo}` : ''
        job.message = `
          <p><strong>${statusDisplay}</strong>${progressInfo}</p>
          <p><a href="${gitlabJobLogsUrl}" target="_blank">View build logs</a></p>
        `

        // Check if job completed
        if (GITLAB_SUCCESS_STATUSES.includes(jobStatus)) {
          // Fetch final trace to include in logs
          try {
            const finalTrace = await this.callApi({
              session,
              path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}/trace`,
              method: 'GET'
            })
            if (typeof finalTrace === 'string') {
              const allFilteredLines = filterTraceLines(finalTrace)
              // Add last 30 lines as summary
              job.logs[0].push('--- Build Summary ---')
              job.logs[0].push(...allFilteredLines.slice(-30))
            }
          } catch (e) {
            // Ignore trace fetch errors
          }

          const message = `
            <p><strong>Your website is now live!</strong></p>
            <p><a href="${gitlabUrl}" target="_blank" class="silex-button silex-button--primary">View your website</a></p>
            <p><a href="${pageUrl}" target="_blank" class="silex-button silex-button--secondary">GitLab Pages settings</a></p>
          `
          job.logs[0].push('Build completed successfully')
          return { success: true, message }
        }

        if (GITLAB_FAILED_STATUSES.includes(jobStatus)) {
          const failureReason = gitlabJob.failure_reason || 'Build error'

          // Fetch final trace to include error details in logs
          try {
            const finalTrace = await this.callApi({
              session,
              path: `api/v4/projects/${websiteId}/jobs/${gitlabJobId}/trace`,
              method: 'GET'
            })
            if (typeof finalTrace === 'string') {
              const allFilteredLines = filterTraceLines(finalTrace)
              // Add last 50 lines to help debug the error
              job.logs[0].push('--- Error Details ---')
              job.logs[0].push(...allFilteredLines.slice(-50))
            }
          } catch (e) {
            // Ignore trace fetch errors
          }

          const message = `
            <p><strong>Build failed:</strong> ${failureReason}</p>
            <p><a href="${gitlabJobLogsUrl}" target="_blank">View build logs for details</a></p>
            <p><a href="${pageUrl}" target="_blank">Settings</a></p>
          `
          job.logs[0].push(`Build failed: ${failureReason}`)
          return { success: false, message }
        }

        // Job still running, wait before next poll
        await setTimeout(jobPollInterval)

      } catch (e) {
        console.error('Error polling GitLab job status:', e.message)
        // Don't fail immediately, just wait and retry
        await setTimeout(jobPollInterval)
      }
    }

    // Timeout reached
    const message = `
      <p><strong>Build is taking longer than expected</strong></p>
      <p>Your website may still be published successfully.</p>
      <p><a href="${gitlabJobLogsUrl}" target="_blank">Check build status</a> | <a href="${gitlabUrl}" target="_blank">Check your website</a></p>
    `
    job.logs[0].push('Timeout waiting for build completion')
    return { success: false, message }
  }

  async createTag(session: GitlabSession, websiteId: WebsiteId, job: PublicationJobData, { startJob, jobSuccess, jobError }: JobManager): Promise<string | null> {
    const projectId = websiteId // Assuming websiteId corresponds to GitLab project ID
    const newTag = '_silex_' + Date.now()
    // Create a new tag to trigger the build
    try {
      job.message = 'Triggering build...'
      job.logs[0].push(job.message)
      await this.callApi({
        session,
        path: `api/v4/projects/${projectId}/repository/tags`,
        method: 'POST',
        requestBody: {
          tag_name: newTag,
          ref: 'main',
          message: 'Publication from Silex',
        }
      })
    } catch (error) {
      console.error('Error during creating new tag:', error.message)
      jobError(job.jobId, `Failed to start build: ${error.message}`)
      return null
    }

    // Return new tag
    return newTag
  }

}
