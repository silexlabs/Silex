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

import { JobData, JobStatus } from '../types'
import { startJob, jobSuccess, jobError, getJob, killJob } from './jobs'

let job: JobData | undefined
afterEach(() => {
  // Avoid memory leak
  if(job) killJob(job)
})

describe('Job Module', () => {
  it('should start a job', () => {
    const {jobId} = startJob('Test job')
    job = getJob(jobId)
    expect(job).not.toBeNull()
    if (job) {
      expect(job.jobId).toEqual(jobId)
      expect(job.status).toEqual(JobStatus.IN_PROGRESS)
      expect(job.message).toEqual('Test job')
      killJob(job)
      expect(getJob(jobId)).toBeUndefined()
    }
  })

  it('should end a job with success', () => {
    const {jobId} = startJob('Test job')
    const result = jobSuccess(jobId, 'Job completed successfully')
    expect(result).toBeTruthy()
    job = getJob(jobId)
    expect(job).not.toBeNull()
    if (job) {
      expect(job.status).toEqual(JobStatus.SUCCESS)
      expect(job.message).toEqual('Job completed successfully')
    }
  })

  it('should end a job with error', () => {
    const {jobId} = startJob('Test job')
    const result = jobError(jobId, 'Job ended with error')
    expect(result).toBeTruthy()
    job = getJob(jobId)
    expect(job).not.toBeNull()
    if (job) {
      expect(job.status).toEqual(JobStatus.ERROR)
      expect(job.message).toEqual('Job ended with error')
    }
  })

  it('should not find a job after ending', done => {
    const {jobId} = startJob('Test job')
    jobSuccess(jobId, 'Job completed successfully')
    setTimeout(() => {
      job = getJob(jobId)
      expect(job).not.toBeUndefined()
      done()
    }, 1000)
  })
})
