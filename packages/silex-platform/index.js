'use strict';

const { SilexServer, Config } = require('silex-website-builder')
const serveStatic = require('serve-static')
const path = require('path')

const config = new Config()
const silex = new SilexServer(config)

// logs for debugging prod version
let stats = {}
setInterval(() => {
  console.log('Static file requested', stats)
  // stats = {}
}, 1000 * 60 * 10)
silex.app.use('/static', (req, res, next) => {
  const version = req.url.split('/')[1]
  const referer = req.header('Referer')
  stats[version] = (stats[version] || 0) + 1
  stats[referer] = (stats[referer] || 0) + 1
  next()
})

// serve modified html
silex.app.use('/', serveStatic(path.resolve('./dist/')))

silex.start(function() {
  console.log('server started')
})
