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
  router.get('/hosting/', (req, res, next) => {
    const infos = unifile.getInfos(req.session.unifile, 'github')
      const providers = [
        {
          name: 'ghpages',
          displayName: 'Github Pages',
          isLoggedIn: infos.isLoggedIn,
          username: infos.username,
          authorizeUrl: '/ce/github/authorize',
          dashboardUrl: 'https://www.github.com',
          pleaseCreateAVhost: 'create an empty repository.',
          vhostsUrl: '/hosting/ghpages/vhost',
          buyDomainUrl: 'https://www.gandi.net',
          skipVhostSelection: false,
        }
      ];
      res.json({
        skipProviderSelection: false,
        providers: providers,
      });
    //.catch(err => {
    //  res.status(400).send({
    //    message: `Error while retrieving info about the github service with unifile`,
    //    err: err,
    //  });
    //});
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
              domainUrl: `/hosting/ghpages/vhost/${ file.name }`,
              skipDomainSelection: false,
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
          message: `Error from hosting provider "${ req.params.id }": ${ err.message }`,
          err: err,
        });
      });
  });
  router.get('/hosting/ghpages/vhost/:name', (req, res, next) => {
      unifile.readFile(req.session.unifile, 'github', `/${ req.params.name }/gh-pages/CNAME`)
      .then(result => {
        res.json({
          domain: result.toString().replace(/\n/g, ''),
          https: true,
        });
      })
      .catch(err => {
        res.json({
          domain: `${ req.session.unifile.github.account.login }.github.io/${ req.params.name }`,
          https: true,
          msg: err,
        });
      });
  });
  router.post('/hosting/ghpages/vhost/:name', (req, res, next) => {
    unifile.writeFile(req.session.unifile, 'github', `/${ req.params.name }/gh-pages/CNAME`, req.body.domain)
      .then(result => {
        res.json({
          domain: req.body.domain,
          https: true,
        });
      })
      .catch(err => {
        res.status(400).send({
          message: `Error when trying to attach a domain to "${ req.params.id }". Error details: ${ err.message }`,
          err: err,
        });
      });
  });
  router.delete('/hosting/ghpages/vhost/:name', (req, res, next) => {
    function genericDomain() {
      res.json({
        domain: `${ req.session.unifile.github.account.login }.github.io/${ req.params.name }`,
        https: true,
      });
    }
    unifile.unlink(req.session.unifile, 'github', `/${ req.params.name }/gh-pages/CNAME`, req.body.domain)
      .then(result => genericDomain())
      .catch(err => {
        if(err.code === 'ENOENT') {
          // there was no CNAME file
          genericDomain();
        }
        else {
          res.status(400).send({
            message: `Error when trying to remove domain from "${ req.params.name }". Error details: ${ err.message }`,
            err: err,
          });
        }
      });
  });
  return router;
};
