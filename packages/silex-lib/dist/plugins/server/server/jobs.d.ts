import { JobData, JobId } from '../types';
export declare function startJob(message?: string): JobData;
export declare function getJob(id: JobId): JobData | undefined;
export declare function jobSuccess(id: JobId, message?: string): boolean;
export declare function jobError(id: JobId, message?: string): boolean;
export declare function killJob(job: JobData): void;
export interface JobManager {
    startJob: typeof startJob;
    jobSuccess: typeof jobSuccess;
    jobError: typeof jobError;
}
export declare const jobManager: JobManager;
