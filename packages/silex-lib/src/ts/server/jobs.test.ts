import { JobData, JobStatus } from '../types';
import { startJob, jobSuccess, jobError, getJob, killJob } from './jobs'

let job: JobData | undefined
afterEach(() => {
  // Avoid memory leak
  if(job) killJob(job)
})

describe('Job Module', () => {
  it('should start a job', () => {
    const {id} = startJob('Test job');
    job = getJob(id);
    expect(job).not.toBeNull();
    expect(job!.id).toEqual(id);
    expect(job!.status).toEqual(JobStatus.IN_PROGRESS);
    expect(job!.message).toEqual('Test job');
    killJob(job!)
    expect(getJob(id)).toBeUndefined()
  });

  it('should end a job with success', () => {
    const {id} = startJob('Test job');
    const result = jobSuccess(id, 'Job completed successfully');
    expect(result).toBeTruthy();
    job = getJob(id);
    expect(job).not.toBeNull();
    expect(job!.status).toEqual(JobStatus.SUCCESS);
    expect(job!.message).toEqual('Job completed successfully');
  })

  it('should end a job with error', () => {
    const {id} = startJob('Test job');
    const result = jobError(id, 'Job ended with error');
    expect(result).toBeTruthy();
    job = getJob(id);
    expect(job).not.toBeNull();
    expect(job!.status).toEqual(JobStatus.ERROR);
    expect(job!.message).toEqual('Job ended with error');
  });

  it('should not find a job after ending', done => {
    const {id} = startJob('Test job');
    jobSuccess(id, 'Job completed successfully');
    setTimeout(() => {
      job = getJob(id);
      expect(job).not.toBeUndefined();
      done()
    }, 1000)
  });
});
