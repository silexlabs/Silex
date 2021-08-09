'use strict';

const { SilexServer, Config } = require('silex-website-builder')
const serveStatic = require('serve-static')
const path = require('path')

const config = new Config()
const silex = new SilexServer(config)

// logs for debugging prod version
silex.app.use('/static', (req, res, next) => {
  const splitted = req.url.split('/')
  const version = splitted[1]
  const filename = splitted.pop()
  const referer = req.header('Referer')
  next()
})

// serve modified html
silex.app.use('/', serveStatic(path.resolve('./dist/')))

silex.start(function() {
  console.log('server started')
})

