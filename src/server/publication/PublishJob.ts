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

const uuid = require('uuid');
const request = require('request');
const assert = require('assert');
const Path = require('path');
const { URL } = require('url');
const { JSDOM } = require('jsdom');
const sequential = require('promise-sequential');

import DomTools from '../utils/DomTools';
import DomPublisher from './DomPublisher';

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
  publishJobs.forEach(publishJob => {
    if(publishJob.pleaseDeleteMe) {
      publishJobs.delete(publishJob.id);
      nDeleted++;
    }
    nJobs++;
  });
  if(nDeleted > 0) {
    console.info('Cleaning publish jobs. Deleted', nDeleted, '/', nJobs);
  }
}, 60*1000);

export default class PublishJob {
  static get(id) {
    return publishJobs.get(id);
  }
  /**
   * factory to create a publish job
   */
  static create({ publicationPath, file }, unifile, session, cookies, rootUrl, hostingProvider): PublishJob {
    // stop other publications from the same user
    session.publicationId = session.publicationId || uuid.v4();
    const id = session.publicationId;
    if(publishJobs.has(id)) {
      publishJobs.get(id).stop();
    }
    try {
      // check input params
      assert.ok(!!publicationPath, 'Missing param "publicationPath"');
      assert.ok(!!file, 'Missing param "file"');
    }
    catch(e) {
      console.error('Invalid params', e);
      throw new Error('Received invalid params. ' + e.message);
    }
    const publishJob = new PublishJob(id, unifile, publicationPath, session, cookies, rootUrl, hostingProvider);
    publishJobs.set(id, publishJob);
    publishJob.publish(file)
    .then(() => {
      console.info(`PublishJob ${publishJob.id} success. Possibly with error:`, !!publishJob.error);
      publishJob.cleanup()
    })
    .catch((err) => {
      console.error(`PublishJob ${publishJob.id} throws an error (${err}).`, err);
      publishJob.error = true;
      publishJob.setStatus(err.message);
      publishJob.cleanup()
    })
    return publishJob;
  }

  private abort = false;
  private success = false;
  private error = false;
  private filesNotDownloaded = [];
  private rootPath: string;
  private htmlFolder: string;
  private cssFolder: string;
  private jsFolder: string;
  private assetsFolder: string;
  private jsFile: string;
  private cssFile: string;
  private pleaseDeleteMe: boolean;
  private jar: any;
  private state: string;
  private tree: any;
  private pageActions: any;

  constructor(public id:string, private unifile, private publicationPath, private session, private cookies, private rootUrl:string, private hostingProvider) {
    console.log('---------------\nNew Publish Job', id, '\nPublish to:', publicationPath.url, '\nSilex instance:', rootUrl, '\n--------------');
    this.setStatus('Publication starting.');


    // files and folders paths
    this.rootPath = this.publicationPath.path;
    this.htmlFolder = this.rootPath + '/' + this.getHtmlFolder();
    this.cssFolder = this.rootPath + '/' + this.getCssFolder();
    this.jsFolder = this.rootPath + '/' + this.getJsFolder();
    this.assetsFolder = this.rootPath + '/' + this.getAssetsFolder();
    this.jsFile = this.jsFolder + '/script.js';
    this.cssFile = this.cssFolder + '/styles.css';


    this.pleaseDeleteMe = false;

    this.jar = request.jar();
    for(let key in this.cookies) this.jar.setCookie(request.cookie(key + '=' + this.cookies[key]), rootUrl);
  }
  stop() {
    if(this.isStopped() === false) {
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
    this.state = status;
  }
  cleanup() {
    // console.info('PublishJob cleanup, will ask to be deleted in 60s', this.id);
    if(this.pleaseDeleteMe) console.error('PublishJob was already marked for deletion', this.id);
    else {
      setTimeout(() => {
        this.pleaseDeleteMe = true;
      }, 60*1000);
    }
  }
  getSuccessMessage() {
    if(this.filesNotDownloaded.length > 0) {
      return 'Done. <br><br>Warning: these files could not be downloaded: <ul><li>' + this.filesNotDownloaded.join('</li><li>') + '</li></ul>';
    }
    return 'Done.';
  }
  getHtmlFolder() {
    const defaultFolder = '';
    if(this.hostingProvider && this.hostingProvider.getHtmlFolder) {
      return this.hostingProvider.getHtmlFolder(defaultFolder) || defaultFolder;
    }
    else return defaultFolder;
  }
  getJsFolder() {
    const defaultFolder = 'js';
    if(this.hostingProvider && this.hostingProvider.getJsFolder) {
      return this.hostingProvider.getJsFolder(defaultFolder) || defaultFolder;
    }
    else return defaultFolder;
  }
  getCssFolder() {
    const defaultFolder = 'css';
    if(this.hostingProvider && this.hostingProvider.getCssFolder) {
      return this.hostingProvider.getCssFolder(defaultFolder) || defaultFolder;
    }
    else return defaultFolder;
  }
  getAssetsFolder() {
    const defaultFolder = 'assets';
    if(this.hostingProvider && this.hostingProvider.getAssetsFolder) {
      return this.hostingProvider.getAssetsFolder(defaultFolder) || defaultFolder;
    }
    else return defaultFolder;
  }
  getDestFolder(ext, tagName) {
    // tags
    if(tagName) {
      switch(tagName.toLowerCase()) {
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
    else if(ext === '.html') {
      return this.getHtmlFolder();
    }
    // css url()
    else  {
      return this.getAssetsFolder();
    }
  }

  /**
   * the method called to publish a website to a location
   * @param {?string=} file to download and publish
   */
  publish(file) {
    if(this.isStopped()) {
      console.warn('job is stopped', this.error, this.abort, this.success);
      return;
    }

    // download file
    this.setStatus(`Downloading website ${file.name}`);
    return this.unifile.readFile(this.session.unifile, file.service, file.path)
    .catch(err => {
      console.error('Publication error, could not download file:', err);
      this.error = true;
      this.setStatus(err.message);
    })

    // build folders tree
    .then(buffer => {
      if(this.isStopped()) {
        console.warn('job is stopped', this.error, this.abort, this.success);
        return;
      }
      this.setStatus(`Splitting file ${file.name}`);
      const url = new URL(file.url);
      const baseUrl = new URL(url.origin + Path.dirname(url.pathname) + '/');

      // build the dom
      const { html, userHead } = DomTools.extractUserHeadTag(buffer.toString('utf-8'));
      const dom = new JSDOM(html, { url: baseUrl.href });
      const domPublisher = new DomPublisher(dom, userHead, this.rootUrl, this.rootPath, (ext, tagName) => this.getDestFolder(ext, tagName));
      // remove classes used by Silex during edition
      domPublisher.cleanup();
      // rewrite URLs and extract assets
      this.tree = domPublisher.extractAssets(baseUrl);
      // hide website before styles.css is loaded
      dom.window.document.head.innerHTML += '<style>body { opacity: 0; transition: .25s opacity ease; }</style>';
      // split into pages
      const newFirstPageName = this.hostingProvider && this.hostingProvider.getDefaultPageFileName ? this.hostingProvider.getDefaultPageFileName() : null;
      this.pageActions = domPublisher.split(newFirstPageName);
      // release the dom object
      dom.window.close();
    })
    .catch(err => {
      console.error('Publication error, could not extract assets from file:', err);
      this.error = true;
      this.setStatus(err.message);
    })
    // download all assets
    // check existing folder structure
    .then(() => {
      if(this.isStopped()) {
        console.warn('job is stopped', this.error, this.abort, this.success);
        return [];
      }
      return this.readOperations();
    })
    .catch(err => {
      // FIXME: will never go through here
      console.error('Publication error, could not download files:', this.tree.actions.map(action => action.displayName).join(', '), '. Error:', err);
      this.error = true;
      this.setStatus(err.message);
    })
    // write and upload all files in a batch operation
    .then(([statRoot, statHtml, statCss, statJs, statAssets, ...assets]) => {
      if(this.isStopped()) {
        console.warn('job is stopped', this.error, this.abort, this.success);
        return;
      }
      return this.writeOperations(statRoot, statHtml, statCss, statJs, statAssets, ...assets)
    })
    .catch(err => {
      console.error('An error occured in unifile batch', err, err);
      this.error = true;
      this.setStatus(err.message);
    })
    .then(() => {
      if(this.isStopped()) {
        console.warn('job is stopped', this.error, this.abort, this.success);
        return Promise.resolve();
      }
      if(!this.hostingProvider) {
        return Promise.resolve();
      }
      return this.hostingProvider.finalizePublication(file, this.publicationPath, this.session.unifile, msg => this.setStatus(msg));
    })
    // all operations done
    .then(() => {
      if(this.isStopped()) {
        console.warn('job is stopped', this.error, this.abort, this.success);
        return;
      }
      console.log('Publication done with success');
      this.setStatus(this.getSuccessMessage());
      this.success = true;
    })
  }

  readOperations() {
    this.setStatus(`Looking for folders: <ul><li>${this.cssFolder}</li><li>${this.jsFolder}</li><li>${this.assetsFolder}</li></ul>`);

    // do not throw an error if the folder is not found, this is what we want to test
    // instead catch the error and do nothing so that the result is null in .then(stat
    const preventErr = promise => promise.catch(err => {
      if(err.code != 'ENOENT') {
        throw err;
      }
    });

    // start by testing if the folders exist before creating them
    // then download all assets
    // FIXME: should use unifile's batch method to avoid conflicts or the "too many clients" error in FTP
    //return Promise.all([
    return sequential([
      () => preventErr(this.unifile.stat(this.session.unifile, this.publicationPath.service, this.rootPath)),
      () => preventErr(this.unifile.stat(this.session.unifile, this.publicationPath.service, this.htmlFolder)),
      () => preventErr(this.unifile.stat(this.session.unifile, this.publicationPath.service, this.cssFolder)),
      () => preventErr(this.unifile.stat(this.session.unifile, this.publicationPath.service, this.jsFolder)),
      () => preventErr(this.unifile.stat(this.session.unifile, this.publicationPath.service, this.assetsFolder)),
    ]
    // add the promises to download each asset
    .concat(this.downloadAllAssets(this.tree.actions)))
  }

  writeOperations(statRoot, statHtml, statCss, statJs, statAssets, ...assets) {
    // build the batch actions
    this.setStatus(`Creating files <ul>${this.pageActions.map(action => '<li>' + action.displayName + '</li>').join('')}<li>${this.cssFile}</li><li>${this.jsFile}</li></ul>And uploading ${ assets.length } assets.`);
    // create an object to describe a batch of actions
    const batchActions = [];
    if(!statRoot) {
      batchActions.push({
        name: 'mkdir',
        path: this.rootPath,
      });
    }
    if(!statHtml) {
      batchActions.push({
        name: 'mkdir',
        path: this.htmlFolder,
      });
    }
    batchActions.push(...this.pageActions);

    if(!statCss) {
      batchActions.push({
        name: 'mkdir',
        path: this.cssFolder,
      });
    }
    if(!statJs) {
      batchActions.push({
        name: 'mkdir',
        path: this.jsFolder,
      });
    }
    if(!statAssets) {
      batchActions.push({
        name: 'mkdir',
        path: this.assetsFolder,
      });
    }
    if(this.tree.styleTags.length > 0) {
      // show website after styles.css is loaded
      const showBodyRule = 'body.silex-runtime {opacity: 1;}\n';
      // create the style.css file
      batchActions.push({
        name: 'writefile',
        path: this.cssFile,
        content: this.tree.styleTags.reduce((prev, tag) => prev + '\n' + tag.innerHTML, '') + showBodyRule,
      });
    }
    if(this.tree.scriptTags.length > 0) {
      batchActions.push({
        name: 'writefile',
        path: this.jsFile,
        content: this.tree.scriptTags.reduce((prev, tag) => prev + '\n' + tag.innerHTML, ''),
      });
    }
    const batchActionsWithAssets = batchActions.concat(
      assets
      .filter(file => !!file)
      .map(file => {
        return {
          name: 'writeFile',
          path: file.path,
          content: file.content,
        };
      })
    );
    // console.log('Batch actions:', batchActionsWithAssets.filter(action => !!action).map(action => action.path));
    return this.unifile.batch(this.session.unifile, this.publicationPath.service, batchActionsWithAssets)
  }

  // create the promises to download each asset
  downloadAllAssets(files) {
    return files.map(file => {
      const srcPath = decodeURIComponent(file.srcPath);
      const destPath = decodeURIComponent(file.destPath);
      const shortSrcPath = srcPath.substr(srcPath.lastIndexOf('/') + 1);
      return () => {
        return new Promise((resolve, reject) => {
          if(this.isStopped()) {
            console.warn('job is stopped', this.error, this.abort, this.success);
            resolve();
            return;
          }
          this.setStatus(`Downloading file ${ shortSrcPath }...`);
          // load from URL
          // "encoding: null" is needed for images (which in this case will be served from /static)
          // for(let key in this.session.unifile) console.log('unifile session key', key, this.session.unifile[key]);
          // "jar" is needed to pass the client cookies to unifile, because we load resources from different servers including ourself
          request(srcPath, {
            jar: this.jar,
            encoding: null,
          }, (err, res, data) => {
            if(err) reject(err);
            else if(res.statusCode != 200) {
              console.warn(`Could not download file ${ srcPath }.`);
              reject(`Could not download file ${ srcPath }.`);
            }
            else {
              resolve({
                content: data,
                path: destPath,
              });
            }
          });
        })
        .catch(err => {
          this.filesNotDownloaded.push(shortSrcPath);
        });
      }
    });
  }
}

