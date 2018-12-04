const Os = require('os');
const fs = require('fs');
const CloudExplorer = require('cloud-explorer');

module.exports = function(ceOptions) {

  const routerOptions = {};

  // FTP service
  console.log('FTP service: looking for env vars ENABLE_FTP');
  if(ceOptions.enableFtp) {
    console.log('FTP service: found');
    routerOptions.ftp = {
      redirectUri: ceOptions.rootUrl + '/ftp/signin',
    };
  }

  // SFTP service
  console.log('SFTP service: looking for env vars ENABLE_SFTP');
  if(ceOptions.enableSftp) {
    console.log('SFTP service: found');
    routerOptions.sftp = {
      redirectUri: ceOptions.rootUrl + '/sftp/signin',
    };
  }

  // Webdav service
  console.log('Webdav service: looking for env vars ENABLE_WEBDAV');
  if(ceOptions.enableWebdav) {
    console.log('Webdav service: found');
    routerOptions.webdav = {
      redirectUri: ceOptions.rootUrl + '/webdav/signin',
    };
  }

  // Github service
  console.log('Github service: looking for env vars GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
  if(ceOptions.githubClientId && ceOptions.githubClientSecret) {
    console.log('Github service: found app', ceOptions.githubClientId);
    routerOptions.github = {
      clientId: ceOptions.githubClientId,
      clientSecret: ceOptions.githubClientSecret,
      redirectUri: ceOptions.rootUrl + '/github/oauth_callback',
    };
  }

  // Dropbox service
  console.log('Dropbox service: looking for env vars DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET');
  if(ceOptions.dropboxClientId && ceOptions.dropboxClientSecret) {
    console.log('Dropbox service: found app', ceOptions.dropboxClientId);
    routerOptions.dropbox = {
      clientId: ceOptions.dropboxClientId,
      clientSecret: ceOptions.dropboxClientSecret,
      redirectUri: ceOptions.rootUrl + '/dropbox/oauth_callback',
    };
  }

  // Local file system service
  console.log('Local file system service: looking for env vars SILEX_ELECTRON or SILEX_DEBUG or ENABLE_FS');
  if(ceOptions.enableFs) {
    const fsRoot = ceOptions.fsRoot || Os.homedir();
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
