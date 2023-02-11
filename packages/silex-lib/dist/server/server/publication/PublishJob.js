"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const jsdom_1 = require("jsdom");
const request = require("request");
const sequential = require("promise-sequential");
const url_1 = require("url");
const Path = require("path");
const assert = require("assert");
const uuid = require("uuid");
const WebsiteRouter_1 = require("../router/WebsiteRouter");
const constants_1 = require("../../constants");
const DomPublisher_1 = require("./DomPublisher");
const DomTools_1 = require("../utils/DomTools");
// const TMP_FOLDER = '.tmp';
// // create the .tmp folder used by the publication classes
// const exists = fs.existsSync(TMP_FOLDER);
// if(!exists) fs.mkdirSync(TMP_FOLDER);
// shared map of PublishJob instances,
// these are all the publications currently taking place
const publishJobs = new Map();
// regularely check for ended publications
setInterval(() => {
    let nJobs = 0;
    let nDeleted = 0;
    publishJobs.forEach((publishJob) => {
        if (publishJob.pleaseDeleteMe) {
            publishJobs.delete(publishJob.id);
            nDeleted++;
        }
        nJobs++;
    });
    if (nDeleted > 0) {
        console.info('Cleaning publish jobs. Deleted', nDeleted, '/', nJobs);
    }
}, 60 * 1000);
class PublishJob {
    constructor(id, unifile, context) {
        this.id = id;
        this.unifile = unifile;
        this.context = context;
        this.abort = false;
        this.success = false;
        this.error = false;
        this.filesNotDownloaded = [];
        this.setStatus('Publication starting.');
        // files and folders paths
        this.rootPath = this.context.to.path;
        this.htmlFolder = this.rootPath + '/' + this.getHtmlFolder();
        this.cssFolder = this.rootPath + '/' + this.getCssFolder();
        this.jsFolder = this.rootPath + '/' + this.getJsFolder();
        this.assetsFolder = this.rootPath + '/' + this.getAssetsFolder();
        this.jsFile = this.jsFolder + '/script.js';
        this.cssFile = this.cssFolder + '/styles.css';
        console.log('--------------------------');
        console.log('Publish Job', id);
        console.log('Publish to:', this.rootPath, this.htmlFolder, this.cssFolder, this.assetsFolder, this.jsFolder);
        console.log('Silex instance:', context.url);
        this.pleaseDeleteMe = false;
        this.jar = request.jar();
        for (const key in this.context.cookies) {
            this.jar.setCookie(request.cookie(key + '=' + this.context.cookies[key]), context.url);
        }
    }
    static get(id) {
        return publishJobs.get(id);
    }
    /**
     * factory to create a publish job
     */
    static create({ publicationPath, file }, unifile, session, cookies, rootUrl, hostingProvider, config) {
        const context = {
            from: file,
            to: publicationPath,
            url: rootUrl,
            session: session.unifile,
            cookies,
            hostingProvider,
            config,
        };
        // stop other publications from the same user
        session.publicationId = session.publicationId || uuid.v4();
        const id = session.publicationId;
        if (publishJobs.has(id)) {
            publishJobs.get(id).stop();
        }
        try {
            // check input params
            assert.ok(!!publicationPath, 'Missing param "publicationPath"');
            assert.ok(!!file, 'Missing param "file"');
        }
        catch (e) {
            console.error('Invalid params', e);
            throw new Error('Received invalid params. ' + e.message);
        }
        const publishJob = new PublishJob(id, unifile, context);
        publishJobs.set(id, publishJob);
        publishJob.publish()
            .then(() => {
            if (publishJob.error) {
                console.warn(`Warning: possible error in PublishJob ${publishJob.id} (${publishJob.error})`);
            }
            publishJob.cleanup();
        })
            .catch((err) => {
            console.error(`PublishJob ${publishJob.id} throws an error (${err}).`, err);
            publishJob.error = true;
            publishJob.setStatus(err.message);
            publishJob.cleanup();
        });
        return publishJob;
    }
    stop() {
        if (this.isStopped() === false) {
            console.warn('stopping publication in progress');
            this.abort = true;
            this.setStatus('Publication canceled.');
        }
    }
    isStopped() {
        return this.error || this.abort || this.success;
    }
    getStatus() {
        return this.state;
    }
    setStatus(status) {
        console.info('Publication status:', status);
        this.state = status;
    }
    cleanup() {
        // console.info('PublishJob cleanup, will ask to be deleted in 60s', this.id);
        if (this.pleaseDeleteMe) {
            console.error('PublishJob was already marked for deletion', this.id);
        }
        else {
            setTimeout(() => {
                this.pleaseDeleteMe = true;
            }, 60 * 1000);
        }
    }
    getSuccessMessage() {
        // download errors
        const downloadMessage = this.filesNotDownloaded.length > 0 ? `
      Warning: these files could not be downloaded:
      <ul>
        <li>${this.filesNotDownloaded.join('</li><li>')}</li>
      </ul>
    ` : '';
        // final message
        return `<p>Done.</p><p>${downloadMessage}</p>`;
    }
    getHtmlFolder() {
        const defaultFolder = '';
        if (this.context.hostingProvider && this.context.hostingProvider.getHtmlFolder) {
            return (this.context.hostingProvider.getHtmlFolder(this.context, defaultFolder)) || defaultFolder;
        }
        else {
            return defaultFolder;
        }
    }
    getJsFolder() {
        const defaultFolder = 'js';
        if (this.context.hostingProvider && this.context.hostingProvider.getJsFolder) {
            return (this.context.hostingProvider.getJsFolder(this.context, defaultFolder)) || defaultFolder;
        }
        else {
            return defaultFolder;
        }
    }
    getCssFolder() {
        const defaultFolder = 'css';
        if (this.context.hostingProvider && this.context.hostingProvider.getCssFolder) {
            return (this.context.hostingProvider.getCssFolder(this.context, defaultFolder)) || defaultFolder;
        }
        else {
            return defaultFolder;
        }
    }
    getAssetsFolder() {
        const defaultFolder = 'assets';
        if (this.context.hostingProvider && this.context.hostingProvider.getAssetsFolder) {
            return (this.context.hostingProvider.getAssetsFolder(this.context, defaultFolder)) || defaultFolder;
        }
        else {
            return defaultFolder;
        }
    }
    getDestFolder(ext, tagName) {
        // tags
        if (tagName) {
            switch (tagName.toLowerCase()) {
                case 'script':
                    return this.getJsFolder();
                case 'link':
                    return this.getCssFolder();
                case 'img':
                case 'source':
                case 'video':
                    return this.getAssetsFolder();
            }
            // could be an iframe
            return null;
        }
        else if (ext === '.html') {
            return this.getHtmlFolder();
        }
        else {
            return this.getAssetsFolder();
        }
    }
    /**
     * the method called to publish a website to a location
     */
    async publish() {
        // check the state
        if (this.isStopped()) {
            console.warn('job is stopped', this.error, this.abort, this.success);
            return;
        }
        this.setStatus(`Downloading website ${this.context.from.name}`);
        // download site html and data
        let siteHtmlStr;
        let siteDataStr;
        try {
            const [siteHtml, siteData] = await WebsiteRouter_1.getSite(this.unifile, this.context.session, this.context.from.service, this.context.from.path);
            siteHtmlStr = siteHtml.toString('utf-8');
            siteDataStr = siteData.toString('utf-8');
        }
        catch (err) {
            console.error('Publication error, could not get website files:', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        // check the state
        if (this.isStopped()) {
            console.warn('job is stopped', this.error, this.abort, this.success);
            return;
        }
        // build folders tree
        this.setStatus(`Splitting file ${this.context.from.name}`);
        // this also works as url is set by cloud explorer's UnifileService::getUrl method
        //  const url = new URL((this.context.from as any).url)
        const url = new url_1.URL(`${this.context.config.ceOptions.rootUrl}/${this.context.from.service}/get/${this.context.from.path}`);
        const baseUrl = new url_1.URL(url.origin + Path.dirname(url.pathname) + '/');
        const baseUrlStr = baseUrl.href;
        // build the dom
        const { html, userHead } = DomTools_1.default.extractUserHeadTag(siteHtmlStr);
        // store site DOM in the context, for hosting providers hooks
        let dom;
        try {
            dom = new jsdom_1.JSDOM(html, { url: baseUrlStr });
        }
        catch (err) {
            console.error('Publication error, could not parse the website HTML:', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        // store site data in the context, for hosting providers hooks
        try {
            this.context.data = JSON.parse(siteDataStr);
        }
        catch (err) {
            console.error('Publication error, could not parse the website JSON data:', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        try {
            this.context.document = dom.window.document;
            // const domPublisher = new DomPublisher(dom, userHead, this.context.url, this.rootPath, (ext, tagName) => await this.getDestFolder(ext, tagName), this.context.data)
            // remove classes used by Silex during edition
            DomPublisher_1.cleanup(dom.window);
            // rewrite URLs and extract assets
            const to = new url_1.URL(`${this.context.config.ceOptions.rootUrl}/${this.context.to.service}/get/${this.context.to.path}/`).href;
            const hookedRootUrl = this.context.hostingProvider.getRootUrl ? this.context.hostingProvider.getRootUrl(this.context, baseUrl) : null;
            this.assets = DomPublisher_1.extractAssets({
                baseUrl: baseUrlStr,
                rootUrl: to,
                hookedRootUrl,
                win: dom.window,
                rootPath: this.rootPath,
                getDestFolder: (ext, tagName) => this.getDestFolder(ext, tagName),
            });
            this.tree = DomPublisher_1.splitInFiles({
                hookedRootUrl,
                win: dom.window,
                userHead,
            });
            // hide website before styles.css is loaded
            dom.window.document.head.innerHTML += '<style>body { opacity: 0; transition: .25s opacity ease; }</style>';
            // get the first page name, i.e. the default, e.g. index.html
            const newFirstPageName = this.context.hostingProvider && this.context.hostingProvider.getDefaultPageFileName ? this.context.hostingProvider.getDefaultPageFileName(this.context, this.context.data) : null;
            // define hooks
            const permalinkHook = (pageName) => {
                if (this.context.hostingProvider && this.context.hostingProvider.getPermalink) {
                    return this.context.hostingProvider.getPermalink(pageName, this.context);
                }
                return pageName.replace(new RegExp('^' + constants_1.Constants.PAGE_ID_PREFIX), '');
            };
            const pageTitleHook = (page) => {
                if (this.context.hostingProvider && this.context.hostingProvider.getPageTitle) {
                    return this.context.hostingProvider.getPageTitle(this.context.data.site.title, this.context);
                }
                // default hook adds the page display name
                return this.context.data.site.title + ' - ' + page.displayName;
            };
            const pageLinkHook = (href) => {
                if (this.context.hostingProvider && this.context.hostingProvider.getPageLink) {
                    // let the hosting provider create links
                    return this.context.hostingProvider.getPageLink(href, this.context);
                }
                else if (href.endsWith('index.html')) {
                    // links to ./ instead of index.html
                    return path_1.dirname(href) + '/';
                }
                // do nothing
                return href;
            };
            if (this.context.hostingProvider && this.context.hostingProvider.beforeSplit) {
                await this.context.hostingProvider.beforeSplit(this.context);
            }
            // split into pages
            this.pageActions = DomPublisher_1.splitPages({
                newFirstPageName,
                permalinkHook,
                pageTitleHook,
                pageLinkHook,
                win: dom.window,
                rootPath: this.rootPath,
                getDestFolder: (ext, tagName) => this.getDestFolder(ext, tagName),
                data: this.context.data,
            });
            // release the dom object
            dom.window.close();
        }
        catch (err) {
            console.error('Publication error, could not optimize the DOM:', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        // check the state
        if (this.isStopped()) {
            console.warn('job is stopped', 'error:', this.error, 'abort:', this.abort, 'success:', this.success);
            return;
        }
        // check existing folder structure (with stat) and download all assets
        let statRoot, statHtml, statCss, statJs, statAssets, assets;
        try {
            [statRoot, statHtml, statCss, statJs, statAssets, ...assets] = await this.readOperations();
        }
        catch (err) {
            // FIXME: will never go through here
            console.error('Publication error, could not download files:', this.assets.map((f) => f.displayName).join(', '), '. Error:', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        // check the state
        if (this.isStopped()) {
            console.warn('job is stopped', 'error:', this.error, 'abort:', this.abort, 'success:', this.success);
            return;
        }
        // write and upload all files in a batch operation
        try {
            await this.writeOperations(statRoot, statHtml, statCss, statJs, statAssets, ...assets);
        }
        catch (err) {
            console.error('An error occured in write operations', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        // check the state
        if (this.isStopped()) {
            console.warn('job is stopped', 'error:', this.error, 'abort:', this.abort, 'success:', this.success);
            return;
        }
        try {
            if (this.context.hostingProvider) {
                await this.context.hostingProvider.finalizePublication(this.context, (msg) => this.setStatus(msg));
            }
        }
        catch (err) {
            console.error('An error occured in hosting provider hook', err);
            this.error = true;
            this.setStatus(err.message);
            return;
        }
        // all operations done
        console.log('Publication done with success');
        this.setStatus(this.getSuccessMessage());
        this.success = true;
    }
    readOperations() {
        this.setStatus(`Looking for folders: <ul><li>${this.cssFolder}</li><li>${this.jsFolder}</li><li>${this.assetsFolder}</li></ul>`);
        // do not throw an error if the folder is not found, this is what we want to test
        // instead catch the error and do nothing so that the result is null in .then(stat
        const preventErr = (promise) => promise.catch((err) => {
            if (err.code !== 'ENOENT') {
                console.error('The stat operation failed with error:', err);
                this.error = true;
                this.setStatus(err.message);
            }
        });
        // start by testing if the folders exist before creating them
        // then download all assets
        // FIXME: should use unifile's batch method to avoid conflicts or the "too many clients" error in FTP
        // return Promise.all([
        return sequential([
            () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.rootPath)),
            () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.htmlFolder)),
            () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.cssFolder)),
            () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.jsFolder)),
            () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.assetsFolder)),
        ]
            // add the promises to download each asset
            .concat(this.downloadAllAssets(this.assets)));
    }
    writeOperations(statRoot, statHtml, statCss, statJs, statAssets, ...assets) {
        // build the batch actions
        this.setStatus(`Creating files <ul>${this.pageActions.map((action) => '<li>' + action.displayName + '</li>').join('')}<li>${this.cssFile}</li><li>${this.jsFile}</li></ul>And uploading ${assets.length} assets.`);
        // create an object to describe a batch of actions
        const batchActions = [];
        if (!statRoot) {
            batchActions.push({
                name: 'mkdir',
                path: this.rootPath,
            });
        }
        if (!statHtml && this.htmlFolder.replace(/\/$/, '') !== this.rootPath.replace(/\/$/, '')) {
            batchActions.push({
                name: 'mkdir',
                path: this.htmlFolder,
            });
        }
        batchActions.push(...this.pageActions);
        if (!statCss) {
            batchActions.push({
                name: 'mkdir',
                path: this.cssFolder,
            });
        }
        if (!statJs) {
            batchActions.push({
                name: 'mkdir',
                path: this.jsFolder,
            });
        }
        if (!statAssets) {
            batchActions.push({
                name: 'mkdir',
                path: this.assetsFolder,
            });
        }
        if (this.tree.styleTags.length > 0) {
            const cssAction = DomPublisher_1.domToFileOperations(this.tree.styleTags, this.cssFile, 'CSS styles');
            // show website after styles.css is loaded
            const showBodyRule = 'body.silex-runtime {opacity: 1;}\n';
            cssAction.content += showBodyRule;
            // create the style.css file
            batchActions.push(cssAction);
        }
        if (this.tree.scriptTags.length > 0) {
            batchActions.push(DomPublisher_1.domToFileOperations(this.tree.scriptTags, this.jsFile, 'JS scripts'));
        }
        const batchActionsWithAssets = batchActions.concat(assets
            .filter((file) => !!file)
            .map((file) => {
            return {
                name: 'writeFile',
                path: file.path,
                content: file.content,
            };
        }));
        // beforeWrite hook
        const hookedActions = this.context.hostingProvider.beforeWrite ? this.context.hostingProvider.beforeWrite(this.context, batchActionsWithAssets) : batchActionsWithAssets;
        // creates all files
        return this.unifile.batch(this.context.session, this.context.to.service, hookedActions);
    }
    // create the promises to download each asset
    downloadAllAssets(files) {
        return files.map((file) => {
            const srcPath = decodeURIComponent(file.srcPath);
            const destPath = decodeURIComponent(file.destPath);
            const shortSrcPath = srcPath.substr(srcPath.lastIndexOf('/') + 1);
            return () => {
                return new Promise((resolve, reject) => {
                    if (this.isStopped()) {
                        console.warn('job is stopped', this.error, this.abort, this.success);
                        resolve(null);
                        return;
                    }
                    this.setStatus(`Downloading file ${shortSrcPath}...`);
                    // load from URL
                    // "encoding: null" is needed for images (which in this case will be served from /static)
                    // for(let key in this.context.session) console.log('unifile session key', key, this.context.session[key]);
                    // "jar" is needed to pass the client cookies to unifile, because we load resources from different servers including ourself
                    request(srcPath, {
                        jar: this.jar,
                        encoding: null,
                    }, (err, res, data) => {
                        if (err) {
                            reject(err);
                        }
                        else if (res.statusCode !== 200) {
                            console.warn(`Could not download file ${srcPath}.`);
                            reject(`Could not download file ${srcPath}.`);
                        }
                        else {
                            resolve({
                                content: data,
                                path: destPath,
                            });
                        }
                    });
                })
                    .catch((err) => {
                    this.filesNotDownloaded.push(shortSrcPath);
                });
            };
        });
    }
}
exports.default = PublishJob;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHVibGlzaEpvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvcHVibGljYXRpb24vUHVibGlzaEpvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUE4QjtBQUM5QixpQ0FBNkI7QUFDN0IsbUNBQWtDO0FBQ2xDLGlEQUFnRDtBQUVoRCw2QkFBeUI7QUFDekIsNkJBQTRCO0FBQzVCLGlDQUFnQztBQUNoQyw2QkFBNEI7QUFJNUIsMkRBQWlEO0FBQ2pELCtDQUEyQztBQUczQyxpREFNdUI7QUFDdkIsZ0RBQXdDO0FBRXhDLDZCQUE2QjtBQUU3Qiw0REFBNEQ7QUFDNUQsNENBQTRDO0FBQzVDLHdDQUF3QztBQUV4QyxzQ0FBc0M7QUFDdEMsd0RBQXdEO0FBQ3hELE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDN0IsMENBQTBDO0FBQzFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7SUFDZixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7SUFDYixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUE7SUFDaEIsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1FBQ2pDLElBQUksVUFBVSxDQUFDLGNBQWMsRUFBRTtZQUM3QixXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNqQyxRQUFRLEVBQUUsQ0FBQTtTQUNYO1FBQ0QsS0FBSyxFQUFFLENBQUE7SUFDVCxDQUFDLENBQUMsQ0FBQTtJQUNGLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRTtRQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDckU7QUFDSCxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFBO0FBRWIsTUFBcUIsVUFBVTtJQW1FN0IsWUFBbUIsRUFBVSxFQUFVLE9BQU8sRUFBVSxPQUF1QjtRQUE1RCxPQUFFLEdBQUYsRUFBRSxDQUFRO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBQTtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBbEJ2RSxVQUFLLEdBQUcsS0FBSyxDQUFBO1FBQ2IsWUFBTyxHQUFHLEtBQUssQ0FBQTtRQUNmLFVBQUssR0FBRyxLQUFLLENBQUE7UUFDYix1QkFBa0IsR0FBRyxFQUFFLENBQUE7UUFnQjdCLElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtRQUV2QywwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7UUFDNUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7UUFDMUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDeEQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDaEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQTtRQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFBO1FBRTdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtRQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM1RyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUUzQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQTtRQUUzQixJQUFJLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUN4QixLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQUU7SUFDcEksQ0FBQztJQXZGRCxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUNEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFlLEVBQUUsZUFBZ0MsRUFBRSxNQUFjO1FBQ25JLE1BQU0sT0FBTyxHQUFtQjtZQUM5QixJQUFJLEVBQUUsSUFBSTtZQUNWLEVBQUUsRUFBRSxlQUFlO1lBQ25CLEdBQUcsRUFBRSxPQUFPO1lBQ1osT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO1lBQ3hCLE9BQU87WUFDUCxlQUFlO1lBQ2YsTUFBTTtTQUNQLENBQUE7UUFDRCw2Q0FBNkM7UUFDN0MsT0FBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQTtRQUMxRCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFBO1FBQ2hDLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUN2QixXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1NBQzNCO1FBQ0QsSUFBSTtZQUNGLHFCQUFxQjtZQUNyQixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsaUNBQWlDLENBQUMsQ0FBQTtZQUMvRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTtTQUMxQztRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUN6RDtRQUNELE1BQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDdkQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDL0IsVUFBVSxDQUFDLE9BQU8sRUFBRTthQUNuQixJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1QsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFO2dCQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxVQUFVLENBQUMsRUFBRSxLQUFLLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO2FBQzdGO1lBQ0QsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3RCLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLFVBQVUsQ0FBQyxFQUFFLHFCQUFxQixHQUFHLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUMzRSxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUN2QixVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNqQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDdEIsQ0FBQyxDQUFDLENBQUE7UUFDRixPQUFPLFVBQVUsQ0FBQTtJQUNuQixDQUFDO0lBMENELElBQUk7UUFDRixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxLQUFLLEVBQUU7WUFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFBO1lBQ2hELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1lBQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtTQUN4QztJQUNILENBQUM7SUFDRCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNqRCxDQUFDO0lBQ0QsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtJQUNuQixDQUFDO0lBQ0QsU0FBUyxDQUFDLE1BQU07UUFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQzNDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFBO0lBQ3JCLENBQUM7SUFDRCxPQUFPO1FBQ0wsOEVBQThFO1FBQzlFLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1NBQUU7YUFBTTtZQUNyRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNkLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFBO1lBQzVCLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7U0FDZDtJQUNILENBQUM7SUFDRCxpQkFBaUI7UUFDZixrQkFBa0I7UUFDbEIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7Y0FHbkQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7O0tBRWxELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtRQUNOLGdCQUFnQjtRQUNoQixPQUFPLGtCQUFrQixlQUFlLE1BQU0sQ0FBQTtJQUNoRCxDQUFDO0lBQ0QsYUFBYTtRQUNYLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQTtRQUN4QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRTtZQUM5RSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsSUFBSSxhQUFhLENBQUE7U0FDbEc7YUFBTTtZQUFFLE9BQU8sYUFBYSxDQUFBO1NBQUU7SUFDakMsQ0FBQztJQUNELFdBQVc7UUFDVCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUE7UUFDMUIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUU7WUFDNUUsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLElBQUksYUFBYSxDQUFBO1NBQ2hHO2FBQU07WUFBRSxPQUFPLGFBQWEsQ0FBQTtTQUFFO0lBQ2pDLENBQUM7SUFDRCxZQUFZO1FBQ1YsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFBO1FBQzNCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFO1lBQzdFLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQyxJQUFJLGFBQWEsQ0FBQTtTQUNqRzthQUFNO1lBQUUsT0FBTyxhQUFhLENBQUE7U0FBRTtJQUNqQyxDQUFDO0lBQ0QsZUFBZTtRQUNiLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQTtRQUM5QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRTtZQUNoRixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsSUFBSSxhQUFhLENBQUE7U0FDcEc7YUFBTTtZQUFFLE9BQU8sYUFBYSxDQUFBO1NBQUU7SUFDakMsQ0FBQztJQUNELGFBQWEsQ0FBQyxHQUFXLEVBQUUsT0FBZTtRQUN4QyxPQUFPO1FBQ1AsSUFBSSxPQUFPLEVBQUU7WUFDWCxRQUFRLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDN0IsS0FBSyxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO2dCQUMzQixLQUFLLE1BQU07b0JBQ1QsT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7Z0JBQzVCLEtBQUssS0FBSyxDQUFDO2dCQUNYLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssT0FBTztvQkFDVixPQUFPLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTthQUNoQztZQUNELHFCQUFxQjtZQUNyQixPQUFPLElBQUksQ0FBQTtTQUNaO2FBQU0sSUFBSSxHQUFHLEtBQUssT0FBTyxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO1NBQzVCO2FBQU87WUFDTixPQUFPLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtTQUM5QjtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsa0JBQWtCO1FBQ2xCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNwRSxPQUFNO1NBQ1A7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRS9ELDhCQUE4QjtRQUM5QixJQUFJLFdBQW1CLENBQUE7UUFDdkIsSUFBSSxXQUFtQixDQUFBO1FBQ3ZCLElBQUk7WUFDRixNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxHQUFHLE1BQU0sdUJBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNqSSxXQUFXLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN4QyxXQUFXLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUN6QztRQUFDLE9BQU0sR0FBRyxFQUFFO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxpREFBaUQsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNyRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMzQixPQUFNO1NBQ1A7UUFFRCxrQkFBa0I7UUFDbEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3BFLE9BQU07U0FDUDtRQUVELHFCQUFxQjtRQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTFELGtGQUFrRjtRQUNsRix1REFBdUQ7UUFDdkQsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQzFILE1BQU0sT0FBTyxHQUFHLElBQUksU0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUE7UUFDdEUsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQTtRQUUvQixnQkFBZ0I7UUFDaEIsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxrQkFBUSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRW5FLDZEQUE2RDtRQUM3RCxJQUFJLEdBQUcsQ0FBQTtRQUNQLElBQUk7WUFDRixHQUFHLEdBQUcsSUFBSSxhQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7U0FDM0M7UUFBQyxPQUFNLEdBQUcsRUFBRTtZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0RBQXNELEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDMUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7WUFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDM0IsT0FBTTtTQUNQO1FBRUQsOERBQThEO1FBQzlELElBQUk7WUFDRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBbUIsQ0FBQTtTQUM5RDtRQUFDLE9BQU0sR0FBRyxFQUFFO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQywyREFBMkQsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUMvRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMzQixPQUFNO1NBQ1A7UUFDRCxJQUFJO1lBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUE7WUFDM0MscUtBQXFLO1lBQ3JLLDhDQUE4QztZQUM5QyxzQkFBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNuQixrQ0FBa0M7WUFDbEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxTQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQTtZQUMzSCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7WUFDckksSUFBSSxDQUFDLE1BQU0sR0FBRyw0QkFBYSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsVUFBVTtnQkFDbkIsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsYUFBYTtnQkFDYixHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU07Z0JBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixhQUFhLEVBQUUsQ0FBQyxHQUFXLEVBQUUsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUM7YUFDbEYsQ0FBQyxDQUFBO1lBQ0YsSUFBSSxDQUFDLElBQUksR0FBRywyQkFBWSxDQUFDO2dCQUN2QixhQUFhO2dCQUNiLEdBQUcsRUFBRSxHQUFHLENBQUMsTUFBTTtnQkFDZixRQUFRO2FBQ1QsQ0FBQyxDQUFBO1lBQ0YsMkNBQTJDO1lBQzNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksb0VBQW9FLENBQUE7WUFDMUcsNkRBQTZEO1lBQzdELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO1lBQzFNLGVBQWU7WUFDZixNQUFNLGFBQWEsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRTtnQkFDekMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUU7b0JBQzdFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQ3pFO2dCQUNELE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEdBQUcscUJBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUN6RSxDQUFDLENBQUE7WUFDRCxNQUFNLGFBQWEsR0FBRyxDQUFDLElBQWMsRUFBRSxFQUFFO2dCQUN2QyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRTtvQkFDN0UsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQzdGO2dCQUNELDBDQUEwQztnQkFDMUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO1lBQ2hFLENBQUMsQ0FBQTtZQUNELE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFO29CQUM1RSx3Q0FBd0M7b0JBQ3hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQ3BFO3FCQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDdEMsb0NBQW9DO29CQUNwQyxPQUFPLGNBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUE7aUJBQzNCO2dCQUNELGFBQWE7Z0JBQ2IsT0FBTyxJQUFJLENBQUE7WUFDYixDQUFDLENBQUE7WUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRTtnQkFDNUUsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQzdEO1lBQ0QsbUJBQW1CO1lBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcseUJBQVUsQ0FBQztnQkFDNUIsZ0JBQWdCO2dCQUNoQixhQUFhO2dCQUNiLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU07Z0JBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixhQUFhLEVBQUUsQ0FBQyxHQUFXLEVBQUUsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUM7Z0JBQy9FLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUk7YUFDMUIsQ0FBQyxDQUFBO1lBRUYseUJBQXlCO1lBQ3pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7U0FDbkI7UUFBQyxPQUFNLEdBQUcsRUFBRTtZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDcEUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7WUFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDM0IsT0FBTTtTQUNQO1FBRUQsa0JBQWtCO1FBQ2xCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNwRyxPQUFNO1NBQ1A7UUFFRCxzRUFBc0U7UUFDdEUsSUFBSSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQTtRQUMzRCxJQUFJO1lBQ0YsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7U0FDM0Y7UUFBQyxPQUFNLEdBQUcsRUFBRTtZQUNYLG9DQUFvQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNoSSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMzQixPQUFNO1NBQ1A7UUFFRCxrQkFBa0I7UUFDbEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3BHLE9BQU07U0FDUDtRQUVELGtEQUFrRDtRQUNsRCxJQUFJO1lBQ0YsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQTtTQUN2RjtRQUFDLE9BQU0sR0FBRyxFQUFFO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUMxRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMzQixPQUFNO1NBQ1A7UUFFRCxrQkFBa0I7UUFDbEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3BHLE9BQU07U0FDUDtRQUVELElBQUk7WUFDRixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFO2dCQUNoQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTthQUNuRztTQUNGO1FBQUMsT0FBTSxHQUFHLEVBQUU7WUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQy9ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1lBQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzNCLE9BQU07U0FDUDtRQUVELHNCQUFzQjtRQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUE7UUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFBO1FBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxjQUFjO1FBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsSUFBSSxDQUFDLFNBQVMsWUFBWSxJQUFJLENBQUMsUUFBUSxZQUFZLElBQUksQ0FBQyxZQUFZLFlBQVksQ0FBQyxDQUFBO1FBRWhJLGlGQUFpRjtRQUNqRixrRkFBa0Y7UUFDbEYsTUFBTSxVQUFVLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNwRCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO2dCQUN6QixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUMzRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtnQkFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7YUFDMUI7UUFDTCxDQUFDLENBQUMsQ0FBQTtRQUVGLDZEQUE2RDtRQUM3RCwyQkFBMkI7UUFDM0IscUdBQXFHO1FBQ3JHLHVCQUF1QjtRQUN2QixPQUFPLFVBQVUsQ0FBQztZQUNoQixHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUN0RztZQUNELDBDQUEwQzthQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDL0MsQ0FBQztJQUVELGVBQWUsQ0FBQyxRQUFpQixFQUFFLFFBQWlCLEVBQUUsT0FBZ0IsRUFBRSxNQUFlLEVBQUUsVUFBbUIsRUFBRSxHQUFHLE1BQWdCO1FBQy9ILDBCQUEwQjtRQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLHNCQUFzQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLFlBQVksSUFBSSxDQUFDLE1BQU0sMkJBQTRCLE1BQU0sQ0FBQyxNQUFPLFVBQVUsQ0FBQyxDQUFBO1FBQ3BOLGtEQUFrRDtRQUNsRCxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7UUFDdkIsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUTthQUNwQixDQUFDLENBQUE7U0FDSDtRQUNELElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRTtZQUN4RixZQUFZLENBQUMsSUFBSSxDQUFDO2dCQUNoQixJQUFJLEVBQUUsT0FBTztnQkFDYixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7YUFDdEIsQ0FBQyxDQUFBO1NBQ0g7UUFDRCxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRXRDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixZQUFZLENBQUMsSUFBSSxDQUFDO2dCQUNoQixJQUFJLEVBQUUsT0FBTztnQkFDYixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVM7YUFDckIsQ0FBQyxDQUFBO1NBQ0g7UUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsWUFBWSxDQUFDLElBQUksQ0FBQztnQkFDaEIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRO2FBQ3BCLENBQUMsQ0FBQTtTQUNIO1FBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWTthQUN4QixDQUFDLENBQUE7U0FDSDtRQUNELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNsQyxNQUFNLFNBQVMsR0FBRyxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO1lBQ3RGLDBDQUEwQztZQUMxQyxNQUFNLFlBQVksR0FBRyxvQ0FBb0MsQ0FBQTtZQUN6RCxTQUFTLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQTtZQUNqQyw0QkFBNEI7WUFDNUIsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUM3QjtRQUNELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNuQyxZQUFZLENBQUMsSUFBSSxDQUFDLGtDQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQTtTQUN4RjtRQUNELE1BQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FDaEQsTUFBTTthQUNMLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUN4QixHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNaLE9BQU87Z0JBQ0wsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87YUFDdEIsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUNILENBQUE7UUFDRCxtQkFBbUI7UUFDbkIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQTtRQUV4SyxvQkFBb0I7UUFDcEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDekYsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxpQkFBaUIsQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3hCLE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNoRCxNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7WUFDbEQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ2pFLE9BQU8sR0FBRyxFQUFFO2dCQUNWLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO3dCQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7d0JBQ3BFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDYixPQUFNO3FCQUNQO29CQUNELElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQXFCLFlBQWEsS0FBSyxDQUFDLENBQUE7b0JBQ3ZELGdCQUFnQjtvQkFDaEIseUZBQXlGO29CQUN6RiwyR0FBMkc7b0JBQzNHLDRIQUE0SDtvQkFDNUgsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDZixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7d0JBQ2IsUUFBUSxFQUFFLElBQUk7cUJBQ2YsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7d0JBQ3BCLElBQUksR0FBRyxFQUFFOzRCQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTt5QkFBRTs2QkFBTSxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFOzRCQUN4RCxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUE0QixPQUFRLEdBQUcsQ0FBQyxDQUFBOzRCQUNyRCxNQUFNLENBQUMsMkJBQTRCLE9BQVEsR0FBRyxDQUFDLENBQUE7eUJBQ2hEOzZCQUFNOzRCQUNMLE9BQU8sQ0FBQztnQ0FDTixPQUFPLEVBQUUsSUFBSTtnQ0FDYixJQUFJLEVBQUUsUUFBUTs2QkFDZixDQUFDLENBQUE7eUJBQ0g7b0JBQ0gsQ0FBQyxDQUFDLENBQUE7Z0JBQ0osQ0FBQyxDQUFDO3FCQUNELEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNiLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7Z0JBQzVDLENBQUMsQ0FBQyxDQUFBO1lBQ0osQ0FBQyxDQUFBO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0NBQ0Y7QUFuZkQsNkJBbWZDIn0=