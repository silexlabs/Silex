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
    this.state = 'In progress.'

    this.jar = request.jar();
    for(let key in this.cookies) this.jar.setCookie(request.cookie(key + '=' + this.cookies[key]), serverUrl);
  }
  stop() {
    if(this.isStopped() === false) {
      console.warn('stopping publication in progress');
      this.abort = true;
      this.state = 'Canceled.';
      this.cleanup();
    }
  }
  isStopped() {
    return this.error || this.abort || this.success;
  }
  getStatus() {
    return this.state;
  }
  cleanup() {
    setTimeout(() => {
      publishers.delete(this.id);
    }, 60*1000);
  }
  /**
   * the method called to publish a website to a location
   * copy assets and files to and from unifile services
   * write css and html data to a unifile service
   * @param {string} html content of index.html
   * @param {?string=} css optional content of css/styles.css
   * @param {?string=} js optional content of js/scripts.js
   * @param {?string=} files optional list of files to download and copy to assets/
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

    this.state = `Creating folders: <ul><li>${cssFolder}</li><li>${jsFolder}</li><li>${assetsFolder}</li></ul>`;

    return Promise.all([
      this.unifile.stat(this.session.unifile, this.folder.service, cssFolder),
      this.unifile.stat(this.session.unifile, this.folder.service, jsFolder),
      this.unifile.stat(this.session.unifile, this.folder.service, assetsFolder),
    ].map(promise => promise.catch(err => console.error('a folder does not exist', err))))
    .then(([statCss, statJs, statAssets]) => {
      this.state = `Creating files <ul><li>${indexFile}</li><li>${cssFile}</li><li>${jsFile}</li></ul>`;
      const batchActions = [{
        name: 'writefile',
        path: indexFile,
        content: html,
      }];
      if(!!css && !statCss) {
        batchActions.push({
          name: 'mkdir',
          path: cssFolder,
        });
      }
      if(!!js && !statJs) {
        batchActions.push({
          name: 'mkdir',
          path: jsFolder,
        });
      }
      if(!!files && !statAssets) {
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
          content: js
        });
      }
      return this.unifile.batch(this.session.unifile, this.folder.service, batchActions)
      .then(() => {
        return new Promise((resolve, reject) => {
          this.streamFileRecursive(files, 0, err => {
            if(err) {
              console.log('download asset file failed', err);
              this.error = true;
              this.state = err.message;
              reject(err);
            }
            else {
              this.state = 'Done.';
              this.success = true;
              resolve();
            }
          });
        });
      });
    })
    .catch((err) => {
      console.error(err);
      this.error = true;
      this.state = err.message;
      this.cleanup();
    })
    .then(() => {
      this.cleanup();
    });
  }
  streamFileRecursive(files, idx, cbk) {
    if(this.abort) {
      cbk('Aborted.');
      return;
    }
    if(idx >= files.length) cbk();
    else {
      const file = {
        destPath: decodeURIComponent(files[idx].destPath),
        srcPath: decodeURIComponent(files[idx].srcPath),
        url: files[idx].url,
      };
      this.state = 'Downloading ' + this.folder.path + '/' + file.destPath;
      //if(file.src.indexOf('http') === 0) {
        // load from URL
        // "encoding: null" is needed for images (which in this case will be served from /static)
        // for(let key in this.session.unifile) console.log('xxxxxaaaa', key, this.session.unifile[key]);
        // "jar" is needed to pass the client cookies to unifile, because we load resources from different servers including ourself
        request(file.srcPath, {
            jar: this.jar,
            encoding: null,
          }, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            // FIXME: should be done in batch
            this.unifile.writeFile(this.session.unifile, this.folder.service, this.folder.path + '/' + file.destPath, body)
            .then(() => this.streamFileRecursive(files, idx + 1, cbk))
            .catch(error => cbk(error));
          }
          else {
            console.error('Error while loading ', file.srcPath, error);
            // keep loading
            // cbk(error || {'message' : `Error ${ response.statusCode} for ressource ${ file.srcPath }` });
            this.streamFileRecursive(files, idx + 1, cbk);
          }
        });
      // }
      // else {
      //   // load from unifile
      //   this.unifile.createReadStream(this.session.unifile, file.src.service, file.src.path)
      //   .pipe(unifile.createWriteStream(this.session.unifile, file.dst.service, file.dst.path))
      //   .on('end', () => {
      //     this.streamFileRecursive(files, idx + 1, cbk);
      //   });
      // }
    }
  }
}

