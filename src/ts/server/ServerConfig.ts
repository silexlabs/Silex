/**
 * @fileoverview this is where the default config is defined
 * The values can be overriden with env vars or before passing the config to Silex
 * @see {@link https://github.com/lexoyo/silex-for-hosting-company|example of customization with the config object}
 * @see {@link https://github.com/silexlabs/Silex/blob/develop/app.json|all the env vars in this definition file for heroku 1 click deploy}
 * @see {@link https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables|Silex env vars}
 */

// server options
export interface ServerOptions {
  debug: boolean
  port: string
  rootUrl: string
  sessionSecret: string
  rootPath: string
  cePath: string
  beautifyEditable: boolean
}
// SSL options
export interface SslOptions {
  forceHttps: boolean
  trustXFPHeader: boolean
  privateKey: string
  certificate: string
  sslPort: string
}

// cloud explorer options
export interface CeOptions {
  enableFtp: boolean
  enableSftp: boolean
  enableWebdav: boolean
  githubClientId: string
  githubClientSecret: string
  dropboxClientId: string
  dropboxClientSecret: string
  enableFs: boolean
  fsRoot: string
  fsShowHidden: boolean
  rootUrl: string
  rootPath: string
  unsplash?: {
    accessKey: string;
    appName: string;
    offlineTestPath: string;
  }
  thumbnails?: {
    width: number;
    height: number;
    extensions: string[];
  }
}

export interface PublisherOptions {
  rootUrl: string
  port: string
  skipHostingSelection: boolean
  enableHostingGhPages: boolean
  enableHostingUnifile: boolean
}

export type StaticOptions = any

export class Config {
  ceOptions: CeOptions
  serverOptions: ServerOptions
  publisherOptions: PublisherOptions
  sslOptions: SslOptions
  staticOptions: StaticOptions
  constructor() {
    const PORT = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
    const rootPath = process.env.SILEX_PATH || '' // e.g. /subfolder
    this.serverOptions = {
      debug: process.env.SILEX_DEBUG === 'true',
      port: PORT,
      rootUrl: (process.env.SERVER_URL || `http://localhost:${PORT}`) + rootPath,
      sessionSecret: process.env.SILEX_SESSION_SECRET || 'test session secret',
      beautifyEditable: process.env.SILEX_BEAUTIFY_EDITABLE === 'true',
      rootPath,
      cePath: `${rootPath}/ce`, // `ce` as in CloudExplorer is hardcoded here and in the iframe url in workspace.pug
    }
    this.sslOptions = {
      forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
      trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
      privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
      certificate: process.env.SILEX_SSL_CERTIFICATE,
      sslPort: process.env.SSL_PORT || '443',
    }
    this.ceOptions = {
      enableFtp: process.env.ENABLE_FTP === 'true',
      enableSftp: process.env.ENABLE_SFTP !== 'false', // true by default
      enableWebdav: process.env.ENABLE_WEBDAV === 'true',
      githubClientId: process.env.GITHUB_CLIENT_ID,
      githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
      dropboxClientId: process.env.DROPBOX_CLIENT_ID,
      dropboxClientSecret: process.env.DROPBOX_CLIENT_SECRET,
      enableFs: this.serverOptions.debug || process.env.ENABLE_FS === 'true',
      fsRoot: process.env.FS_ROOT,
      fsShowHidden: process.env.FS_SHOW_HIDDEN === 'true',
      rootUrl: this.serverOptions.rootUrl,
      rootPath: this.serverOptions.cePath,
      unsplash: {
        accessKey: process.env.UNSPLASH_ACCESS_KEY,
        appName: process.env.UNSPLASH_APP_NAME,
        offlineTestPath: process.env.UNSPLASH_OFFLINE_TEST_PATH,
      },
      thumbnails: {
        width: 255,
        height: 255,
        extensions: ['jpg', 'jpeg', 'png', 'svg'], // unsupported extensions will be replaced with an icon
      },
    }
    this.publisherOptions = {
      rootUrl: this.serverOptions.rootUrl,
      port: this.serverOptions.port,
      skipHostingSelection: process.env.SKIP_HOSTING_SELECTION === 'true',
      enableHostingGhPages: process.env.ENABLE_HOSTING_GH_PAGES === 'true',
      enableHostingUnifile: process.env.ENABLE_HOSTING_UNIFILE !== 'false', // true by default
    }
    this.staticOptions = {}
  }
}
