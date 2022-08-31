import * as CloudExplorer from 'cloud-explorer'
import * as Os from 'os'
import {CeOptions} from '../ServerConfig'

export default function(ceOptions: CeOptions) {

  const routerOptions: any = {}

  // FTP service
  if (ceOptions.enableFtp) {
    console.log('> FTP service enabled')
    routerOptions.ftp = {
      redirectUri: ceOptions.rootUrl + ceOptions.rootPath + '/ftp/signin',
    }
  } else {
    console.log('> FTP service disabled, env vars ENABLE_FTP not set')
  }

  // SFTP service
  if (ceOptions.enableSftp) {
    console.log('> SFTP service enabled')
    routerOptions.sftp = {
      redirectUri: ceOptions.rootUrl + ceOptions.rootPath + '/sftp/signin',
    }
  } else {
    console.log('> SFTP service disabled, env vars ENABLE_SFTP not set')
  }

  // Webdav service
  if (ceOptions.enableWebdav) {
    console.log('> Webdav service enabled')
    routerOptions.webdav = {
      redirectUri: ceOptions.rootUrl + ceOptions.rootPath + '/webdav/signin',
    }
  } else {
    console.log('> Webdav service disabled, env vars ENABLE_WEBDAV not set')
  }

  // Github service
  if (ceOptions.githubClientId && ceOptions.githubClientSecret) {
    console.log('> Github service enabled', ceOptions.githubClientId)
    routerOptions.github = {
      clientId: ceOptions.githubClientId,
      clientSecret: ceOptions.githubClientSecret,
      redirectUri: ceOptions.rootUrl + ceOptions.rootPath + '/github/oauth_callback',
    }
  } else {
    console.log('> Github service disabled, env vars GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET not set')
  }

  // Dropbox service
  if (ceOptions.dropboxClientId && ceOptions.dropboxClientSecret) {
    console.log('> Dropbox service enabled', ceOptions.dropboxClientId)
    routerOptions.dropbox = {
      clientId: ceOptions.dropboxClientId,
      clientSecret: ceOptions.dropboxClientSecret,
      redirectUri: ceOptions.rootUrl + ceOptions.rootPath + '/dropbox/oauth_callback',
    }
  } else {
    console.log('> Dropbox service disabled, env vars DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET not set')
  }

  // Local file system service
  if (ceOptions.enableFs) {
    const fsRoot = ceOptions.fsRoot || Os.homedir()
    console.log('> Local file system service enabled')
    console.warn('Warning local file system is writable, use FS_ROOT as root (', fsRoot, ')')
    routerOptions.fs = {
      showHiddenFile: ceOptions.fsShowHidden,
      sandbox: fsRoot,
      infos: {
        displayName: 'fs',
      },
    }
  } else {
    console.log('> Local file system service disabled, env vars SILEX_DEBUG or ENABLE_FS not set')
  }

  routerOptions.thumbnails = ceOptions.thumbnails
  routerOptions.unsplash = ceOptions.unsplash

  return new CloudExplorer(routerOptions)
}
