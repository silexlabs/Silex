//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

// server options
const serverOptions = {};
serverOptions.port = process.env.PORT || 6805; // 6805 is the date of sexual revolution started in paris france 8-)
serverOptions.rootUrl = process.env.SERVER_URL || `http://localhost:${serverOptions.port}`;
serverOptions.sessionSecret = process.env.SILEX_SESSION_SECRET || 'test session secret';
serverOptions.cePath = '/ce';

// electron app
const electronOptions = {
  enabled: process.env.SILEX_ELECTRON || false,
}

// SSL options
const sslOptions = {
  forceHttps: process.env.SILEX_FORCE_HTTPS,
  trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER,
  privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
  certificate: process.env.SILEX_SSL_CERTIFICATE,
  sslPort: process.env.SSL_PORT || 443,
};

// cloud explorer options
const ceOptions = {
  enableFtp: process.env.ENABLE_FTP,
  enableSftp: process.env.ENABLE_SFTP,
  enableWebdav: process.env.ENABLE_WEBDAV,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  dropboxClientId: process.env.DROPBOX_CLIENT_ID,
  dropboxClientSecret: process.env.DROPBOX_CLIENT_SECRET,
  enableFs: process.env.SILEX_DEBUG || process.env.SILEX_ELECTRON || process.env.ENABLE_FS,
  fsRoot: process.env.FS_ROOT,
  rootUrl: serverOptions.rootUrl + serverOptions.cePath,
};

const publisherOptions = {
  rootUrl: serverOptions.rootUrl,
  port: serverOptions.port,
  skipProviderSelection: false,
  enableGithubPages: true,
}

const exported = function() {};
exported.prototype = {
  ceOptions: ceOptions,
  serverOptions: serverOptions,
  publisherOptions: publisherOptions,
  electronOptions: electronOptions,
  sslOptions: sslOptions,
};
module.exports = exported;

