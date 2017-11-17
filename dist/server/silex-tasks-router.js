'use strict';

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

const Path = require('path');
const PassThrough = require('stream').PassThrough;
const Assert = require('assert');
const request = require('request');
const uuid = require('uuid');
const sequential = require('promise-sequential');

// shared map of Publisher instances,
// these are all the publications currently taking place
// to be scalable, should be stored in a DB
const publishers = new Map();

module.exports = function (app, unifile) {

  app.post('/tasks/:task', (req, res, next) => {
    // init the session (shouldn't it be done by express??
    req.session.sessionID = req.session.sessionID || uuid.v4();
    switch(req.params.task){
      case 'publish':
        if(publishers.has(req.session.sessionID)) {
          publishers[req.session.sessionID].stop();
        }
        try {
          // check input params
          // paras `files`, `js` and `css` are optional
          Assert.ok(!!req.body.folder, 'Missing param "folder"');
          Assert.ok(!!req.body.html, 'Missing param "html"');
        }
        catch(e) {
          console.error('Invalid params', e);
          res.status(400).send({
            message: 'Received invalid params. ' + e.message,
          });
          return;
        }
        publishers[req.session.sessionID] = new Publisher(req.session.sessionID, unifile, req.body.folder, req.session, req.cookies, req.protocol + '://' + req.get('host'));
        publishers[req.session.sessionID].publish(req.body.html, req.body.css, req.body.js, req.body.files);
        // imediately returns to avoid timeout
        res.end();
      break;
      default:
        res.status(400).send({
          message: 'Silex task "' + req.params.task + '" does not exist'
        });
    }
  });
  app.get('/tasks/:task', (req, res, next) => {
    switch(req.params.task){
      case 'publishState':
        const publisher = publishers[req.session.sessionID];
        if(publisher) {
          if(publisher.error) res.status(500);
          res.send({
            'message': publisher.getStatus(),
            'stop': publisher.isStopped(),
          });
        }
        else {
          res.status(404).send({
            'message': 'No pending publication.',
            'stop': true,
          });
        }
      break;
      case process.env.RESTART_ROUTE || 'reload':
        if(!process.env.RESTART_ROUTE) {
          res.status(500).send({
            message: 'You need to define an env var RESTART_ROUTE and call /{{RESTART_ROUTE}}'
          });
          return;
        }
        res.send();
        process.send('restart');
      break;
      default:
        res.status(500).send({
          message: 'Silex task "' + req.params.task + '" does not exist'
        });
    }
  });
}

class Publisher {
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
    this.state = 'In progress.'

    this.jar = request.jar();
    for(let key in this.cookies) this.jar.setCookie(request.cookie(key + '=' + this.cookies[key]), serverUrl);
  }
  stop() {
    if(this.isStopped() === false) {
      console.warn('stopping publication in progress');
      this.abort = true;
      this.setStatus('Canceled.');
      this.cleanup();
    }
  }
  isStopped() {
    return this.error || this.abort || this.success;
  }
  getStatus() {
    return this.state;
  }
  setStatus(status) {
    return new Promise((resolve, reject) => {
      this.state = status;
      resolve();
    });
  }
  cleanup() {
    setTimeout(() => {
      publishers.delete(this.id);
    }, 60*1000);
  }
  getSuccessMessage() {
    if(this.filesNotDownloaded.length > 0) {
      return 'Done. <br><br>Warning: these files could not be downloaded: <ul><li>' + this.filesNotDownloaded.join('</li><li>') + '</li></ul>';
    }
    return 'Done.';
  }
  /**
   * the method called to publish a website to a location
   * copy assets and files to and from unifile services
   * write css and html data to a unifile service
   * @param {string} html content of index.html
   * @param {?string=} css optional content of css/styles.css
   * @param {?string=} js optional content of js/scripts.js
   * @param {?string=} files optional list of files to download and copy to assets/ js/ and css/
   */
  publish(html, css, js, files) {
    if(this.abort) {
      reject('Aborted.');
      return Promise.reject();
    }

    // files and folders paths
    const rootPath = this.folder.path;
    const indexFile = rootPath + '/index.html';
    const cssFolder = rootPath + '/css';
    const jsFolder = rootPath + '/js';
    const assetsFolder = rootPath + '/assets';
    const jsFile = jsFolder + '/script.js';
    const cssFile = cssFolder + '/styles.css';

    this.setStatus(`Creating folders: <ul><li>${cssFolder}</li><li>${jsFolder}</li><li>${assetsFolder}</li></ul>`);

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
        () => preventErr(this.unifile.stat(this.session.unifile, this.folder.service, cssFolder)),
        () => preventErr(this.unifile.stat(this.session.unifile, this.folder.service, jsFolder)),
        () => preventErr(this.unifile.stat(this.session.unifile, this.folder.service, assetsFolder)),
      ]
      // add the promises to download each asset
      .concat(this.downloadAllAssets(files))
    )
    // then we can do a big batch to publish everything at once
    .then(([statCss, statJs, statAssets, ...assets]) => {
      this.setStatus(`Creating files <ul><li>${indexFile}</li><li>${cssFile}</li><li>${jsFile}</li></ul>`);
      const batchActions = [{
        name: 'writefile',
        path: indexFile,
        content: html,
      }];
      if(!statCss) {
        batchActions.push({
          name: 'mkdir',
          path: cssFolder,
        });
      }
      if(!statJs) {
        batchActions.push({
          name: 'mkdir',
          path: jsFolder,
        });
      }
      if(!statAssets) {
        batchActions.push({
          name: 'mkdir',
          path: assetsFolder,
        });
      }
      if(!!css) {
        batchActions.push({
          name: 'writefile',
          path: cssFile,
          content: css,
        });
      }
      if(!!js) {
        batchActions.push({
          name: 'writefile',
          path: jsFile,
          content: js,
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
      .then(() => {
        this.setStatus(this.getSuccessMessage());
        this.success = true;
			})
      .catch(err => {
        console.error('An error occured in unifile batch', err.message);
        this.error = true;
        this.setStatus(err.message);
        return Promise.reject(err);
      });
    })
    .catch((err) => {
      console.error('An error occured in the sequence of promises before unifile batch', err.message);
      this.error = true;
      this.setStatus(err.message);
      this.cleanup();
    })
    .then(() => {
      this.cleanup();
    });
  }

  // create the promises to download each asset
  downloadAllAssets(files) {
    return files.map(file => {
      const srcPath = decodeURIComponent(file.srcPath);
      const destPath = decodeURIComponent(file.destPath);
      const shortSrcPath = srcPath.substr(srcPath.lastIndexOf('/') + 1);
      return () => new Promise((resolve, reject) => {
        if(this.isStopped()) {
          console.warn('Aborted publish');
          reject('Aborted.');
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
          else if(res.statusCode != 200) reject(`Could not download file ${ srcPath }.`);
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

