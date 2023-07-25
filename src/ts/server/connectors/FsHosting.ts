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

import { ConnectorFile, StorageConnector, HostingConnector, StatusCallback, ConnectorSession, contentToString, toConnectorData, ConnectorFileContent} from './connectors'
import { join } from 'path'
import { FsStorage } from './FsStorage'
import { ConnectorType, JobData, JobStatus, PublicationJobData, WebsiteId } from '../../types'
import { JobManager } from '../jobs'

type FsSession = ConnectorSession

interface FsOptions {
  path?: string
}

export class FsHosting extends FsStorage implements HostingConnector<FsSession> {
  connectorId = 'fs-hosting'
  displayName = 'File system hosting'
  icon = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%202L6%2022%2018%2022%2018%207%2012%202%206%202Z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M18%202L12%202%2012%208%2018%208%2018%202Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E'
  connectorType = ConnectorType.HOSTING

  async publish(session: FsSession, id: WebsiteId, files: ConnectorFile[], {startJob, jobSuccess, jobError}: JobManager): Promise<JobData> {
    const job = startJob(`Publishing to ${this.displayName}`) as PublicationJobData
    job.logs = [[`Publishing to ${this.displayName}`]]
    job.errors = [[]]
    this.write(session, id, files, '', async ({status, message}) => {
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
