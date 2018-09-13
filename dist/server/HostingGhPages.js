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

const express = require('express');

module.exports = function(unifile) {
  // create a router to return
  const router = express.Router();
  // add my options to the list of hosting providers
  router.get('/hosting/', (req, res, next) => {
    req.session = req.session || {};
    req.session.unifile = req.session.unifile || {};
    res.locals = res.locals || [];
    res.locals.providers = res.locals.providers || [];
    const infos = unifile.getInfos(req.session.unifile, 'github');
    const options = {
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
      afterPublishMessage: 'Your website is being deployed to github pages.<br><br><strong>It may take a few minutes to be live, be patient!</strong>',
    };
    res.locals.providers.push(options);
    next();
  });
  // add my callbacks to the router
  router.get('/hosting/ghpages/vhost', (req, res, next) => {
    unifile.readdir(req.session.unifile, 'github', '/')
      .then(result => {
        res.json(result
          .sort((a, b) => new Date(b.modified) - new Date(a.modified))
          //.slice(0, 10) // max number of repos
          .map(file => {
            return {
              name: file.name,
              domainUrl: `/hosting/ghpages/vhost/${ file.name }`,
              skipDomainSelection: false,
              publicationPath: {
                //absPath: `/ce/github/get/${ file.name }/gh-pages`,
                name: 'gh-pages',
                folder: file.name,
                path: `${ file.name }/gh-pages`,
                service: 'github',
                url: `https://${ req.session.unifile.github.account.login }.github.io/${ file.name }/`,
              }
            };
          })
        );
      })
      .catch(err => {
        res.status(400).send({
          message: `Error from hosting provider "Github Pages": ${ err.message }`,
          err: err,
        });
      });
  });
  router.get('/hosting/ghpages/vhost/:name', (req, res, next) => {
    unifile.readFile(req.session.unifile, 'github', `/${ req.params.name }/gh-pages/CNAME`)
      .then(result => {
        res.json({
          domain: result.toString().replace(/\n/g, ''),
        });
      })
      .catch(err => {
        res.json({
          //domain: `${ req.session.unifile.github.account.login }.github.io/${ req.params.name }`,
          domain: '',
          msg: err,
        });
      });
  });
  router.post('/hosting/ghpages/vhost/:name', (req, res, next) => {
    unifile.writeFile(req.session.unifile, 'github', `/${ req.params.name }/gh-pages/CNAME`, req.body.domain)
      .then(result => {
        res.json({
          domain: req.body.domain,
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
