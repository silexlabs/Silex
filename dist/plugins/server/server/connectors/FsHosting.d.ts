import { ConnectorFile, HostingConnector, ConnectorSession } from './connectors';
import { FsStorage } from './FsStorage';
import { ConnectorType, JobData, WebsiteId } from '../../types';
import { JobManager } from '../jobs';
type FsSession = ConnectorSession;
export declare class FsHosting extends FsStorage implements HostingConnector<FsSession> {
    connectorId: string;
    displayName: string;
    connectorType: ConnectorType;
    protected initFs(): Promise<void>;
    publish(session: FsSession, id: WebsiteId, files: ConnectorFile[], { startJob, jobSuccess, jobError }: JobManager): Promise<JobData>;
    getUrl(session: FsSession, id: WebsiteId): Promise<string>;
}
export {};
