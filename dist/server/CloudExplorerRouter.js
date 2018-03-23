const Os = require('os');
const fs = require('fs');
const CloudExplorer = require('cloud-explorer');

module.exports = function(rootUrl) {

  // **
  // unifile routes
  const routerOptions = {};

  // FTP service
  console.log('FTP service: looking for env vars ENABLE_FTP');
  if(process.env.ENABLE_FTP) {
    console.log('FTP service: found');
    routerOptions.ftp = {
      redirectUri: rootUrl + '/ftp/signin',
    };
  }

  // SFTP service
  console.log('SFTP service: looking for env vars ENABLE_SFTP');
  if(process.env.ENABLE_SFTP) {
    console.log('SFTP service: found');
    routerOptions.sftp = {
      redirectUri: rootUrl + '/sftp/signin',
    };
  }

  // Webdav service
  console.log('Webdav service: looking for env vars ENABLE_WEBDAV');
  if(process.env.ENABLE_WEBDAV) {
    console.log('Webdav service: found');
    routerOptions.webdav = {
      redirectUri: rootUrl + '/webdav/signin',
    };
  }

  // Github service
  console.log('Github service: looking for env vars GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
  if(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log('Github service: found app', process.env.GITHUB_CLIENT_ID);
    routerOptions.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: rootUrl + '/github/oauth_callback',
    };
  }

  // Dropbox service
  console.log('Dropbox service: looking for env vars DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET');
  if(process.env.DROPBOX_CLIENT_ID && process.env.DROPBOX_CLIENT_SECRET) {
    console.log('Dropbox service: found app', process.env.DROPBOX_CLIENT_ID);
    routerOptions.dropbox = {
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      redirectUri: rootUrl + '/dropbox/oauth_callback',
    };
  }

  // Local file system service
  console.log('Local file system service: looking for env vars SILEX_ELECTRON or SILEX_DEBUG or ENABLE_FS');
  if(process.env.SILEX_DEBUG || process.env.SILEX_ELECTRON || process.env.ENABLE_FS) {
    const fsRoot = process.env.FS_ROOT || Os.homedir();
    console.info('Local file system service: ENABLED => local file system is writable, use FS_ROOT as root (', fsRoot, ')');
    routerOptions.fs = {
      showHiddenFile: false,
      sandbox: fsRoot,
      infos: {
        displayName: 'fs',
      },
    };
  }

  return new CloudExplorer(routerOptions);
};
