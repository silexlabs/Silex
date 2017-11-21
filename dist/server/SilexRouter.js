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
const Assert = require('assert');
const uuid = require('uuid');
const express = require('express');
const serveStatic = require('serve-static');
const Os = require('os');
const fs = require('fs');
const CloudExplorerRouter = require('cloud-explorer');
const Publisher = require('./Publisher.js');


module.exports = class SilexRouter extends express.Router {

  constructor(port, rootUrl) {
    super();

    // shared map of Publisher instances,
    // these are all the publications currently taking place
    const publishers = new Map();
    // regularely check for ended publications
    setInterval(() => {
      publishers.forEach(publisher => {
        if(publisher.pleaseDeleteMe) {
          publishers.delete(publisher.id);
        }
      });
    }, 60*1000);


    // **
    // unifile routes
    const routerOptions = {};

    // FTP service
    console.log('FTP service: looking for env vars ENABLE_FTP');
    if(process.env.ENABLE_FTP) {
      console.log('FTP service: found');
      routerOptions.ftp = {
        redirectUri: rootUrl + '/ftp/signin',
      };
    }

    // SFTP service
    console.log('SFTP service: looking for env vars ENABLE_SFTP');
    if(process.env.ENABLE_SFTP) {
      console.log('SFTP service: found');
      routerOptions.sftp = {
        redirectUri: rootUrl + '/sftp/signin',
      };
    }

    // Webdav service
    console.log('Webdav service: looking for env vars ENABLE_WEBDAV');
    if(process.env.ENABLE_WEBDAV) {
      console.log('Webdav service: found');
      routerOptions.webdav = {
        redirectUri: rootUrl + '/webdav/signin',
      };
    }

    // Github service
    console.log('Github service: looking for env vars GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
    if(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      console.log('Github service: found app', process.env.GITHUB_CLIENT_ID);
      routerOptions.github = {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: rootUrl + '/github/oauth_callback',
      };
    }

    // Dropbox service
    console.log('Dropbox service: looking for env vars DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET');
    if(process.env.DROPBOX_CLIENT_ID && process.env.DROPBOX_CLIENT_SECRET) {
      console.log('Dropbox service: found app', process.env.DROPBOX_CLIENT_ID);
      routerOptions.dropbox = {
        clientId: process.env.DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET,
        redirectUri: rootUrl + '/dropbox/oauth_callback',
      };
    }

    // Local file system service
    console.log('Local file system service: looking for env vars SILEX_ELECTRON or SILEX_DEBUG or ENABLE_FS');
    if(process.env.SILEX_DEBUG || process.env.SILEX_ELECTRON || process.env.ENABLE_FS) {
      const fsRoot = process.env.FS_ROOT || Os.homedir();
      console.info('Local file system service: ENABLED => local file system is writable, use FS_ROOT as root (', fsRoot, ')');
      routerOptions.fs = {
        showHiddenFile: false,
        sandbox: fsRoot,
        infos: {
          displayName: 'fs',
        },
      };
    }
    this.cloudExplorerRouter = new CloudExplorerRouter(routerOptions);
    this.use(this.cloudExplorerRouter);

    // Start Silex as an Electron app
    if(process.env.SILEX_ELECTRON) {
      require(Path.join(__dirname, 'silex_electron'));
    }

    // SSL
    // force ssl if the env var SILEX_FORCE_HTTPS is set
    if(process.env.SILEX_FORCE_HTTPS) {
      console.log('force SSL is active (env var SILEX_FORCE_HTTPS is set)');
      var forceSSL = require('express-force-ssl');
      this.set('forceSSLOptions', {
        trustXFPHeader: !!process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER
      });
      this.use(forceSSL);
    }
    else {
      console.log('force SSL NOT active (env var SILEX_FORCE_HTTPS is NOT set)');
    }

    // add static folders to serve silex files
    this.use('/', serveStatic(Path.join(__dirname, '../../dist/client')));
    // debug silex, for js source map
    this.use('/js/src', serveStatic(Path.join(__dirname, '../../src')));
    // the scripts which have to be available in all versions (v2.1, v2.2, v2.3, ...)
    this.use('/static', serveStatic(Path.join(__dirname, '../../static')));

    // SSL certificate
    console.log('SSL: looking for env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY');
    if(process.env.SILEX_SSL_PRIVATE_KEY && process.env.SILEX_SSL_CERTIFICATE) {
      console.log('SSL: found certificate', process.env.SILEX_SSL_CERTIFICATE);
      try {
        var privateKey = fs.readFileSync(process.env.SILEX_SSL_PRIVATE_KEY).toString();
        var certificate = fs.readFileSync(process.env.SILEX_SSL_CERTIFICATE).toString();

        var options = {
          key: privateKey,
          cert: certificate,
          requestCert: true,
          rejectUnauthorized: false
        };

        var sslPort = process.env.SSL_PORT || 443;
        https.createServer(options, this).listen(sslPort, function() {
          console.log('SSL: listening on port ', sslPort);
        });
      }
      catch(e) {
        console.warn('SSL: load certificate failed.', e)
      }
    }

    // **
    // publication tasks
    this.post('/tasks/:task', (req, res, next) => {
      // init the session (shouldn't it be done by express??
      req.session.sessionID = req.session.sessionID || uuid.v4();
      switch(req.params.task) {
        case 'publish':
          // FIXME: several publications should be possible, e.g. when you publish 2 different websites from 2 browser tabs. So we should have an ID which is generated, then returned to the client side to be used when calling cancel or publishState
          if(publishers.has(req.session.sessionID)) {
            publishers.get(req.session.sessionID).stop();
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
          publishers.set(req.session.sessionID, new Publisher(req.session.sessionID, this.cloudExplorerRouter.unifile, req.body.folder, req.session, req.cookies, req.protocol + '://' + req.get('host')));
          publishers.get(req.session.sessionID).publish(req.body.html, req.body.css, req.body.js, req.body.files);
          // imediately returns to avoid timeout
          res.end();
        break;
        default:
          res.status(400).send({
            message: 'Silex task "' + req.params.task + '" does not exist'
          });
      }
    });
    this.get('/tasks/:task', (req, res, next) => {
      switch(req.params.task){
        case 'publishState':
          const publisher = publishers.get(req.session.sessionID);
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

    // **
    // list templates
    this.use('/get/:folder', function(req, res, next){
      switch(req.params.folder) {
        case 'silex-templates':
        case 'silex-blank-templates':
          break;
        default:
          res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - folder does not exist'});
          return;
      }
      var templateFolder = Path.join(__dirname, '../../dist/client/libs/templates/', req.params.folder);
      fs.readdir(templateFolder, function(err, result) {
        if(err) {
          console.error('Error while trying to get the json representation of the folder ' + req.params.folder, err);
          res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - ' + err});
        } else {
          var templateList = result.filter(function(entry) {
            return fs.statSync(Path.join(templateFolder, entry)).isDirectory();
          });

          res.send(templateList);
        }
      });
    });
  }
}

