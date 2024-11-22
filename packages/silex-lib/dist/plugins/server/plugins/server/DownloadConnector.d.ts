import { ConnectorOptions, ConnectorType, ConnectorUser, JobData, PublicationJobData, WebsiteId } from '../../types';
import { ConnectorFile, ConnectorSession, HostingConnector } from '../../server/connectors/connectors';
import { JobManager } from '../../server/jobs';
import { ServerConfig } from '../../server/config';
type DownloadConnectorSession = ConnectorSession;
type DownloadConnectorOptions = object;
export default class implements HostingConnector<DownloadConnectorSession> {
    connectorId: string;
    displayName: string;
    icon: string;
    disableLogout: boolean;
    options: DownloadConnectorOptions;
    connectorType: ConnectorType;
    color: string;
    background: string;
    constructor(config: ServerConfig);
    getOptions(formData: object): ConnectorOptions;
    getOAuthUrl(session: DownloadConnectorSession): Promise<null>;
    getLoginForm(session: DownloadConnectorSession, redirectTo: string): Promise<string | null>;
    getSettingsForm(session: DownloadConnectorSession, redirectTo: string): Promise<string | null>;
    isLoggedIn(session: DownloadConnectorSession): Promise<boolean>;
    setToken(session: DownloadConnectorSession, query: object): Promise<void>;
    logout(session: DownloadConnectorSession): Promise<void>;
    getUser(session: DownloadConnectorSession): Promise<ConnectorUser | null>;
    publish(session: DownloadConnectorSession, websiteId: WebsiteId, files: ConnectorFile[], jobManager: JobManager): Promise<JobData>;
    startPublishingInBackground(session: DownloadConnectorSession, websiteId: WebsiteId, files: ConnectorFile[], job: PublicationJobData): Promise<void>;
    getUrl(session: DownloadConnectorSession, websiteId: WebsiteId): Promise<string>;
}
export {};
