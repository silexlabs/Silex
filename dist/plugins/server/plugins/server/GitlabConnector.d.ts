import { ServerConfig } from '../../server/config';
import { ConnectorFile, ConnectorFileContent, StatusCallback, StorageConnector } from '../../server/connectors/connectors';
import { ConnectorType, ConnectorUser, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent } from '../../types';
/**
 * Gitlab connector
 * @fileoverview Gitlab connector for Silex, connect to the user's Gitlab account to store websites
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 */
export interface GitlabOptions {
    clientId: string;
    clientSecret: string;
    branch: string;
    assetsFolder: string;
    repoPrefix: string;
    scope: string;
    domain: string;
    timeOut: number;
}
export interface GitlabToken {
    state?: string;
    codeVerifier?: string;
    codeChallenge?: string;
    token?: {
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
        created_at: number;
        id_token: string;
        scope: string;
    };
    userId?: number;
    username?: string;
}
export type GitlabSession = Record<string, GitlabToken>;
interface GitlabAction {
    action: 'create' | 'delete' | 'move' | 'update' | 'cherry-pick';
    file_path?: string;
    content?: string;
    commit_id?: string;
}
interface GitlabWriteFile {
    branch: string;
    commit_message: string;
    id?: string;
    actions?: GitlabAction[];
    content?: string;
    file_path?: string;
    encoding?: 'base64' | 'text';
}
interface GitlabGetToken {
    grant_type: 'authorization_code';
    client_id: string;
    client_secret: string;
    code: string;
    redirect_uri: string;
    code_verifier: string;
}
interface GitlabWebsiteName {
    name: string;
}
interface GitlabCreateBranch {
    branch: string;
    ref: string;
}
interface GitlabGetTags {
    per_page?: number;
}
interface GitlabCreateTag {
    tag_name: string;
    ref: string;
    message: string;
}
interface GitlabFetchCommits {
    ref_name: string;
    since: string;
}
export default class GitlabConnector implements StorageConnector {
    private config;
    connectorId: string;
    connectorType: ConnectorType;
    displayName: string;
    icon: string;
    disableLogout: boolean;
    color: string;
    background: string;
    options: GitlabOptions;
    constructor(config: ServerConfig, opts: Partial<GitlabOptions>);
    private getAssetPath;
    isUsingOfficialInstance(): boolean;
    createFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64?: boolean): Promise<void>;
    updateFile(session: GitlabSession, websiteId: WebsiteId, path: string, content: string, isBase64?: boolean): Promise<void>;
    readFile(session: GitlabSession, websiteId: string, fileName: string): Promise<Buffer>;
    /**
     * Call the Gitlab API with the user's token and handle errors
     */
    callApi(session: GitlabSession, path: string, method?: 'POST' | 'GET' | 'PUT' | 'DELETE', body?: GitlabWriteFile | GitlabGetToken | GitlabWebsiteName | GitlabCreateBranch | GitlabGetTags | GitlabCreateTag | GitlabFetchCommits | null, params?: any): Promise<any>;
    private generateCodeVerifier;
    private generateCodeChallenge;
    private getRedirect;
    /**
     * Get the OAuth URL to redirect the user to
     * The URL should look like
     * https://gitlab.example.com/oauth/authorize?client_id=APP_ID&redirect_uri=REDIRECT_URI&response_type=code&state=STATE&scope=REQUESTED_SCOPES&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
     * OAuth2 Step #1 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
     */
    getOAuthUrl(session: GitlabSession): Promise<string>;
    getSessionToken(session: GitlabSession | undefined): GitlabToken;
    setSessionToken(session: GitlabSession, token: GitlabToken): void;
    resetSessionToken(session: GitlabSession): void;
    getOptions(formData: object): object;
    getLoginForm(session: GitlabSession, redirectTo: string): Promise<null>;
    getSettingsForm(session: GitlabSession, redirectTo: string): Promise<null>;
    isLoggedIn(session: GitlabSession): Promise<boolean>;
    /**
     * Get the token from return code
     * Set the token in the session
     * OAuth2 Step #2 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
     */
    setToken(session: GitlabSession, loginResult: any): Promise<void>;
    logout(session: GitlabSession): Promise<void>;
    getUser(session: GitlabSession): Promise<ConnectorUser>;
    listWebsites(session: GitlabSession): Promise<WebsiteMeta[]>;
    readWebsite(session: GitlabSession, websiteId: string): Promise<WebsiteData>;
    createWebsite(session: GitlabSession, websiteMeta: WebsiteMetaFileContent): Promise<WebsiteId>;
    updateWebsite(session: GitlabSession, websiteId: WebsiteId, websiteData: WebsiteData): Promise<void>;
    deleteWebsite(session: GitlabSession, websiteId: WebsiteId): Promise<void>;
    duplicateWebsite(session: GitlabSession, websiteId: string): Promise<void>;
    getWebsiteMeta(session: GitlabSession, websiteId: WebsiteId): Promise<WebsiteMeta>;
    setWebsiteMeta(session: GitlabSession, websiteId: WebsiteId, websiteMeta: WebsiteMetaFileContent): Promise<void>;
    writeAssets(session: GitlabSession, websiteId: string, files: ConnectorFile[], status?: StatusCallback | undefined): Promise<void>;
    readAsset(session: GitlabSession, websiteId: string, fileName: string): Promise<ConnectorFileContent>;
    deleteAssets(session: GitlabSession, websiteId: string, fileNames: string[]): Promise<void>;
}
export {};
