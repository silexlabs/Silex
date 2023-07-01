import { JobData, JobStatus, JobId } from '../types'

// Delay after which the job is deleted from memory
const TIME_TO_KEEP_AFTER_STOP = 60*10*1000 // 10 min

// Store the jobs in memory
const jobs = new Array<JobData>()

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
  clearTimeout(job._timeout)
  jobs.splice(jobs.findIndex(j => job.jobId === j.jobId), 1)
}

// End the job
function end(id: JobId, status: JobStatus, message = ''): boolean {
  const job = getJob(id)
  if(job) {
    job.status = status
    if(message) job.message = message
    job._timeout = setTimeout(() => killJob(job), TIME_TO_KEEP_AFTER_STOP)
    return true
  }
  return false
}
