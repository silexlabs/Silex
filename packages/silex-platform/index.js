'use strict';

const { SilexServer, Config } = require('silex-website-builder')
const serveStatic = require('serve-static')
const path = require('path')
const got = require('got')

const config = new Config()
const silex = new SilexServer(config)

// logs for debugging prod version
silex.app.use('/static', (req, res, next) => {
  const splitted = req.url.split('/')
  const version = splitted[1]
  const filename = splitted.pop()
  const referer = req.header('Referer')
  if(filename === 'jquery.js') {
    trackEvent('static-file-request', version, referer, filename)
    .then(response => {
      console.log('logged in alanytics:', version, filename, referer, 'response:', response.body)
    })
  }
  next()
})

// serve modified html
silex.app.use('/', serveStatic(path.resolve('./dist/')))

silex.start(function() {
  console.log('server started')
})

const { GA_TRACKING_ID } = require('./env.js')
function trackEvent (category, action, label, value) {
  const data = {
    // API Version.
    v: '1',
    // Tracking ID / Property ID.
    tid: GA_TRACKING_ID,
    // Anonymous Client Identifier. Ideally, this should be a UUID that
    // is associated with particular user, device, or browser instance.
    cid: '555',
    // Event hit type.
    t: 'event',
    // Event category.
    ec: category,
    // Event action.
    ea: action,
    // Event label.
    el: label,
    // Event value.
    ev: value
  }

  return got.post('http://www.google-analytics.com/collect', {
    form: data
  })
}
