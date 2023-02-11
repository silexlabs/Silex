"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const assert = require("assert");
//////////////////////////////
// Utils
//////////////////////////////
function setTimeoutPromise(time) {
    return new Promise((resolve) => setTimeout(() => resolve(), time));
}
function callServer(path, method, token) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            url: `https://api.github.com${path}`,
            method,
            headers: {
                'Accept': 'application/vnd.github.mister-fantastic-preview+json',
                'Authorization': token,
                'User-Agent': 'Unifile',
                'X-OAuth-Scopes': 'delete_repo, repo, user',
            },
        };
        request(reqOptions, (err, res, body) => {
            try {
                if (err) {
                    console.error('Github pages error', err);
                    reject(err);
                }
                else {
                    const result = JSON.parse(body);
                    resolve(result);
                }
            }
            catch (e) {
                console.error('Github pages error (try/catch)', err);
                reject(e);
            }
        });
    });
}
//////////////////////////////
// Exported class
//////////////////////////////
function HostingGhPages(unifile, config) {
    this.unifile = unifile;
    assert(this.unifile.listConnectors().find((connectorName) => connectorName === 'github'), 'Error: the Github service is required in order to activate the Github Pages hosting provider. You need to enable Github in unifile config, or disable Github Pages hosting provider (env var ENABLE_GITHUB_PAGES)');
}
exports.default = HostingGhPages;
//////////////////////////////
// Publication "hooks"
//////////////////////////////
HostingGhPages.prototype.getDefaultPageFileName = (context) => 'index.html';
HostingGhPages.prototype.finalizePublication = function ({ from, to, session }, onStatus) {
    return setTimeoutPromise(2000)
        .then(() => {
        return new Promise((resolve, reject) => {
            try {
                const repo = to.path.split('/')[0];
                const owner = session.github.account.login;
                const path = `/repos/${owner}/${repo}/pages`;
                resolve(callServer(path, 'GET', session.github.token)
                    .then((result) => {
                    if (result.status) {
                        switch (result.status) {
                            case 'queued':
                                onStatus('Waiting for Github Pages to start deployment');
                                return this.finalizePublication({ from, to, session }, onStatus);
                                break;
                            case 'building':
                                onStatus('Deploying to Github Pages');
                                return this.finalizePublication({ from, to, session }, onStatus);
                                break;
                            case 'built':
                                onStatus('Done, the site is live on Github Pages');
                                return result.html_url;
                                break;
                            case 'errored':
                                onStatus('Github page build error');
                                throw new Error('Github page build error');
                                break;
                        }
                    }
                    else {
                        console.error('Unknown Github pages error', result);
                        reject(new Error(result.message || 'Unknown Github Pages error.'));
                    }
                }));
            }
            catch (e) {
                reject(e);
            }
        });
    });
};
//////////////////////////////
// Front end exposed methods
//////////////////////////////
HostingGhPages.prototype.getOptions = function (session) {
    const infos = this.unifile.getInfos(session, 'github');
    return {
        name: 'ghpages',
        displayName: 'Github Pages',
        isLoggedIn: infos.isLoggedIn,
        username: infos.username,
        authorizeUrl: '/ce/github/authorize',
        dashboardUrl: 'https://www.github.com',
        pleaseCreateAVhost: 'create an empty repository.',
        vhostsUrl: '/hosting/ghpages/vhost',
        buyDomainUrl: 'https://www.gandi.net',
        skipFolderSelection: true,
        skipVhostSelection: false,
        afterPublishMessage: 'Your website is now live.',
    };
};
HostingGhPages.prototype.getVhosts = async function (session) {
    const repos = await (this.unifile.readdir(session, 'github', '/'));
    return repos
        .sort((a, b) => {
        return new Date(b.modified) - new Date(a.modified);
    })
        .map((file) => {
        return {
            name: file.name,
            domainUrl: `/hosting/ghpages/vhost/${file.name}`,
            skipDomainSelection: false,
            publicationPath: {
                // absPath: `/ce/github/get/${ file.name }/gh-pages`,
                name: 'gh-pages',
                folder: file.name,
                path: `${file.name}/gh-pages`,
                service: 'github',
                url: `https://${session.github.account.login}.github.io/${file.name}/`,
            },
        };
    });
};
HostingGhPages.prototype.getVhostData = async (session, vhostName) => {
    const owner = session.github.account.login;
    const path = `/repos/${owner}/${vhostName}/pages`;
    const result = await callServer(path, 'GET', session.github.token);
    return {
        domain: result.cname,
        url: result.html_url,
        status: result.status,
    };
};
HostingGhPages.prototype.setVhostData = async function (session, vhostName, data) {
    // TODO: use https://developer.github.com/v3/repos/pages/#update-information-about-a-pages-site
    if (data && data.domain && data.domain !== '') {
        return this.unifile.writeFile(session, 'github', `/${vhostName}/gh-pages/CNAME`, data.domain)
            .then(() => setTimeoutPromise(5000))
            .then(() => this.getVhostData(session, vhostName));
    }
    else {
        // TODO: use https://developer.github.com/v3/repos/pages/#update-information-about-a-pages-site
        return this.unifile.unlink(session, 'github', `/${vhostName}/gh-pages/CNAME`)
            .catch((err) => {
            if (err.code !== 'ENOENT') {
                console.error('Github pages error', err);
                return Promise.reject(err);
            }
            // there was no CNAME file, not a real error
            return Promise.resolve();
        })
            .then(() => setTimeoutPromise(5000))
            .then(() => this.getVhostData(session, vhostName));
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9zdGluZ0doUGFnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvc2VydmVyL2hvc3RpbmctcHJvdmlkZXIvSG9zdGluZ0doUGFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBa0M7QUFFbEMsaUNBQWdDO0FBTWhDLDhCQUE4QjtBQUM5QixRQUFRO0FBQ1IsOEJBQThCO0FBQzlCLFNBQVMsaUJBQWlCLENBQUMsSUFBSTtJQUM3QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUNwRSxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLO0lBQ3JDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsTUFBTSxVQUFVLEdBQUc7WUFDakIsR0FBRyxFQUFFLHlCQUF5QixJQUFJLEVBQUU7WUFDcEMsTUFBTTtZQUNOLE9BQU8sRUFBRTtnQkFDUCxRQUFRLEVBQUUsc0RBQXNEO2dCQUNoRSxlQUFlLEVBQUUsS0FBSztnQkFDdEIsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLGdCQUFnQixFQUFFLHlCQUF5QjthQUM1QztTQUVGLENBQUE7UUFDRCxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNyQyxJQUFJO2dCQUNGLElBQUksR0FBRyxFQUFFO29CQUNQLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLENBQUE7b0JBQ3hDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtpQkFDWjtxQkFBTTtvQkFDTCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FB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