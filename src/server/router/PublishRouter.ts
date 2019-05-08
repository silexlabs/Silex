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

import PublishJob from '../publication/PublishJob';
import HostingUnifile from '../hosting-provider/HostingUnifile';
import HostingGhPages from '../hosting-provider/HostingGhPages';
import HostingJekyll from '../hosting-provider/HostingJekyll';

const express = require('express');
const hostingProviders = [];
const router = express.Router();

export default function PublishRouter({ port, rootUrl, enableHostingGhPages, enableHostingUnifile, enableHostingJekyll, skipHostingSelection }, unifile) {
  if(enableHostingUnifile) {
    const hostingUnifile = new HostingUnifile(unifile);
    addHostingProvider(hostingUnifile);
  }

  if(enableHostingGhPages) {
    const hostingGhPages = new HostingGhPages(unifile);
    addHostingProvider(hostingGhPages);
  }

  if(enableHostingJekyll) {
    const hostingJekyll = new HostingJekyll(unifile);
    addHostingProvider(hostingJekyll);
  }

    // **
  // publication tasks
  router.post('/tasks/publish', (req, res, next) => {
    if(!req.body.provider || !req.body.provider.name) {
      res.status(400).send({
        message: 'Error in the request, hosting provider required',
      });
    }
    else {
      PublishJob.create(req.body, unifile, req.session, req.cookies, rootUrl, getHostingProvider(req.session.unifile, req.body.provider.name));
      res.end();
    }
  });

  router.get('/tasks/publishState', (req, res, next) => {
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
  });

  router.get('/hosting/', (req, res, next) => {
    const session = !!req.session && !!req.session.unifile ? req.session.unifile : {};
    res.json({
      providers: hostingProviders.map(hostingProvider => hostingProvider.getOptions(session)),
      skipHostingSelection: skipHostingSelection,
    });
  });

  // vhosts
  router.get('/hosting/:hostingProviderName/vhost', (req, res, next) => {
    const hostingProvider = getHostingProviderFromReq(req)
    const hostingProviderInfo = hostingProvider.getOptions(req.session.unifile);
    hostingProvider.getVhosts(req.session.unifile)
    .then(vhosts => {
      res.json(vhosts
        //.slice(0, 10) // max number of vhosts
      );
    })
    .catch(err => {
      res.status(400).send({
        message: `Error from hosting provider "${ hostingProviderInfo.displayName }": ${ err.message }`,
        err: err,
      });
    });
  });
  router.get('/hosting/:hostingProviderName/vhost/:name', (req, res, next) => {
    const hostingProvider = getHostingProviderFromReq(req)
    hostingProvider.getVhostData(req.session.unifile, req.params.name)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      res.json({
        domain: '',
        msg: err,
      });
    });
  });
  router.post('/hosting/:hostingProviderName/vhost/:name', (req, res, next) => {
    const hostingProvider = getHostingProviderFromReq(req)
    const data = {
      domain: req.body.domain,
    };
    hostingProvider.setVhostData(req.session.unifile, req.params.name, data)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      console.error('Error when trying to attach a domain', req.params.name, data, err);
      res.status(400).send({
        message: `Error when trying to attach a domain to "${ req.params.name }". Error details: ${ err.message }`,
        err: err,
      });
    });
  });
  router.delete('/hosting/:hostingProviderName/vhost/:name', (req, res, next) => {
    const hostingProvider = getHostingProviderFromReq(req)
    hostingProvider.setVhostData(req.session.unifile, req.params.name, null)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      console.error('Error when trying to delete a domain', req.params.name, err);
      res.status(400).send({
        message: `Error when trying to remove domain from "${ req.params.name }". Error details: ${ err.message }`,
        err: err,
      });
    });
  });
  router.addHostingProvider = (hostingProvider) => addHostingProvider(hostingProvider);
  return router;
};

function addHostingProvider(hostingProvider) {
  console.log('> Adding hosting provider', hostingProvider.getOptions({}).displayName);
  hostingProviders.push(hostingProvider);
};

function getHostingProviderFromReq(req) {
  const hostingProviderName = req.params.hostingProviderName;
  const hostingProvider = getHostingProvider(req.session.unifile, hostingProviderName);
  if(!hostingProvider) throw('Could not find the hosting provider ' + hostingProviderName);
  return hostingProvider;
};

function getHostingProvider(session, hostingProviderName) {
  return hostingProviders.find(hostingProvider => hostingProvider.getOptions(session).name === hostingProviderName)
};
