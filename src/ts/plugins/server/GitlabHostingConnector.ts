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

export default class GitlabHostingConnector extends GitlabConnector implements HostingConnector {

  displayName = 'Gitlab hosting'
  connectorType = ConnectorType.HOSTING

  constructor( config: ServerConfig, opts: Partial<GitlabOptions>) {
    super (config, opts)
    /* public directory for standard gitlab pages */
    this.options.assetsFolder= 'public'
  }

  async publish(session: GitlabSession, websiteId: WebsiteId, files: ConnectorFile[], {startJob, jobSuccess, jobError}: JobManager): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    /* Configuration file .gitlab-ci.yml contains template for plain html Gitlab pages*/
    const pathYml = '.gitlab-ci.yml'
    const contentYml = `image: busybox
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
        - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    `
    try {
      await this.readFile(session, websiteId, pathYml)
    } catch (e) {
      // If the file .gitlab-ci.yml does not exist, create it, otherwise do nothing (do not overwriting existing one)
      if (e.statusCode === 404 || e.httpStatusCode === 404 || e.message.endsWith('A file with this name doesn\'t exist')) {
        await this.createFile(session, websiteId, pathYml, contentYml)
      }
    }

    /* publishing all files for website*/
    await this.writeAssets(session, websiteId, files, async ({status, message}) => {
      // Update the job status
      job.status = status
      job.message = message
      job.logs[0].push(message)
      if(status === JobStatus.SUCCESS) {
        const gitlabUrl = await this.getUrl(session, websiteId)
        job.message = gitlabUrl
        job.logs[0].push(gitlabUrl)
        jobSuccess(job.jobId, 'Gitlab pages PUBLISHED: ' + '<a href="' + gitlabUrl + '" target="_blank">' + gitlabUrl + '</a>')
      } else if(status === JobStatus.ERROR) {
        job.errors[0].push(message)
        jobError(job.jobId, message)
      }
    })
    return job
  }

  /* Get and return Url Gitlab Pages */
  async getUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string> {
    const response = await this.callApi(session, `api/v4/projects/${websiteId}/pages`, 'GET')
    return response.url
  }
}
