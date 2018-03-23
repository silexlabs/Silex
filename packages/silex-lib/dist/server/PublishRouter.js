const PublishJob = require('./PublishJob.js');
const express = require('express');
const uuid = require('uuid');
const bodyParser = require('body-parser');

module.exports = function(port, rootUrl, unifile) {

  const router = express.Router();

  // **
  // publication tasks
  router.post('/tasks/:task', bodyParser.json(), (req, res, next) => {
    // init the session (shouldn't it be done by express??
    req.session.sessionID = req.session.sessionID || uuid.v4();
    switch(req.params.task) {
      case 'publish':
        PublishJob.create(req.session.sessionID, req.body, unifile, req.session, req.cookies, req.protocol + '://' + req.get('host'));
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
        const publishJob = PublishJob.get(req.session.sessionID);
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
  return router;
};
