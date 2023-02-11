"use strict";
/**
 * @fileoverview this is where the default config is defined
 * The values can be overriden with env vars or before passing the config to Silex
 * @see {@link https://github.com/lexoyo/silex-for-hosting-company|example of customization with the config object}
 * @see {@link https://github.com/silexlabs/Silex/blob/develop/app.json|all the env vars in this definition file for heroku 1 click deploy}
 * @see {@link https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables|Silex env vars}
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
class Config {
    constructor() {
        const PORT = process.env.PORT || '6805'; // 6805 is the date of sexual revolution started in paris france 8-)
        this.serverOptions = {
            debug: process.env.SILEX_DEBUG === 'true',
            port: PORT,
            rootUrl: process.env.SERVER_URL || `http://localhost:${PORT}`,
            sessionSecret: process.env.SILEX_SESSION_SECRET || 'test session secret',
            cePath: '/ce',
        };
        this.sslOptions = {
            forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
            trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
            privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
            certificate: process.env.SILEX_SSL_CERTIFICATE,
            sslPort: process.env.SSL_PORT || '443',
        };
        this.ceOptions = {
            enableFtp: process.env.ENABLE_FTP === 'true',
            enableSftp: process.env.ENABLE_SFTP !== 'false',
            enableWebdav: process.env.ENABLE_WEBDAV === 'true',
            githubClientId: process.env.GITHUB_CLIENT_ID,
            githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
            dropboxClientId: process.env.DROPBOX_CLIENT_ID,
            dropboxClientSecret: process.env.DROPBOX_CLIENT_SECRET,
            enableFs: this.serverOptions.debug || process.env.ENABLE_FS === 'true',
            fsRoot: process.env.FS_ROOT,
            fsShowHidden: process.env.FS_SHOW_HIDDEN === 'true',
            rootUrl: this.serverOptions.rootUrl + this.serverOptions.cePath,
            unsplash: {
                accessKey: process.env.UNSPLASH_ACCESS_KEY,
                appName: process.env.UNSPLASH_APP_NAME,
                offlineTestPath: process.env.UNSPLASH_OFFLINE_TEST_PATH,
            },
            thumbnails: {
                width: 255,
                height: 255,
                extensions: ['jpg', 'jpeg', 'png', 'svg'],
            },
        };
        this.publisherOptions = {
            rootUrl: this.serverOptions.rootUrl,
            port: this.serverOptions.port,
            skipHostingSelection: process.env.SKIP_HOSTING_SELECTION === 'true',
            enableHostingGhPages: process.env.ENABLE_HOSTING_GH_PAGES === 'true',
            enableHostingUnifile: process.env.ENABLE_HOSTING_UNIFILE !== 'false',
        };
        this.staticOptions = {};
    }
}
exports.Config = Config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyQ29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9TZXJ2ZXJDb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBc0RILE1BQWEsTUFBTTtJQU1qQjtRQUNFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQSxDQUFDLG9FQUFvRTtRQUM1RyxJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ25CLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsS0FBSyxNQUFNO1lBQ3pDLElBQUksRUFBRSxJQUFJO1lBQ1YsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLG9CQUFvQixJQUFJLEVBQUU7WUFDN0QsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUkscUJBQXFCO1lBQ3hFLE1BQU0sRUFBRSxLQUFLO1NBQ2QsQ0FBQTtRQUNELElBQUksQ0FBQyxVQUFVLEdBQUc7WUFDaEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEtBQUssTUFBTTtZQUNwRCxjQUFjLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsS0FBSyxNQUFNO1lBQ3pFLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQjtZQUM3QyxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUI7WUFDOUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLEtBQUs7U0FDdkMsQ0FBQTtRQUNELElBQUksQ0FBQyxTQUFTLEdBQUc7WUFDZixTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEtBQUssTUFBTTtZQUM1QyxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEtBQUssT0FBTztZQUMvQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEtBQUssTUFBTTtZQUNsRCxjQUFjLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0I7WUFDNUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7WUFDcEQsZUFBZSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCO1lBQzlDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCO1lBQ3RELFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxNQUFNO1lBQ3RFLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU87WUFDM0IsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxLQUFLLE1BQU07WUFDbkQsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUMvRCxRQUFRLEVBQUU7Z0JBQ1IsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO2dCQUMxQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUI7Z0JBQ3RDLGVBQWUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQjthQUN4RDtZQUNELFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsR0FBRztnQkFDVixNQUFNLEVBQUUsR0FBRztnQkFDWCxVQUFVLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDMUM7U0FDRixDQUFBO1FBQ0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHO1lBQ3RCLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDbkMsSUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSTtZQUM3QixvQkFBb0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixLQUFLLE1BQU07WUFDbkUsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsS0FBSyxNQUFNO1lBQ3BFLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEtBQUssT0FBTztTQUNyRSxDQUFBO1FBQ0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUE7SUFDekIsQ0FBQztDQUNGO0FBdERELHdCQXNEQyJ9