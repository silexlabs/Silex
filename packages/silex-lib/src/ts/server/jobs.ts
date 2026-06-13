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

import { JobData, JobStatus, JobId } from '../types'

// Delay after which the job is deleted from memory
const TIME_TO_KEEP_AFTER_STOP = 60*10*1000 // 10 min

// Store the jobs in memory
const jobs = new Array<JobData>()
const timers = new WeakMap<JobData, NodeJS.Timeout>()

// Key which will change on server restart
const processKey = Math.ceil(Math.random() * 1000000)

// Next id for the next job
let nextJobId = 0

// Create a new job
export function startJob(message = ''): JobData {
  const jobId = `${processKey}_${++nextJobId}`
  const job: JobData = {
    jobId,
    status: JobStatus.IN_PROGRESS,
    message: message
  }
  jobs.push(job)
  return job
}

// Retriev a job if it exists
export function getJob(id: JobId): JobData | undefined {
  return jobs.find(job => job.jobId === id)
}


// End the job with success
export function jobSuccess(id: JobId, message = ''): boolean {
  return end(id, JobStatus.SUCCESS, message)
}

// End the job with error
export function jobError(id: JobId, message = ''): boolean {
  return end(id, JobStatus.ERROR, message)
}

// Remove a job from memory
// This is also used in unit tests to avoid memory lea
export function killJob(job: JobData) {
  clearTimeout(timers.get(job))
  timers.delete(job)
  jobs.splice(jobs.findIndex(j => job.jobId === j.jobId), 1)
}

// End the job
function end(id: JobId, status: JobStatus, message = ''): boolean {
  const job = getJob(id)
  if(job) {
    job.status = status
    if(message) job.message = message
    timers.set(job, setTimeout(() => killJob(job), TIME_TO_KEEP_AFTER_STOP))
    return true
  }
  return false
}

// Type definition of the job manager
export interface JobManager {
  startJob: typeof startJob
  jobSuccess: typeof jobSuccess
  jobError: typeof jobError
}

// Export the job manager
export const jobManager: JobManager = { startJob, jobSuccess, jobError }
