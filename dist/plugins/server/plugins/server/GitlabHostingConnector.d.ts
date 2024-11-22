import GitlabConnector, { GitlabOptions, GitlabSession } from './GitlabConnector';
import { HostingConnector, ConnectorFile } from '../../server/connectors/connectors';
import { ConnectorType, WebsiteId, JobData, PublicationJobData } from '../../types';
import { JobManager } from '../../server/jobs';
import { ServerConfig } from '../../server/config';
export default class GitlabHostingConnector extends GitlabConnector implements HostingConnector {
    displayName: string;
    connectorType: ConnectorType;
    constructor(config: ServerConfig, opts: Partial<GitlabOptions>);
    publish(session: GitlabSession, websiteId: WebsiteId, files: ConnectorFile[], { startJob, jobSuccess, jobError }: JobManager): Promise<JobData>;
    getUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string>;
    getAdminUrl(session: GitlabSession, websiteId: WebsiteId): Promise<string>;
    getPageUrl(session: GitlabSession, websiteId: WebsiteId, projectUrl: string): Promise<string>;
    getGitlabJobLogsUrl(session: GitlabSession, websiteId: WebsiteId, job: PublicationJobData, { startJob, jobSuccess, jobError }: JobManager, projectUrl: string, tag: any): Promise<string | null>;
    createTag(session: GitlabSession, websiteId: WebsiteId, job: PublicationJobData, { startJob, jobSuccess, jobError }: JobManager): Promise<string | null>;
}
