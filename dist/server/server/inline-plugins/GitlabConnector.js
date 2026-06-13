"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeGitBlobSha = computeGitBlobSha;
const constants_1 = require("../../common/constants");
const connectors_1 = require("../connectors/connectors");
const types_1 = require("../../common/types");
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importStar(require("crypto"));
const path_1 = require("path");
const https_1 = require("https");
const websiteDataSerialization_1 = require("../utils/websiteDataSerialization");
const MAX_BATCH_UPLOAD_SIZE = 100;
const MAX_BODY_SIZE_KB = 8 * 1000 * 1024;
const WEBSITE_DATA_FILE_FORMAT_VERSION = '1.0.0';
const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="1000"
   height="963.197"
   viewBox="0 0 1000 963.197"
   version="1.1"
   id="svg85">
  <sodipodi:namedview
     id="namedview87"
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1.0"
     inkscape:pageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="0"
     showgrid="false"
     inkscape:zoom="1"
     inkscape:cx="991.5"
     inkscape:cy="964.5"
     inkscape:window-width="1126"
     inkscape:window-height="895"
     inkscape:window-x="774"
     inkscape:window-y="12"
     inkscape:window-maximized="0"
     inkscape:current-layer="svg85" />
  <defs
     id="defs74">
    <style
       id="style72">.cls-1{fill:#e24329;}.cls-2{fill:#fc6d26;}.cls-3{fill:#fca326;}</style>
  </defs>
  <g
     id="LOGO"
     transform="matrix(5.2068817,0,0,5.2068817,-489.30756,-507.76085)">
    <path
       class="cls-1"
       d="m 282.83,170.73 -0.27,-0.69 -26.14,-68.22 a 6.81,6.81 0 0 0 -2.69,-3.24 7,7 0 0 0 -8,0.43 7,7 0 0 0 -2.32,3.52 l -17.65,54 h -71.47 l -17.65,-54 a 6.86,6.86 0 0 0 -2.32,-3.53 7,7 0 0 0 -8,-0.43 6.87,6.87 0 0 0 -2.69,3.24 L 97.44,170 l -0.26,0.69 a 48.54,48.54 0 0 0 16.1,56.1 l 0.09,0.07 0.24,0.17 39.82,29.82 19.7,14.91 12,9.06 a 8.07,8.07 0 0 0 9.76,0 l 12,-9.06 19.7,-14.91 40.06,-30 0.1,-0.08 a 48.56,48.56 0 0 0 16.08,-56.04 z"
       id="path76" />
    <path
       class="cls-2"
       d="m 282.83,170.73 -0.27,-0.69 a 88.3,88.3 0 0 0 -35.15,15.8 L 190,229.25 c 19.55,14.79 36.57,27.64 36.57,27.64 l 40.06,-30 0.1,-0.08 a 48.56,48.56 0 0 0 16.1,-56.08 z"
       id="path78" />
    <path
       class="cls-3"
       d="m 153.43,256.89 19.7,14.91 12,9.06 a 8.07,8.07 0 0 0 9.76,0 l 12,-9.06 19.7,-14.91 c 0,0 -17.04,-12.89 -36.59,-27.64 -19.55,14.75 -36.57,27.64 -36.57,27.64 z"
       id="path80" />
    <path
       class="cls-2"
       d="M 132.58,185.84 A 88.19,88.19 0 0 0 97.44,170 l -0.26,0.69 a 48.54,48.54 0 0 0 16.1,56.1 l 0.09,0.07 0.24,0.17 39.82,29.82 c 0,0 17,-12.85 36.57,-27.64 z"
       id="path82" />
  </g>
</svg>`;
const encodedSvg = encodeURIComponent(svg);
const ICON = '/assets/gitlab.png';
function computeGitBlobSha(content, binary) {
    const contentBuffer = binary
        ? Buffer.from(content, 'base64')
        : Buffer.from(content, 'utf8');
    const header = `blob ${contentBuffer.length}\0`;
    const full = Buffer.concat([Buffer.from(header), contentBuffer]);
    return crypto_1.default.createHash('sha1').update(full).digest('hex');
}
function sanitizeGitlabPath(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/^[-_.]+/, '')
        .replace(/[-_.]+$/, '')
        .replace(/\.git$|\.atom$/i, '')
        .toLowerCase();
}
class GitlabConnector {
    config;
    connectorId = 'gitlab';
    connectorType = types_1.ConnectorType.STORAGE;
    displayName = 'GitLab';
    icon = ICON;
    disableLogout = false;
    color = '#2B1B63';
    background = 'rgba(252, 109, 38, 0.2)';
    options;
    constructor(config, opts) {
        this.config = config;
        this.options = {
            branch: 'main',
            assetsFolder: 'assets',
            repoPrefix: 'silex_',
            scope: 'api',
            ...opts,
        };
        if (!this.options.clientId)
            throw new Error('Missing Gitlab client ID');
        if (!this.options.clientSecret)
            throw new Error('Missing Gitlab client secret');
        if (!this.options.domain)
            throw new Error('Missing Gitlab domain');
        if (!this.options.timeOut)
            this.options.timeOut = 15000;
    }
    getAssetPath(path, encode = true) {
        const resolvedPath = (0, path_1.join)(this.options.assetsFolder, path);
        if (encode)
            return encodeURIComponent(resolvedPath);
        return resolvedPath;
    }
    isUsingOfficialInstance() {
        const gitlabDomainRegexp = /(^|\b)(gitlab\.com)($|\b)/;
        return gitlabDomainRegexp.test(this.options.domain);
    }
    async createFile(session, websiteId, path, content, isBase64 = false) {
        const safePath = path.replace(/^\//, '');
        const encodePath = decodeURIComponent(path);
        return this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/repository/files/${safePath}`,
            method: 'POST',
            requestBody: {
                id: websiteId,
                branch: this.options.branch,
                content,
                commit_message: `Create file ${encodePath} from Silex`,
                encoding: isBase64 ? 'base64' : undefined,
            }
        });
    }
    async updateFile(session, websiteId, path, content, isBase64 = false) {
        const safePath = path.replace(/^\//, '');
        const encodePath = decodeURIComponent(path);
        return this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/repository/files/${safePath}`,
            method: 'PUT',
            requestBody: {
                id: websiteId,
                branch: this.options.branch,
                content: await (0, connectors_1.contentToString)(content),
                commit_message: `Update website asset ${encodePath} from Silex`,
                encoding: isBase64 ? 'base64' : undefined,
            }
        });
    }
    async readFile(session, websiteId, fileName) {
        const safePath = fileName.replace(/^\//, '');
        return this.downloadRawFile(session, websiteId, safePath);
    }
    async callApi({ session, path, method = 'GET', requestBody = null, params = {}, responseHeaders = {}, }) {
        const token = this.getSessionToken(session).token;
        const tokenParam = token ? `access_token=${token.access_token}&` : '';
        const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v.toString())}`).join('&');
        const url = `${this.options.domain}/${path}?${tokenParam}${paramsStr}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (method === 'GET' && requestBody) {
            console.error('[GitlabConnector] Invalid GET request: GET requests should not have a body', { url, method, body: requestBody, params });
        }
        let response;
        const body = requestBody ? JSON.stringify(requestBody) : undefined;
        try {
            if (body && Buffer.byteLength(body) > MAX_BODY_SIZE_KB * 1024) {
                console.warn('[GitlabConnector] Request body size exceeds Gitlab API limit', {
                    size: Buffer.byteLength(body),
                    maxAllowed: MAX_BODY_SIZE_KB * 1024,
                    url,
                    method,
                    params,
                    session,
                });
            }
            response = await this.fetchWithRetry(url, requestBody && method !== 'GET' ? {
                agent: this.getAgent(),
                method,
                headers,
                body,
            } : {
                agent: this.getAgent(),
                method,
                headers,
            });
        }
        catch (e) {
            console.error('[GitlabConnector] Failed to reach Gitlab API endpoint', {
                error: e,
                url,
                method,
                body: requestBody,
                params,
                session,
                stack: e?.stack || new Error().stack,
            });
            throw new types_1.ApiError(`Could not reach Gitlab API: ${e.message || e}`, 500);
        }
        response.headers.forEach((value, name) => responseHeaders[name] = value);
        const text = await async function () {
            try {
                return await response.text();
            }
            catch (e) {
                console.error('[GitlabConnector] Failed to read response body from Gitlab API', {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    method,
                    body: requestBody,
                    params,
                    error: e
                });
                throw new types_1.ApiError(`Gitlab API: Could not read response body (${e.message})`, 500);
            }
        }();
        if (!response.ok) {
            console.error('[GitlabConnector] Gitlab API responded with error status', {
                status: response.status,
                statusText: response.statusText,
                url,
                method,
                body: requestBody,
                params,
                responseText: text
            });
            if (text.includes('A file with this name doesn\'t exist')) {
                throw new types_1.ApiError('Gitlab API: File not found', 404);
            }
            else if (response.status === 401 && this.getSessionToken(session).token?.refresh_token) {
                const token = this.getSessionToken(session).token;
                const body = {
                    grant_type: 'refresh_token',
                    refresh_token: token?.refresh_token,
                    client_id: this.options.clientId,
                    client_secret: this.options.clientSecret,
                };
                const response = await (0, node_fetch_1.default)(this.options.domain + '/oauth/token', {
                    agent: this.getAgent(),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body)
                });
                const refreshJson = await response.json();
                if (response.ok) {
                    this.setSessionToken(session, {
                        token: {
                            ...token,
                            ...refreshJson,
                        },
                    });
                    return await this.callApi({
                        session,
                        path,
                        method,
                        requestBody: body,
                        params,
                        responseHeaders,
                    });
                }
                else {
                    const message = typeof refreshJson?.message === 'object' ? Object.entries(refreshJson.message).map(entry => entry.join(' ')).join(' ') : refreshJson?.message ?? refreshJson?.error ?? response.statusText;
                    console.error('[GitlabConnector] Failed to refresh Gitlab OAuth token', {
                        status: response.status,
                        statusText: response.statusText,
                        message,
                        refresh_token: token?.refresh_token
                    });
                    this.logout(session);
                    throw new types_1.ApiError(`Gitlab API: Could not refresh token (${message})`, response.status);
                }
            }
            else {
                const message = response.statusText;
                console.error('[GitlabConnector] Unhandled Gitlab API error response', {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    method,
                    body: requestBody,
                    params,
                    responseText: text,
                    message
                });
                throw new types_1.ApiError(`Gitlab API error: ${message} (${text})`, response.status);
            }
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (response.ok && !contentType.includes('application/json')) {
            return text;
        }
        let json;
        try {
            json = JSON.parse(text);
        }
        catch (e) {
            if (!response.ok) {
                throw e;
            }
            console.error('[GitlabConnector] Response from Gitlab API is not valid JSON', {
                statusText: response.statusText,
                url,
                method,
                body: requestBody,
                params,
                responseText: text,
                error: e,
                session,
                stack: e?.stack || new Error().stack,
            });
            return text;
        }
        return json;
    }
    async downloadRawFile(session, projectId, filePath) {
        const token = this.getSessionToken(session).token?.access_token;
        const domain = this.options.domain;
        const branch = this.options.branch;
        const rawUrl = `${domain}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${branch}&access_token=${token}`;
        const fileRes = await this.fetchWithRetry(rawUrl, {
            agent: this.getAgent(),
        });
        const contentType = fileRes.headers.get('content-type');
        if (contentType?.includes('text/html')) {
            const html = await fileRes.text();
            throw new types_1.ApiError('GitLab returned HTML instead of file (unauthorized or not found).', 401);
        }
        if (!fileRes.ok) {
            const errText = await fileRes.text();
            if (errText.includes('not found') || fileRes.status === 404) {
                console.error('[GitlabConnector] GitLab raw file not found', {
                    status: fileRes.status,
                    statusText: fileRes.statusText,
                    url: rawUrl,
                    responseText: errText
                });
                throw new types_1.ApiError(`GitLab raw file not found: filePath="${filePath}" (status ${fileRes.status})`, 404);
            }
            console.error('[GitlabConnector] Failed to fetch raw file from GitLab', {
                filePath,
                url: rawUrl,
                status: fileRes.status,
                statusText: fileRes.statusText,
                responseText: errText
            });
            throw new types_1.ApiError(`Failed to fetch raw file from GitLab: filePath="${filePath}" - ${fileRes.statusText} (${errText})`, fileRes.status);
        }
        try {
            const buffer = await fileRes.buffer();
            return buffer;
        }
        catch (e) {
            console.error('[GitlabConnector] Error reading binary content from GitLab raw file', e);
            throw new types_1.ApiError('Failed to read binary content from GitLab raw file', 500);
        }
    }
    generateCodeVerifier() {
        return crypto_1.default.randomBytes(64).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
            .substr(0, 128);
    }
    async generateCodeChallenge(verifier) {
        const hashed = (0, crypto_1.createHash)('sha256').update(verifier).digest();
        let base64Url = hashed.toString('base64');
        base64Url = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        return base64Url;
    }
    getRedirect() {
        const params = `connectorId=${this.connectorId}&type=${this.connectorType}`;
        return `${this.config.url}${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_LOGIN_CALLBACK}?${params}`;
    }
    getAgent() {
        if (this.config.url.startsWith('http://localhost')) {
            return new https_1.Agent({
                family: 4,
            });
        }
        return undefined;
    }
    async fetchWithRetry(url, init = {}, maxRetries = 3) {
        let response;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            response = await (0, node_fetch_1.default)(url, init);
            if (response.status < 500 || attempt === maxRetries)
                return response;
            try {
                await response.text();
            }
            catch { }
            const backoffMs = Math.min(8000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500);
            console.warn(`[GitlabConnector] GitLab returned ${response.status} on ${url.split('?')[0]}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
        return response;
    }
    async getOAuthUrl(session) {
        const redirect_uri = encodeURIComponent(this.getRedirect());
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        this.setSessionToken(session, {
            ...this.getSessionToken(session),
            state,
            codeVerifier,
            codeChallenge,
        });
        return `${this.options.domain}/oauth/authorize?client_id=${this.options.clientId}&redirect_uri=${redirect_uri}&response_type=code&state=${this.getSessionToken(session).state}&scope=${this.options.scope}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }
    getSessionToken(session) {
        return (session ?? {})[this.connectorId] ?? {};
    }
    setSessionToken(session, token) {
        session[this.connectorId] = token;
    }
    resetSessionToken(session) {
        delete session[this.connectorId];
    }
    getOptions(formData) {
        return {};
    }
    async getLoginForm(session, redirectTo) {
        return null;
    }
    async getSettingsForm(session, redirectTo) {
        return null;
    }
    async isLoggedIn(session) {
        return !!this.getSessionToken(session).token;
    }
    async setToken(session, loginResult) {
        const sessionToken = this.getSessionToken(session);
        let receivedState = loginResult.state;
        try {
            const parsed = JSON.parse(loginResult.state);
            if (parsed.state) {
                receivedState = parsed.state;
            }
        }
        catch {
        }
        if (!receivedState || receivedState !== sessionToken?.state) {
            this.logout(session);
            throw new types_1.ApiError('Invalid state', 401);
        }
        if (!sessionToken?.codeVerifier) {
            this.logout(session);
            throw new types_1.ApiError('Missing code verifier', 401);
        }
        if (!sessionToken?.codeChallenge) {
            this.logout(session);
            throw new types_1.ApiError('Missing code challenge', 401);
        }
        const response = await (0, node_fetch_1.default)(this.options.domain + '/oauth/token', {
            agent: this.getAgent(),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: this.options.clientId,
                client_secret: this.options.clientSecret,
                code: loginResult.code,
                grant_type: 'authorization_code',
                redirect_uri: this.getRedirect(),
                code_verifier: sessionToken.codeVerifier,
            }),
        });
        const token = await response.json();
        this.setSessionToken(session, {
            ...this.getSessionToken(session),
            token,
        });
        const user = await this.callApi({
            session,
            path: 'api/v4/user'
        });
        this.setSessionToken(session, {
            ...this.getSessionToken(session),
            userId: user.id,
            username: user.username,
        });
    }
    async logout(session) {
        this.resetSessionToken(session);
    }
    async getUser(session) {
        const user = await this.callApi({
            session,
            path: 'api/v4/user'
        });
        return {
            name: user.name,
            email: user.email,
            picture: user.avatar_url,
            storage: await (0, connectors_1.toConnectorData)(session, this),
        };
    }
    async listWebsites(session) {
        const userId = this.getSessionToken(session).userId;
        if (!userId) {
            this.logout(session);
            throw new types_1.ApiError('Missing Gitlab user ID. User not logged in?', 401);
        }
        let page = 1;
        let totalPages = 1;
        const projects = [];
        do {
            const responseHeaders = {};
            const pageProjects = await this.callApi({
                session,
                path: `api/v4/users/${userId}/projects`,
                params: {
                    per_page: 100,
                    page,
                },
                responseHeaders,
            });
            projects.push(...pageProjects);
            page++;
            const total = responseHeaders['x-total-pages'];
            if (total) {
                totalPages = parseInt(total, 10);
            }
        } while (page <= totalPages);
        return projects
            .filter(p => p.name.startsWith(this.options.repoPrefix) &&
            !p.marked_for_deletion_on &&
            !p.marked_for_deletion_at)
            .map(p => ({
            websiteId: p.id,
            name: p.name.replace(this.options.repoPrefix, ''),
            createdAt: p.created_at,
            updatedAt: p.last_activity_at,
            connectorUserSettings: {},
        }));
    }
    async readWebsite(session, websiteId) {
        const websiteDataBuf = await this.downloadRawFile(session, websiteId, constants_1.WEBSITE_DATA_FILE);
        const websiteDataContent = websiteDataBuf.toString('utf8');
        const pageLoader = async (pagePath) => {
            const pageBuffer = await this.downloadRawFile(session, websiteId, pagePath);
            return pageBuffer.toString('utf8');
        };
        return await (0, websiteDataSerialization_1.merge)(websiteDataContent, pageLoader);
    }
    async createWebsite(session, websiteMeta) {
        const project = await this.callApi({
            session,
            path: 'api/v4/projects/',
            method: 'POST',
            requestBody: {
                name: this.options.repoPrefix + websiteMeta.name,
            }
        });
        await this.createFile(session, project.id, constants_1.WEBSITE_DATA_FILE, (0, websiteDataSerialization_1.stringify)(types_1.EMPTY_WEBSITE));
        return project.id;
    }
    async updateWebsite(session, websiteId, websiteData) {
        const batchActions = [];
        let isLegacySite = !websiteData.pagesFolder;
        if (isLegacySite) {
            const rootFiles = await this.ls({
                session,
                websiteId,
                path: constants_1.WEBSITE_PAGES_FOLDER,
                recursive: false,
            });
            if (rootFiles.size) {
                isLegacySite = false;
                websiteData.pagesFolder = constants_1.WEBSITE_PAGES_FOLDER;
            }
        }
        const existingFiles = await this.ls({
            session,
            websiteId,
            path: (0, websiteDataSerialization_1.getPagesFolder)(websiteData),
            recursive: false,
        });
        if (isLegacySite) {
            websiteData.pagesFolder = constants_1.WEBSITE_PAGES_FOLDER;
        }
        const filesToWrite = (0, websiteDataSerialization_1.split)(websiteData);
        for (const file of filesToWrite) {
            const filePath = file.path;
            const content = file.content;
            const newSha = computeGitBlobSha(content, false);
            const existingSha = existingFiles.get(filePath) || (filePath === constants_1.WEBSITE_DATA_FILE ? 'always-update' : undefined);
            if (existingSha) {
                if (existingSha !== newSha) {
                    batchActions.push({
                        action: 'update',
                        file_path: filePath,
                        content,
                    });
                }
            }
            else {
                batchActions.push({
                    action: 'create',
                    file_path: filePath,
                    content,
                });
            }
        }
        const pathsToWrite = filesToWrite.map(f => f.path);
        for (const filePath of existingFiles.keys()) {
            if (!pathsToWrite.includes(filePath)) {
                batchActions.push({
                    action: 'delete',
                    file_path: filePath,
                });
            }
        }
        return this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/repository/commits`,
            method: 'POST',
            requestBody: {
                branch: this.options.branch,
                commit_message: 'Update website data from Silex',
                actions: batchActions,
            },
        });
    }
    async deleteWebsite(session, websiteId) {
        await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}`,
            method: 'DELETE',
        });
    }
    async duplicateWebsite(session, websiteId) {
        const meta = await this.getWebsiteMeta(session, websiteId);
        const forkName = `${meta.name} Copy ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).substring(2, 4)}`;
        const safePath = sanitizeGitlabPath(forkName);
        const forkedProject = await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/fork`,
            method: 'POST',
            requestBody: {
                name: this.options.repoPrefix + forkName,
                path: safePath,
                namespace: meta.namespace?.id || undefined,
            },
        });
        return forkedProject.id;
    }
    async forkWebsite(session, gitlabUrl) {
        const projectPath = gitlabUrl.trim();
        if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(projectPath)) {
            throw new types_1.ApiError('Invalid project path. Use the "username/repo" format.', 400);
        }
        const encodedPath = encodeURIComponent(projectPath);
        let sourceProject;
        try {
            sourceProject = await this.callApi({
                session,
                path: `api/v4/projects/${encodedPath}`,
                method: 'GET',
            });
        }
        catch (e) {
            if (e.httpStatusCode === 404) {
                throw new types_1.ApiError(`Project not found: ${projectPath}. Make sure the project exists and is public or you have access to it.`, 404);
            }
            throw e;
        }
        const sourceName = sourceProject.name.replace(this.options.repoPrefix, '');
        const forkName = `${sourceName} ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).substring(2, 4)}`;
        const safePath = sanitizeGitlabPath(this.options.repoPrefix + forkName);
        const forkedProject = await this.callApi({
            session,
            path: `api/v4/projects/${encodedPath}/fork`,
            method: 'POST',
            requestBody: {
                name: this.options.repoPrefix + forkName,
                path: safePath,
                visibility: 'private',
            },
        });
        const forkedProjectId = forkedProject.id.toString();
        const maxAttempts = 30;
        const pollInterval = 2000;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const project = await this.callApi({
                session,
                path: `api/v4/projects/${forkedProjectId}`,
                method: 'GET',
            });
            if (project.import_status === 'finished' || project.import_status === 'none') {
                return forkedProjectId;
            }
            if (project.import_status === 'failed') {
                throw new types_1.ApiError(`Fork failed: ${project.import_error || 'Unknown error'}`, 500);
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        return forkedProjectId;
    }
    async getWebsiteMeta(session, websiteId) {
        const project = await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}`
        });
        let pagesUrl = undefined;
        let pagesVisibility = undefined;
        let lastJob = undefined;
        try {
            const pages = await this.callApi({
                session,
                path: `api/v4/projects/${websiteId}/pages`
            });
            pagesUrl = pages.url;
            pagesVisibility = pages.access_control_level || project.visibility;
        }
        catch (e) {
        }
        try {
            const jobs = await this.callApi({
                session,
                path: `api/v4/projects/${websiteId}/jobs`,
                params: {
                    per_page: 1,
                    order_by: 'finished_at',
                    sort: 'desc'
                }
            });
            if (Array.isArray(jobs) && jobs.length > 0) {
                lastJob = {
                    date: jobs[0].finished_at || jobs[0].created_at || jobs[0].started_at,
                    status: jobs[0].status,
                    id: jobs[0].id,
                    name: jobs[0].name,
                    webUrl: jobs[0].web_url
                };
            }
        }
        catch (e) {
        }
        let forkedFrom = undefined;
        if (project.forked_from_project) {
            let license = undefined;
            try {
                const templateProject = await this.callApi({
                    session,
                    path: `api/v4/projects/${project.forked_from_project.id}`,
                    params: { license: true }
                });
                license = templateProject.license?.name || templateProject.license?.nickname || templateProject.license?.key;
            }
            catch (e) {
            }
            forkedFrom = {
                id: String(project.forked_from_project.id),
                name: project.forked_from_project.name,
                webUrl: project.forked_from_project.web_url,
                license
            };
        }
        const result = {
            websiteId,
            name: project.name.replace(this.options.repoPrefix, ''),
            imageUrl: project.avatar_url,
            createdAt: project.created_at,
            updatedAt: project.last_activity_at,
            connectorUserSettings: {},
            visibility: project.visibility,
            repoUrl: project.web_url,
            forkCount: project.forks_count,
            starCount: project.star_count,
            forkedFrom,
            pagesUrl,
            pagesVisibility,
            lastJob
        };
        console.log('META', { result, websiteId });
        return result;
    }
    async setWebsiteMeta(session, websiteId, websiteMeta) {
        const oldMeta = await this.getWebsiteMeta(session, websiteId);
        if (websiteMeta.name !== oldMeta.name) {
            await this.callApi({
                session,
                path: `api/v4/projects/${websiteId}`,
                method: 'PUT',
                requestBody: {
                    name: this.options.repoPrefix + websiteMeta.name,
                }
            });
        }
    }
    async writeAssets(session, websiteId, files, status, removeUnlisted = false) {
        status && await status({ message: `Preparing ${files.length} files`, status: types_1.JobStatus.IN_PROGRESS });
        const existingFiles = await this.ls({
            session,
            websiteId,
            recursive: true,
            path: this.options.assetsFolder,
        });
        const filesToUpload = [];
        const filesToKeep = new Set(files.map(file => this.getAssetPath(file.path, false)));
        for (const file of files) {
            const filePath = this.getAssetPath(file.path, false);
            const content = (await (0, connectors_1.contentToBuffer)(file.content)).toString('base64');
            const existingSha = existingFiles.get(filePath);
            const newSha = computeGitBlobSha(content, true);
            if (existingSha) {
                if (existingSha !== newSha) {
                    filesToUpload.push({
                        action: 'update',
                        file_path: filePath,
                        content,
                        encoding: 'base64',
                    });
                }
            }
            else {
                filesToUpload.push({
                    action: 'create',
                    file_path: filePath,
                    content,
                    encoding: 'base64',
                });
            }
        }
        if (removeUnlisted) {
            for (const [existingFilePath] of existingFiles) {
                if (!filesToKeep.has(existingFilePath)) {
                    filesToUpload.push({
                        action: 'delete',
                        file_path: existingFilePath,
                    });
                }
            }
        }
        const chunks = [];
        for (let i = 0; i < filesToUpload.length; i += MAX_BATCH_UPLOAD_SIZE) {
            chunks.push(filesToUpload.slice(i, i + MAX_BATCH_UPLOAD_SIZE));
        }
        if (chunks.length === 0) {
            console.info('No files to upload');
            status && await status({ message: 'No files to upload', status: types_1.JobStatus.SUCCESS });
            return;
        }
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            if (chunks.length > 1) {
                status && await status({ message: `Batch ${chunkIndex + 1}/${chunks.length}: Uploading ${chunk.length} files`, status: types_1.JobStatus.IN_PROGRESS });
            }
            else {
                status && await status({ message: `Uploading ${files.length} file(s)`, status: types_1.JobStatus.IN_PROGRESS });
            }
            try {
                await this.callApi({
                    session,
                    path: `api/v4/projects/${websiteId}/repository/commits`,
                    method: 'POST',
                    requestBody: {
                        branch: 'main',
                        commit_message: `Batch update assets (${chunkIndex + 1}/${chunks.length})`,
                        actions: chunk,
                    }
                });
            }
            catch (e) {
                console.error(`Batch ${chunkIndex + 1} failed`, e);
                status && await status({ message: `Error in batch ${chunkIndex + 1}`, status: types_1.JobStatus.ERROR });
                throw e;
            }
        }
        status && await status({ message: `All ${files.length} files uploaded`, status: types_1.JobStatus.SUCCESS });
    }
    async readAsset(session, websiteId, fileName) {
        const finalPath = this.getAssetPath(fileName, false);
        return this.readFile(session, websiteId, finalPath);
    }
    async deleteAssets(session, websiteId, fileNames) {
        return this.callApi({
            session,
            path: `api/v4/projects/${websiteId}/repository/commits`,
            method: 'POST',
            requestBody: {
                id: websiteId,
                branch: this.options.branch,
                commit_message: `Delete assets from Silex: ${fileNames.join(', ')}`,
                actions: fileNames.map(f => ({
                    action: 'delete',
                    file_path: this.getAssetPath(f),
                })),
            }
        });
    }
    async ls({ session, websiteId, recursive = false, path, }) {
        const existingPaths = new Map();
        let page = 1;
        let keepGoing = true;
        while (keepGoing) {
            const responseHeaders = {};
            let tree = [];
            try {
                const params = {
                    recursive,
                    per_page: 100,
                    page,
                };
                if (path)
                    params.path = path;
                tree = await this.callApi({
                    session,
                    path: `api/v4/projects/${websiteId}/repository/tree`,
                    method: 'GET',
                    params,
                    responseHeaders,
                });
            }
            catch (e) {
                if (e.statusCode !== 404 && e.httpStatusCode !== 404) {
                    throw e;
                }
            }
            tree
                .filter(item => item.type === 'blob')
                .forEach(item => existingPaths.set(item.path, item.id));
            const maxPages = responseHeaders['x-total-pages'] ? parseInt(responseHeaders['x-total-pages'], 10) : 1;
            keepGoing = page < maxPages;
            page++;
        }
        return existingPaths;
    }
}
exports.default = GitlabConnector;
