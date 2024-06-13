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

import GitlabConnector, { GitlabOptions, GitlabSession} from './GitlabConnector'
import { HostingConnector, ConnectorFile } from '../../server/connectors/connectors'
import { ConnectorType, WebsiteId, JobData, JobStatus, PublicationJobData } from '../../types'
import { JobManager } from '../../server/jobs'
import { join } from 'path'
import { ServerConfig } from '../../server/config'
import { stat } from 'fs'
import { setTimeout } from 'timers/promises'

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
    const contentYml = `
    image: node:20
    pages:
      stage: deploy
      environment: production
      script:${files.find(file => file.path.includes('.11tydata.')) ? `
        - npx @11ty/eleventy@canary --input=public --output=_site
        - mkdir -p public/css public/assets && cp -R public/css public/assets _site/
        - rm -rf public && mv _site public`  : `
        - echo "The site will be deployed to $CI_PAGES_URL"`}
      artifacts:
        paths:
          - public
      rules:
        - if: '$CI_COMMIT_TAG'
    `
    try {
      await this.readFile(session, websiteId, pathYml)
    } catch (e) {
      // If the file .gitlab-ci.yml does not exist, create it, otherwise do nothing (do not overwriting existing one)
      if (e.statusCode === 404 || e.httpStatusCode === 404 || e.message.endsWith('A file with this name doesn\'t exist')) {
        await this.createFile(session, websiteId, pathYml, contentYml)
      } else {
        jobError(job.jobId, e.message)
      }
    }

    // publishing all files for website
    // Do not await for the result, return the job and continue the publication in the background
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
          job.logs[0].push(`Deployment logs URL: ${gitlabJobLogsUrl}`)
          const message = `
            <p><a href="${gitlabUrl}" target="_blank">Your website is now live here</a>.</p>
            <p>Changes may take a few minutes to appear, <a href="${gitlabJobLogsUrl}" target="_blank">follow deployment here</a>.</p>
            <p>Manage <a href="${pageUrl}" target="_blank">GitLab Pages settings</a>.</p>
          `
          job.logs[0].push(message)
          jobSuccess(job.jobId, message)
        } catch (error) {
          console.error('Error during getting the website URLs:', error.message)
          jobError(job.jobId, `Failed to get the website URLs: ${error.message}`)
        }
      } else if(status === JobStatus.ERROR) {
        job.errors[0].push(message)
        jobError(job.jobId, message)
      } else {
        // Update the job status while uploading files
        job.status = status
        job.message = message
        job.logs[0].push(message)
      }
    })
      .catch(e => {
        console.error('Error uploading files to gitlab:', e.message)
        jobError(job.jobId, `Failed to upload files: ${e.message}`)
      })

    return job
  }

  /* Get and return Url Gitlab Pages */
  async getUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string> {
    const response = await this.callApi(session, `api/v4/projects/${websiteId}/pages`, 'GET')
    return response.url
  }

  async getAdminUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string> {
    const projectInfo = await this.callApi(session, `api/v4/projects/${websiteId}`, 'GET')
    return projectInfo.web_url
  }

  async getPageUrl(session: GitlabSession, websiteId: WebsiteId, projectUrl: string): Promise<string> {
    return `${projectUrl}/pages`
  }

  // waiting for the job corresponding to the current tag
  async getGitlabJobLogsUrl(session: GitlabSession, websiteId: WebsiteId, job: PublicationJobData, { startJob, jobSuccess, jobError }: JobManager, projectUrl: string, tag): Promise<string> {
    const t0 = Date.now()
    do {
      const jobs = await this.callApi(session, `api/v4/projects/${websiteId}/jobs`, 'GET')
      if (jobs[0].ref === tag) {return `${projectUrl}/-/jobs/${jobs[0].id}`}
      await setTimeout(5000)
    } while ((Date.now() - t0) < 15000)
    
    // failed in timelaps allowed (avoiding infinite loop)
    jobError(job.jobId, 'Failed to get job id')
    job.message = 'Unable to get job id'
    job.logs[0].push(job.message)
    return `${projectUrl}/-/jobs/`
  }

  async createTag(session: GitlabSession, websiteId: WebsiteId, job: JobData, { startJob, jobSuccess, jobError }: JobManager): Promise<string | null> {
    const projectId = websiteId // Assuming websiteId corresponds to GitLab project ID

    // Fetch the latest tag and determine the new tag
    let newTag, tags
    try {
      job.message = 'Fetching latest tag and commits...'
      // Fetch the latest tag
      tags = await this.callApi(session, `api/v4/projects/${projectId}/repository/tags`, 'GET')
      const latestTag = tags[0]?.name || 'v0.0.0'
      const [major, minor, patch] = latestTag.slice(1).split('.').map(Number)
      newTag = `v${major}.${minor}.${patch + 1}`
    } catch (error) {
      console.error('Error during fetching latest tag:', error.message)
      jobError(job.jobId, `Failed to fetch latest tag: ${error.message}`)
      return null
    }

    // Create a new tag
    try {
      job.message = `Creating new tag ${newTag}...`
      await this.callApi(session, `api/v4/projects/${projectId}/repository/tags`, 'POST', {
        tag_name: newTag,
        ref: 'main',
        message: 'Publication from Silex',
      })
    } catch (error) {
      console.error('Error during creating new tag:', error.message)
      jobError(job.jobId, `Failed to create new tag: ${error.message}`)
      return null
    }
    // return new tag
    return newTag
  }

}
