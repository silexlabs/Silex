const PublishJob = require('./PublishJob.js');
const express = require('express');

module.exports = function({ port, rootUrl }, unifile) {

  const router = express.Router();

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
  const providers = [
    {
      name: 'ghpages',
      displayName: 'Github Pages',
      isLoggedIn: false,
      authorizeUrl: '/ce/github/authorize',
      dashboardUrl: 'https://www.github.com',
      pleaseCreateAVhost: 'create an empty repository.',
      vhosts: '/hosting/ghpages/vhost',
    }
  ];
  router.get('/hosting/', (req, res, next) => {
    res.json(providers);
  });
  router.get('/hosting/ghpages/vhost', (req, res, next) => {
      unifile.readdir(req.session.unifile, 'github', '/')
      .then(result => {
        res.json(result
          .sort((a, b) => new Date(b.modified) - new Date(a.modified))
          //.slice(0, 1) // max number of repos
          .map(file => {
            return {
              name: file.name,
              publicationPath: {
                absPath: `/ce/github/get/${ file.name }/gh-pages`,
                isDir: true,
                mime: 'application/octet-stream',
                name: 'gh-pages',
                folder: file.name,
                path: `${ file.name }/gh-pages`,
                service: 'github',
                url: `http://localhost:6805/ce/github/get/${ file.name }/gh-pages`,
              }
            };
          })
        );
      })
      .catch(err => {
        res.status(400).send({
          message: `Hosting provider "${ req.params.id } does not exist`
        });

      });
  });
  return router;
};
