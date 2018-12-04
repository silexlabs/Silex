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

const PublishJob = require('./PublishJob.js');
const HostingGhPages = require('./HostingGhPages.js');
const express = require('express');

module.exports = function({ port, rootUrl, enableGithubPages, skipProviderSelection }, unifile) {

  const router = express.Router();

  if(enableGithubPages) {
    const p = require('./HostingGhPages.js');
    router.use(new p(unifile));
  }

  // **
  // publication tasks
  router.post('/tasks/:task', (req, res, next) => {
    switch(req.params.task) {
      case 'publish':
        PublishJob.create(req.body, unifile, req.session, req.cookies, rootUrl);
        res.end();
        break;
      default:
        res.status(400).send({
          message: 'Silex task "' + req.params.task + '" does not exist'
        });
    }
  });
  router.get('/tasks/:task', (req, res, next) => {
    switch(req.params.task){
      case 'publishState':
        const publishJob = PublishJob.get(req.session.publicationId);
        if(publishJob) {
          if(publishJob.error) res.status(500);
          res.send({
            'message': publishJob.getStatus(),
            'stop': publishJob.isStopped(),
          });
        }
        else {
          res.status(404).send({
            'message': 'No pending publication.',
            'stop': true,
          });
        }
        break;
      default:
        res.status(500).send({
          message: 'Silex task "' + req.params.task + '" does not exist'
        });
    }
  });
  router.get('/hosting/', (req, res, next) => {
    res.json({
      providers: res.locals.providers,
      skipProviderSelection: skipProviderSelection,
    });
  });
  return router;
};
