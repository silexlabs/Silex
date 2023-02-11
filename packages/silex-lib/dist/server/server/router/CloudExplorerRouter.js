"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CloudExplorer = require("cloud-explorer");
const Os = require("os");
function default_1(ceOptions) {
    const routerOptions = {};
    // FTP service
    if (ceOptions.enableFtp) {
        console.log('> FTP service enabled');
        routerOptions.ftp = {
            redirectUri: ceOptions.rootUrl + '/ftp/signin',
        };
    }
    else {
        console.log('> FTP service disabled, env vars ENABLE_FTP not set');
    }
    // SFTP service
    if (ceOptions.enableSftp) {
        console.log('> SFTP service enabled');
        routerOptions.sftp = {
            redirectUri: ceOptions.rootUrl + '/sftp/signin',
        };
    }
    else {
        console.log('> SFTP service disabled, env vars ENABLE_SFTP not set');
    }
    // Webdav service
    if (ceOptions.enableWebdav) {
        console.log('> Webdav service enabled');
        routerOptions.webdav = {
            redirectUri: ceOptions.rootUrl + '/webdav/signin',
        };
    }
    else {
        console.log('> Webdav service disabled, env vars ENABLE_WEBDAV not set');
    }
    // Github service
    if (ceOptions.githubClientId && ceOptions.githubClientSecret) {
        console.log('> Github service enabled', ceOptions.githubClientId);
        routerOptions.github = {
            clientId: ceOptions.githubClientId,
            clientSecret: ceOptions.githubClientSecret,
            redirectUri: ceOptions.rootUrl + '/github/oauth_callback',
        };
    }
    else {
        console.log('> Github service disabled, env vars GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET not set');
    }
    // Dropbox service
    if (ceOptions.dropboxClientId && ceOptions.dropboxClientSecret) {
        console.log('> Dropbox service enabled', ceOptions.dropboxClientId);
        routerOptions.dropbox = {
            clientId: ceOptions.dropboxClientId,
            clientSecret: ceOptions.dropboxClientSecret,
            redirectUri: ceOptions.rootUrl + '/dropbox/oauth_callback',
        };
    }
    else {
        console.log('> Dropbox service disabled, env vars DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET not set');
    }
    // Local file system service
    if (ceOptions.enableFs) {
        const fsRoot = ceOptions.fsRoot || Os.homedir();
        console.log('> Local file system service enabled');
        console.warn('Warning local file system is writable, use FS_ROOT as root (', fsRoot, ')');
        routerOptions.fs = {
            showHiddenFile: ceOptions.fsShowHidden,
            sandbox: fsRoot,
            infos: {
                displayName: 'fs',
            },
        };
    }
    else {
        console.log('> Local file system service disabled, env vars SILEX_DEBUG or ENABLE_FS not set');
    }
    routerOptions.thumbnails = ceOptions.thumbnails;
    routerOptions.unsplash = ceOptions.unsplash;
    return new CloudExplorer(routerOptions);
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xvdWRFeHBsb3JlclJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvcm91dGVyL0Nsb3VkRXhwbG9yZXJSb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxnREFBK0M7QUFDL0MseUJBQXdCO0FBR3hCLG1CQUF3QixTQUFvQjtJQUUxQyxNQUFNLGFBQWEsR0FBUSxFQUFFLENBQUE7SUFFN0IsY0FBYztJQUNkLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRTtRQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUE7UUFDcEMsYUFBYSxDQUFDLEdBQUcsR0FBRztZQUNsQixXQUFXLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBRyxhQUFhO1NBQy9DLENBQUE7S0FDRjtTQUFNO1FBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxREFBcUQsQ0FBQyxDQUFBO0tBQ25FO0lBRUQsZUFBZTtJQUNmLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtRQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUE7UUFDckMsYUFBYSxDQUFDLElBQUksR0FBRztZQUNuQixXQUFXLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBRyxjQUFjO1NBQ2hELENBQUE7S0FDRjtTQUFNO1FBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1REFBdUQsQ0FBQyxDQUFBO0tBQ3JFO0lBRUQsaUJBQWlCO0lBQ2pCLElBQUksU0FBUyxDQUFDLFlBQVksRUFBRTtRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUE7UUFDdkMsYUFBYSxDQUFDLE1BQU0sR0FBRztZQUNyQixXQUFXLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBRyxnQkFBZ0I7U0FDbEQsQ0FBQTtLQUNGO1NBQU07UUFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLDJEQUEyRCxDQUFDLENBQUE7S0FDekU7SUFFRCxpQkFBaUI7SUFDakIsSUFBSSxTQUFTLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRTtRQUM1RCxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFFLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUNqRSxhQUFhLENBQUMsTUFBTSxHQUFHO1lBQ3JCLFFBQVEsRUFBRSxTQUFTLENBQUMsY0FBYztZQUNsQyxZQUFZLEVBQUUsU0FBUyxDQUFDLGtCQUFrQjtZQUMxQyxXQUFXLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBRyx3QkFBd0I7U0FDMUQsQ0FBQTtLQUNGO1NBQU07UUFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLHVGQUF1RixDQUFDLENBQUE7S0FDckc7SUFFRCxrQkFBa0I7SUFDbEIsSUFBSSxTQUFTLENBQUMsZUFBZSxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRTtRQUM5RCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUNuRSxhQUFhLENBQUMsT0FBTyxHQUFHO1lBQ3RCLFFBQVEsRUFBRSxTQUFTLENBQUMsZUFBZTtZQUNuQyxZQUFZLEVBQUUsU0FBUyxDQUFDLG1CQUFtQjtZQUMzQyxXQUFXLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBRyx5QkFBeUI7U0FDM0QsQ0FBQTtLQUNGO1NBQU07UUFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLDBGQUEwRixDQUFDLENBQUE7S0FDeEc7SUFFRCw0QkFBNEI7SUFDNUIsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFO1FBQ3RCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQTtRQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLDhEQUE4RCxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUN6RixhQUFhLENBQUMsRUFBRSxHQUFHO1lBQ2pCLGNBQWMsRUFBRSxTQUFTLENBQUMsWUFBWTtZQUN0QyxPQUFPLEVBQUUsTUFBTTtZQUNmLEtBQUssRUFBRTtnQkFDTCxXQUFXLEVBQUUsSUFBSTthQUNsQjtTQUNGLENBQUE7S0FDRjtTQUFNO1FBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpRkFBaUYsQ0FBQyxDQUFBO0tBQy9GO0lBRUQsYUFBYSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFBO0lBQy9DLGFBQWEsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQTtJQUUzQyxPQUFPLElBQUksYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ3pDLENBQUM7QUE5RUQsNEJBOEVDIn0=