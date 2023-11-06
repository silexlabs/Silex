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

import fs from 'fs/promises'
import { ConnectorFile, StorageConnector, HostingConnector, StatusCallback, ConnectorSession, contentToString, toConnectorData, ConnectorFileContent} from './connectors'
import { join } from 'path'
import { FsStorage } from './FsStorage'
import { ConnectorType, JobData, JobStatus, PublicationJobData, WebsiteId } from '../../types'
import { JobManager } from '../jobs'

type FsSession = ConnectorSession

export class FsHosting extends FsStorage implements HostingConnector<FsSession> {
  connectorId = 'fs-hosting'
  displayName = 'File system hosting'
  connectorType = ConnectorType.HOSTING

  protected async initFs() {
    const stat = await fs.stat(this.options.path).catch(() => null)
    if (!stat) {
      await fs.mkdir(join(this.options.path, 'assets'), { recursive: true })
      await fs.mkdir(join(this.options.path, 'css'), { recursive: true })
      console.info(`> [FsHosting] Created folders assets/ and css/ in ${this.options.path}`)
    }
  }

  async publish(session: FsSession, id: WebsiteId, files: ConnectorFile[], {startJob, jobSuccess, jobError}: JobManager): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    // Call write without id or folder so that it goes in / (path will be modified by publication transformers)
    await this.write(session, '', files, '', async ({status, message}) => {
      // Update the job status
      job.status = status
      job.message = message
      job.logs[0].push(message)
      if(status === JobStatus.SUCCESS) {
        jobSuccess(job.jobId, message)
      } else if(status === JobStatus.ERROR) {
        job.errors[0].push(message)
        jobError(job.jobId, message)
      }
    })
    return job
  }

  async getUrl(session: FsSession, id: WebsiteId): Promise<string> {
    const filePath = join(this.options.path, id, 'index.html')
    const fileUrl = new URL(filePath, 'file://')
    return fileUrl.toString()
  }
}
