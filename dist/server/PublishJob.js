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

const request = require('request');
const assert = require('assert');
const Path = require('path');
const { URL } = require('url');
const { JSDOM } = require('jsdom');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const sequential = require('promise-sequential');

const DomPublisher = require('./DomPublisher.js');

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
  console.info('Cleaning publish jobs. Deleted', nDeleted, '/', nJobs);
}, 60*1000);

module.exports = class PublishJob {
  static get(id) {
    return publishJobs.get(id);
  }
  /**
   * factory to create a publish job
   */
  static create(id, { folder, file }, unifile, session, cookies, serverUrl) {
    // FIXME: several publications should be possible, e.g. when you publish 2 different websites from 2 browser tabs. So we should have an ID which is generated, then returned to the client side to be used when calling cancel or publishState
    // stop other compilations from the same user
    if(publishJobs.has(id)) {
      publishJobs.get(id).stop();
    }
    try {
      // check input params
      assert.ok(!!folder, 'Missing param "folder"');
      assert.ok(!!file, 'Missing param "file"');
    }
    catch(e) {
      console.error('Invalid params', e);
      res.status(400).send({
        message: 'Received invalid params. ' + e.message,
      });
      return;
    }
    const publishJob = new PublishJob(id, unifile, folder, session, cookies, serverUrl);
    publishJobs.set(id, publishJob);
    publishJob.publish(file)
    .then(() => {
      console.info(`PublishJob ${publishJob.id} success.`, !!this.error);
      publishJob.cleanup()
    })
    .catch((err) => {
      console.info(`PublishJob ${publishJob.id} error (${err}).`);
      publishJob.cleanup()
    })
    return publishJob;
  }

  constructor(id, unifile, folder, session, cookies, serverUrl) {
    this.id = id;
    this.unifile = unifile;
    this.folder = folder;
    this.session = session;
    this.cookies = cookies;
    this.abort = false;
    this.success = false;
    this.error = false;
    this.filesNotDownloaded = [];
    this.setStatus('In progress.');
    // this.tmpFolder = Path.resolve(TMP_FOLDER, `publication_${this.id}`);

    // files and folders paths
    this.rootPath = this.folder.path;
    this.indexFile = this.rootPath + '/index.html';
    this.cssFolder = this.rootPath + '/css';
    this.jsFolder = this.rootPath + '/js';
    this.assetsFolder = this.rootPath + '/assets';
    this.jsFile = this.jsFolder + '/script.js';
    this.cssFile = this.cssFolder + '/styles.css';


    this.pleaseDeleteMe = false;

    this.jar = request.jar();
    for(let key in this.cookies) this.jar.setCookie(request.cookie(key + '=' + this.cookies[key]), serverUrl);
  }
  stop() {
    if(this.isStopped() === false) {
      console.warn('stopping publication in progress');
      this.abort = true;
      this.setStatus('Canceled.');
    }
  }
  isStopped() {
    return this.error || this.abort || this.success;
  }
  getStatus() {
    return this.state;
  }
  setStatus(status) {
    // console.log(`Status changed for PublishJob ${this.id}: ${status}`);
    this.state = status;
  }
  cleanup() {
    // console.info('PublishJob cleanup, will ask to be deleted in 60s', this.id);
    if(this.pleaseDeleteMe) console.error('PublishJob was already marked for deletion', this.id);
    else {
      if(this.dom) this.dom.window.close();
      setTimeout(() => {
        // console.log('PublishJob cleanup, now asking to be deleted', this.id);
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

  /**
   * the method called to publish a website and serve it for 24h
   * @param {?string=} file to download and publish
   */
  // share(file) {
  //   if(this.isStopped()) {
  //     return;
  //   }

  //   // create temp folder
  //   this.setStatus(`Creating temp folder`);
  //   fs.existsAsync(this.tmpFolder)
  //   .catch(() => {
  //     return true;
  //   })
  //   .then(exists => {
  //     if(exists) return Promise.resolve();
  //     else return fs.mkdirAsync(this.tmpFolder)
  //   })
  //   .catch(err => {
  //     console.error('Publication error, could not create temp folder', err.message);
  //   })

  //   // download file
  //   .then(() => {
  //     this.setStatus(`Downloading website ${file.name}`);
  //     return this.unifile.readFile(this.session.unifile, file.service, file.path)
  //   })
  //   .catch(err => {
  //     console.error('Publication error, could not download file', err.message);
  //   })

  //   // build folders tree
  //   .then(buffer => {
  //     console.log('file downloaded', buffer.toString());
  //     console.log('write', this.tmpFolder);
  //     return fs.writeFileAsync(this.tmpFolder + '/index.html')
  //   })
  //   .catch(err => {
  //     console.error('Publication error, could not download file', err.message);
  //   })
  //   .then(() => {
  //     console.log('Done.');
  //   })
  // }

  /**
   * the method called to publish a website to a location
   * @param {?string=} file to download and publish
   */
  publish(file) {
    if(this.isStopped()) {
      return;
    }

    // download file
    this.setStatus(`Downloading website ${file.name}`);
    return this.unifile.readFile(this.session.unifile, file.service, file.path)
    .catch(err => {
      console.error('Publication error, could not download file:', err.message);
      this.error = true;
      this.setStatus(err.message);
    })

    // build folders tree
    .then(buffer => {
      if(this.isStopped()) {
        return;
      }
      this.setStatus(`Splitting file ${file.name}`);
      const url = new URL(file.url);
      const baseUrl = new URL(url.origin + Path.dirname(url.pathname) + '/');
      this.dom = new JSDOM(buffer.toString('utf-8'), baseUrl);
      const domPublisher = new DomPublisher(this.dom);
      domPublisher.cleanup();
      this.tree = domPublisher.split(baseUrl);
    })
    .catch(err => {
      console.error('Publication error, could not split file:', err.message);
      this.error = true;
      this.setStatus(err.message);
    })

    // download all assets
    // check existing folder structure
    .then(() => {
      if(this.isStopped()) {
        return;
      }
      return this.readOperations();
      // const total = this.tree.actions.length;
      // let downloaded = 0;
      // this.setStatus(`Downloading ${total} files for ${file.name}`);
      // console.log('tree:', this.tree);
      // return Promise.all(
      //   this.tree.actions.map(action => {
      //     console.log('download start', action.displayName);
      //     return this.unifile.readFile(this.session.unifile, action.src.service, action.src.path)
      //     .then(buffer => {
      //       console.log('download end', action.displayName);
      //       downloaded++;
      //       this.setStatus(`Downloading ${downloaded}/${total} files for ${file.name}`);
      //       console.log('download ok', action.src);
      //       action.buffer = buffer
      //       return action;
      //     })
      //     .catch(err => {
      //       console.warn('could not download file', action, err);
      //       return Promise.resolve(action);
      //     })
      //   })
      // )
    })
    .catch(err => {
      // FIXME: will never go through here
      console.error('Publication error, could not download files:', this.tree.actions.map(action => action.displayName).join(', '), '. Error:', err.message);
      this.error = true;
      this.setStatus(err.message);
    })

    // write and upload all files in a batch operation
    .then(([statCss, statJs, statAssets, ...assets]) => {
      if(this.isStopped()) {
        return;
      }
      return this.writeOperations(statCss, statJs, statAssets, ...assets)
    })
    .catch(err => {
      console.error('An error occured in unifile batch', err.message);
      this.error = true;
      this.setStatus(err.message);
    })

    // all operations done
    .then(() => {
      if(this.isStopped()) {
        return;
      }
      this.setStatus(this.getSuccessMessage());
      this.success = true;
    })
  }

  readOperations() {
    this.setStatus(`Creating folders: <ul><li>${this.cssFolder}</li><li>${this.jsFolder}</li><li>${this.assetsFolder}</li></ul>`);

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
        () => preventErr(this.unifile.stat(this.session.unifile, this.folder.service, this.cssFolder)),
        () => preventErr(this.unifile.stat(this.session.unifile, this.folder.service, this.jsFolder)),
        () => preventErr(this.unifile.stat(this.session.unifile, this.folder.service, this.assetsFolder)),
      ]
      // add the promises to download each asset
      .concat(this.downloadAllAssets(this.tree.actions))
    )
  }

  writeOperations(statCss, statJs, statAssets, ...assets) {
    this.setStatus(`Creating files <ul><li>${this.indexFile}</li><li>${this.cssFile}</li><li>${this.jsFile}</li></ul>`);
    const batchActions = [{
      name: 'writefile',
      path: this.indexFile,
      content: this.dom.serialize(),
    }];
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
    if(!!this.tree.styleTags.length > 0) {
      batchActions.push({
        name: 'writefile',
        path: this.cssFile,
        content: this.tree.styleTags.reduce((prev, tag) => prev + tag.innerHTML, ''),
      });
    }
    if(!!this.tree.scriptTags) {
      batchActions.push({
        name: 'writefile',
        path: this.jsFile,
        content: this.tree.scriptTags.reduce((prev, tag) => prev + tag.innerHTML, ''),
      });
    }
    const batchActionsWithAssets = batchActions.concat(
      assets
      .filter(file => !!file)
      .map(file => {
        return {
          name: 'writeFile',
          path: this.folder.path + '/' +file.path,
          content: file.content,
        };
      }));
    return this.unifile.batch(this.session.unifile, this.folder.service, batchActionsWithAssets)
  }

  // create the promises to download each asset
  downloadAllAssets(files) {
    return files.map(file => {
      const srcPath = decodeURIComponent(file.srcPath);
      const destPath = decodeURIComponent(file.destPath);
      const shortSrcPath = srcPath.substr(srcPath.lastIndexOf('/') + 1);
      return () => new Promise((resolve, reject) => {
        if(this.isStopped()) {
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
          else resolve({
            content: data,
            path: destPath,
          });
        });
      })
      .catch(err => {
        this.filesNotDownloaded.push(shortSrcPath);
      });
    });
  }
}

