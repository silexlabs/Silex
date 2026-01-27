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

const waitTimeOut = 5000 /* for wait loop in job pages getting */
const SILEX_OVERWRITE_NOTICE = '# silexOverwrite: true'

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
          job.message = 'Getting the deployment logs URL...'
          job.logs[0].push(job.message)
          const gitlabJobLogsUrl = await this.getGitlabJobLogsUrl(session, websiteId, job, { startJob, jobSuccess, jobError }, adminUrl, successTag)
          // Because of the GitLab policy, this can be null (and we suggest the user to verify their account)
          if (!gitlabJobLogsUrl) {
            let errorMessage = 'Could not retrieve the deployment logs URL.'

            if (this.isUsingOfficialInstance()) {
              const verifyURL = 'https://gitlab.com/-/identity_verification'
              errorMessage +=
                `<div class="notice">
                    If your GitLab account is recent, you may need to verify it <a href="${verifyURL}" target="_blank">here</a>
                    in order to be able to use pipelines (this is GitLab's policy, not Silex's).
                 </div>`
            }

            throw new Error(errorMessage)
          }
          job.logs[0].push(`Deployment logs URL: ${gitlabJobLogsUrl}`)
          const message = `
            <p><a href="${gitlabUrl}" target="_blank">Your website will soon be live here</a>.</p>
            <p>Changes may take a few minutes to appear, <a href="${gitlabJobLogsUrl}" target="_blank">follow deployment here</a>.</p>
            <p>Manage <a href="${pageUrl}" target="_blank">GitLab Pages settings</a>.</p>
          `
          job.logs[0].push(message)
          jobSuccess(job.jobId, message)
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

  // waiting for the job corresponding to the current tag
  async getGitlabJobLogsUrl(session: GitlabSession, websiteId: WebsiteId, job: PublicationJobData, { startJob, jobSuccess, jobError }: JobManager, projectUrl: string, tag): Promise<string | null> {
    const t0 = Date.now()
    do {
      const jobs = await this.callApi({
        session,
        path: `api/v4/projects/${websiteId}/jobs`,
        method: 'GET'
      })
      // Find job matching our tag (may not exist yet on first publish)
      const matchingJob = jobs.find(j => j.ref === tag)
      if (matchingJob) {
        return `${projectUrl}/-/jobs/${matchingJob.id}`
      }
      // No matching job yet - wait and retry
      await setTimeout(waitTimeOut)
    } while ((Date.now() - t0) < this.options.timeOut)
      
    // failed in timelaps allowed (avoiding infinite loop)
    jobError(job.jobId, 'Failed to get job id')
    job.message = 'Unable to get job id'
    job.logs[0].push(job.message)
    return `${projectUrl}/-/jobs/`
  }

  async createTag(session: GitlabSession, websiteId: WebsiteId, job: PublicationJobData, { startJob, jobSuccess, jobError }: JobManager): Promise<string | null> {
    const projectId = websiteId // Assuming websiteId corresponds to GitLab project ID
    const newTag = '_silex_' + Date.now()
    // Create a new tag
    try {
      job.message = `Creating new tag ${newTag}...`
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
      jobError(job.jobId, `Failed to create new tag: ${error.message}`)
      return null
    }
    
    // Return new tag
    return newTag
  }

}
