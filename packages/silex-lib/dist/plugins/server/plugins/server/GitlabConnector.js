"use strict";
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
const constants_1 = require("../../constants");
const connectors_1 = require("../../server/connectors/connectors");
const types_1 = require("../../types");
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importStar(require("crypto"));
const path_1 = require("path");
const https_1 = require("https");
const page_1 = require("../../page");
/**
 * Gitlab connector
 * @fileoverview Gitlab connector for Silex, connect to the user's Gitlab account to store websites
 * @see https://docs.gitlab.com/ee/api/oauth2.html
 */
const MAX_BATCH_UPLOAD_SIZE = 100;
const MAX_BODY_SIZE_KB = 8 * 1000 * 1024; // 8MB (note that 10 MB PNG → becomes ~13.3 MB → ❌ often too big for Gitlab)
const WEBSITE_DATA_FILE_FORMAT_VERSION = '1.0.0';
// interface MetaRepoFileContent {
//   websites: {
//     [websiteId: string]: {
//       meta: WebsiteMetaFileContent,
//       createdAt: string,
//       updatedAt: string,
//     }
//   }
// }
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
        ? Buffer.from(content, 'base64') // for binary files
        : Buffer.from(content, 'utf8'); // for text files
    const header = `blob ${contentBuffer.length}\0`;
    const full = Buffer.concat([Buffer.from(header), contentBuffer]);
    return crypto_1.default.createHash('sha1').update(full).digest('hex');
}
function sanitizeGitlabPath(name) {
    return name
        .normalize('NFD') // separate accents
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-zA-Z0-9._-]/g, '-') // only allow allowed characters
        .replace(/^[-_.]+/, '') // no starting '-', '_' or '.'
        .replace(/[-_.]+$/, '') // no ending '-', '_' or '.'
        .replace(/\.git$|\.atom$/i, '') // forbidden endings
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
            //metaRepo: 'silex-meta',
            //metaRepoFile: 'websites.json',
            repoPrefix: 'silex_',
            scope: 'api', // 'api+read_api+read_user+read_repository+write_repository+email+sudo+profile+openid'
            ...opts,
        };
        if (!this.options.clientId)
            throw new Error('Missing Gitlab client ID');
        if (!this.options.clientSecret)
            throw new Error('Missing Gitlab client secret');
        if (!this.options.domain)
            throw new Error('Missing Gitlab domain');
        if (!this.options.timeOut)
            this.options.timeOut = 15000; /* default value */
    }
    // **
    // Convenience methods for the Gitlab API
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
        // Remove leading slash
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
        // Remove leading slash
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
        // Remove leading slash
        const safePath = fileName.replace(/^\//, '');
        return this.downloadRawFile(session, websiteId, safePath);
    }
    /**
     * Call the Gitlab API with the user's token and handle errors
     */
    async callApi({ session, path, method = 'GET', requestBody = null, params = {}, responseHeaders = {}, // Will get the response heaaders
     }) {
        const token = this.getSessionToken(session).token;
        const tokenParam = token ? `access_token=${token.access_token}&` : '';
        const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v.toString())}`).join('&');
        const url = `${this.options.domain}/${path}?${tokenParam}${paramsStr}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (method === 'GET' && requestBody) {
            console.error('Gitlab API error (4) - GET request with body', { url, method, body: requestBody, params });
        }
        // With or without body
        let response;
        const body = requestBody ? JSON.stringify(requestBody) : undefined;
        try {
            if (body && Buffer.byteLength(body) > MAX_BODY_SIZE_KB * 1024) {
                // TODO: warn the end user
                console.warn('Gitlab API warning - body too big', Buffer.byteLength(body), 'bytes', { url, method, params });
            }
            response = await (0, node_fetch_1.default)(url, requestBody && method !== 'GET' ? {
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
            console.error('Gitlab API error (0)', e);
            throw new types_1.ApiError(`Gitlab API error (0): ${e.message} ${e.text} ${e.code} ${e.name} ${e.type}`, 500);
        }
        // Pass the response headers to the caller
        response.headers.forEach((value, name) => responseHeaders[name] = value);
        // Handle the case when the server returns a non-JSON response (e.g. 400 Bad Request)
        const text = await async function () {
            try {
                return await response.text();
            }
            catch (e) {
                console.error('Gitlab API error (6) - could not parse response', response.status, response.statusText, { url, method, body: requestBody, params }, e);
                throw new types_1.ApiError(`Gitlab API error (6): response body not available. ${e.message}`, 500);
            }
        }();
        if (!response.ok) {
            console.error('Gitlab API error (7) - response not ok', response.status, response.statusText, { url, method, body: requestBody, params, text: text });
            if (text.includes('A file with this name doesn\'t exist')) {
                throw new types_1.ApiError('Gitlab API error (5): Not Found', 404);
            }
            else if (response.status === 401 && this.getSessionToken(session).token?.refresh_token) {
                // Refresh the token
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
                    console.error('Gitlab API error (2) - could not refresh token', response.status, response.statusText, { message }, 'refresh_token:', token?.refresh_token);
                    // Workaround for when the token is invalid
                    // It happens often which is not normal (refresh token should last 6 months)
                    this.logout(session);
                    // Notify the user
                    throw new types_1.ApiError(`Gitlab API error (2): ${message}`, response.status);
                }
            }
            else {
                const message = response.statusText;
                console.error('Gitlab API error (1)', response.status, response.statusText, { url, method, body: requestBody, params, text: text, message });
                throw new types_1.ApiError(`Gitlab API error (1): ${message} (${text})`, response.status);
            }
        }
        let json;
        try {
            json = JSON.parse(text);
        }
        catch (e) {
            if (!response.ok) {
                // A real error
                throw e;
            }
            else {
                // Useless error linked to the fact that the response is not JSON
                console.error('Gitlab API error (3) - could not parse response', response.status, response.statusText, { url, method, body: requestBody, params, text: text });
                return text;
            }
        }
        return json;
    }
    async downloadRawFile(session, projectId, filePath) {
        const token = this.getSessionToken(session).token?.access_token;
        const domain = this.options.domain;
        const branch = this.options.branch;
        // Construct the raw URL
        // GET /projects/:id/repository/files/:file_path/raw
        const rawUrl = `${domain}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${branch}&access_token=${token}`;
        const fileRes = await (0, node_fetch_1.default)(rawUrl, {
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
                throw new types_1.ApiError('GitLab raw error (5): Not Found', 404);
            }
            console.error('GitLab raw error (1)', fileRes.status, fileRes.statusText, { rawUrl, errText });
            throw new types_1.ApiError(`GitLab raw error (1): ${fileRes.statusText} (${errText})`, fileRes.status);
        }
        try {
            const buffer = await fileRes.buffer();
            return buffer;
        }
        catch (e) {
            console.error('GitLab raw error (3): could not read buffer', e);
            throw new types_1.ApiError('GitLab raw error (3): failed to read binary content', 500);
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
        // Replace '+' with '-', '/' with '_', and remove '='
        base64Url = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        return base64Url;
    }
    getRedirect() {
        const params = `connectorId=${this.connectorId}&type=${this.connectorType}`;
        return `${this.config.url}${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_LOGIN_CALLBACK}?${params}`;
    }
    // Force IPv4 when running locally
    getAgent() {
        if (this.config.url.startsWith('http://localhost')) {
            return new https_1.Agent({
                family: 4,
            });
        }
        return undefined;
    }
    /**
     * Get the OAuth URL to redirect the user to
     * The URL should look like
     * https://gitlab.example.com/oauth/authorize?client_id=APP_ID&redirect_uri=REDIRECT_URI&response_type=code&state=STATE&scope=REQUESTED_SCOPES&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
     * OAuth2 Step #1 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
     */
    async getOAuthUrl(session) {
        const redirect_uri = encodeURIComponent(this.getRedirect());
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const codeVerifier = this.generateCodeVerifier();
        // Create the code challenge
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        // Store the code verifier and code challenge in the session
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
        return {}; // FIXME: store branch
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
    /**
     * Get the token from return code
     * Set the token in the session
     * OAuth2 Step #2 from https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce
     */
    async setToken(session, loginResult) {
        const sessionToken = this.getSessionToken(session);
        if (!loginResult.state || loginResult.state !== sessionToken?.state) {
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
        // Store the token in the session
        this.setSessionToken(session, {
            ...this.getSessionToken(session),
            token,
        });
        // We need to get the user ID for listWebsites
        const user = await this.callApi({
            session,
            path: 'api/v4/user'
        });
        // Store the user details in the session
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
        // Handle multiple pages
        let page = 1;
        let totalPages = 1;
        const projects = [];
        do {
            const responseHeaders = {};
            const pageProjects = await this.callApi({
                session,
                path: `api/v4/users/${userId}/projects`,
                params: {
                    simple: true,
                    per_page: 100,
                    page,
                },
                responseHeaders,
            });
            projects.push(...pageProjects);
            page++;
            // Get the total number of pages from the response headers
            const total = responseHeaders['x-total-pages'];
            if (total) {
                totalPages = parseInt(total, 10);
            }
        } while (page <= totalPages);
        return projects
            .filter(p => p.name.startsWith(this.options.repoPrefix))
            .map(p => ({
            websiteId: p.id,
            name: p.name.replace(this.options.repoPrefix, ''),
            createdAt: p.created_at,
            updatedAt: p.last_activity_at,
            connectorUserSettings: {},
        }));
    }
    /**
     * Read the website data
     * The website data file is named `website.json` and the pages are named `page-{id}.json`
     * The pages are stored in the `src` folder by default
     */
    async readWebsite(session, websiteId) {
        const websiteDataBuf = await this.downloadRawFile(session, websiteId, constants_1.WEBSITE_DATA_FILE);
        const websiteDataOb = JSON.parse(websiteDataBuf.toString('utf8'));
        const { fileFormatVersion, ...websiteData } = websiteDataOb;
        // Check the file format version
        if (fileFormatVersion !== WEBSITE_DATA_FILE_FORMAT_VERSION) {
            // This should be handled by a migration mechanism
            console.warn('Gitlab connector: website data file format version mismatch', fileFormatVersion, '!=', WEBSITE_DATA_FILE_FORMAT_VERSION);
        }
        // This happens when the website was just created
        // Let grapesjs create the pages in the frontend
        if (!websiteData.pages) {
            return websiteData;
        }
        // Load each page in parallel
        const pages = await Promise.all(websiteData.pages.map(async (page) => {
            if (page.isFile) {
                const name = (0, page_1.getPageSlug)(page.name);
                const fileName = (`${name}-${page.id}`);
                const filePath = `${constants_1.WEBSITE_PAGES_FOLDER}/${fileName}.json`;
                const pageContent = await this.downloadRawFile(session, websiteId, filePath);
                const res = JSON.parse(pageContent.toString('utf8'));
                return res;
            }
            return page;
        }));
        // Read each page file if needed
        return {
            ...websiteData,
            pages,
        };
    }
    /**
     * Create a new website, i.e. a new Gitlab repository with an empty website data file
     */
    async createWebsite(session, websiteMeta) {
        const project = await this.callApi({
            session,
            path: 'api/v4/projects/',
            method: 'POST',
            requestBody: {
                name: this.options.repoPrefix + websiteMeta.name,
            }
        });
        await this.createFile(session, project.id, constants_1.WEBSITE_DATA_FILE, JSON.stringify({}));
        //await this.createFile(session, project.id, WEBSITE_META_DATA_FILE, JSON.stringify(websiteMeta))
        //await this.updateWebsite(session, project.id, {} as WebsiteData)
        //await this.setWebsiteMeta(session, project.id, websiteMeta)
        return project.id;
    }
    /**
     * Update the website data
     * Split the website data into 1 file per page + 1 file for the website data itself
     * Use gitlab batch API to create/update the files
     */
    async updateWebsite(session, websiteId, websiteData) {
        const batchActions = [];
        // **
        // List existing files in the pages folder
        const existingFiles = await this.ls({
            session,
            websiteId,
            path: constants_1.WEBSITE_PAGES_FOLDER,
            recursive: false,
        });
        // **
        // Create the pages for batch upload
        const pages = websiteData.pages.map((page) => {
            const fileName = encodeURIComponent(`${(0, page_1.getPageSlug)(page.name)}-${page.id}`);
            const filePath = `${constants_1.WEBSITE_PAGES_FOLDER}/${fileName}.json`;
            const content = JSON.stringify(page);
            const newSha = computeGitBlobSha(content, false);
            const existingSha = existingFiles.get(filePath);
            if (existingSha) {
                if (existingSha !== newSha) {
                    batchActions.push({
                        action: 'update',
                        file_path: filePath,
                        content,
                    });
                } // else: skip unchanged file
            }
            else {
                batchActions.push({
                    action: 'create',
                    file_path: filePath,
                    content,
                });
            }
            return {
                name: page.name,
                id: page.id,
                isFile: true,
            };
        });
        // **
        // Delete pages that are not in the new website data
        for (const filePath of existingFiles.keys()) {
            const pageName = filePath.replace(/.*\//, '').replace(/\.json$/, '');
            const pageId = pageName.split('-').pop();
            const page = websiteData.pages.find((p) => p.id === pageId);
            if (!page) {
                batchActions.push({
                    action: 'delete',
                    file_path: filePath,
                });
            }
        }
        // **
        // Add the main website data file
        const websiteDataWithGitlabPages = {
            ...websiteData,
            fileFormatVersion: WEBSITE_DATA_FILE_FORMAT_VERSION,
            pages,
        };
        const websiteJsonContent = JSON.stringify(websiteDataWithGitlabPages);
        batchActions.push({
            action: 'update',
            file_path: constants_1.WEBSITE_DATA_FILE,
            content: websiteJsonContent,
        });
        // **
        // Perform a batch commit
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
        // Delete repo
        await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}`,
            method: 'DELETE'
        });
        //// Load the meta repo data
        //const file = await this.callApi(session, `api/v4/projects/${this.getMetaRepoPath(session)}/repository/files/${this.options.metaRepoFile}`, 'GET', null, {
        //  ref: this.options.branch,
        //})
        //const metaRepo = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) as MetaRepoFileContent
        //const data = metaRepo.websites[websiteId]
        //if(!data) throw new ApiError(`Website ${websiteId} not found`, 404)
        //// Update or create the website meta data
        //delete metaRepo.websites[websiteId]
        //// Save the meta repo data
        //const project = await this.callApi(session, `api/v4/projects/${this.getMetaRepoPath(session)}/repository/files/${this.options.metaRepoFile}`, 'PUT', {
        //  branch: this.options.branch,
        //  commit_message: `Delete meta data of ${data.meta.name} (${websiteId}) from Silex`,
        //  content: JSON.stringify(metaRepo),
        //})
    }
    // async duplicateWebsite(session: GitlabSession, websiteId: string): Promise<void> {
    //   // Get the repo meta data
    //   const meta = await this.getWebsiteMeta(session, websiteId)
    //   // List all the repository files
    //   const files = await this.ls({
    //     session,
    //     websiteId,
    //     recursive: true,
    //   })
    //   // Create a new repo
    //   const newId = await this.createWebsite(session, {
    //     ...meta,
    //     name: meta.name + ' Copy ' + new Date().toISOString().replace(/T.*/, '') + ' ' + Math.random().toString(36).substring(2, 4),
    //   })
    //   // Upload all files
    //   const actions: GitlabAction[] = []
    //   for (const file of files.keys()) {
    //     const content = await this.readFile(session, websiteId, file)
    //     // From buffer to string
    //     const contentStr = content.toString('base64')
    //     const path = encodeURIComponent(file)
    //     switch (file) {
    //     case WEBSITE_DATA_FILE:
    //       actions.push({
    //         action: 'update',
    //         file_path: path,
    //         content: contentStr,
    //       })
    //       break
    //     default:
    //       actions.push({
    //         action: 'create',
    //         file_path: path,
    //         content: contentStr,
    //       })
    //     }
    //   }
    //   // Perform a batch commit
    //   return this.callApi({
    //     session,
    //     path: `api/v4/projects/${newId}/repository/commits`,
    //     method: 'POST',
    //     requestBody: {
    //       branch: this.options.branch,
    //       commit_message: 'Update website data from Silex',
    //       actions,
    //     },
    //   })
    // }
    // Fork the repo
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
                /* @ts-ignore */
                path: safePath,
                /* @ts-ignore */
                namespace: meta.namespace?.id || undefined,
            },
        });
        return forkedProject.id;
    }
    async getWebsiteMeta(session, websiteId) {
        const project = await this.callApi({
            session,
            path: `api/v4/projects/${websiteId}`
        });
        return {
            websiteId,
            name: project.name.replace(this.options.repoPrefix, ''),
            imageUrl: project.avatar_url,
            createdAt: project.created_at,
            updatedAt: project.last_activity_at,
            connectorUserSettings: {},
        };
    }
    async setWebsiteMeta(session, websiteId, websiteMeta) {
        // Rename the repo if needed
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
        // List all the files in assets folder
        const existingFiles = await this.ls({
            session,
            websiteId,
            recursive: true,
            path: this.options.assetsFolder,
        });
        // Create the actions for the batch
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
                } // else: skip unchanged file
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
        // Optionally remove unlisted files
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
        // Split the files into chunks to avoid the number of files limit
        const chunks = [];
        for (let i = 0; i < filesToUpload.length; i += MAX_BATCH_UPLOAD_SIZE) {
            chunks.push(filesToUpload.slice(i, i + MAX_BATCH_UPLOAD_SIZE));
        }
        // Notify the user if nothing changed
        if (chunks.length === 0) {
            console.info('No files to upload');
            status && await status({ message: 'No files to upload', status: types_1.JobStatus.SUCCESS });
            return;
        }
        // Upload the files in chunks
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
    /*
     * Get the meta repo path for the current user
     * The meta repo contains a JSON file which contains the list of websites
     */
    //private getMetaRepoPath(session: GitlabSession): string {
    //  if(!this.getSessionToken(session).username) throw new ApiError('Missing Gitlab user ID. User not logged in?', 401)
    //  return encodeURIComponent(`${this.getSessionToken(session).username}/${this.options.metaRepo}`)
    //}
    ///**
    // * Initialize the storage with a meta repo
    // */
    //private async initStorage(session: GitlabSession): Promise<void> {
    //  // Create the meta repo
    //  try {
    //    const project = await this.callApi(session, 'api/v4/projects/', 'POST', {
    //      name: this.options.metaRepo,
    //    }) as any
    //    return this.createFile(session, this.getMetaRepoPath(session), this.options.metaRepoFile, JSON.stringify({
    //      websites: {}
    //    } as MetaRepoFileContent))
    //  } catch (e) {
    //    console.error('Could not init storage', e.statusCode, e.httpStatusCode, e)
    //    throw e
    //  }
    //}
    /**
     * List all the files in a folder
     * The result is a map of file paths to their SHA
     */
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
                // Allow 404 errors
                // This happens when the folder does not exist
                // In git this just means the files don't exist yet
                if (e.statusCode !== 404 && e.httpStatusCode !== 404) {
                    throw e;
                }
            }
            // Filter the files
            tree
                .filter(item => item.type === 'blob')
                .forEach(item => existingPaths.set(item.path, item.id));
            // Check if we need to keep going
            const maxPages = responseHeaders['x-total-pages'] ? parseInt(responseHeaders['x-total-pages'], 10) : 1;
            keepGoing = page < maxPages;
            page++;
        }
        // Return the set of existing paths
        return existingPaths;
    }
}
exports.default = GitlabConnector;
//# sourceMappingURL=GitlabConnector.js.map