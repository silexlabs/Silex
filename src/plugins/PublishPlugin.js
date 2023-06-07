const express = require('express')
const { resolve } = require('path')

const { noCache } = require('./Cache')
const { minify } = require('html-minifier')

const router = express.Router()

// type PublishOptions = {
//   statusUrl?: string
// }

module.exports = async function(config, opts = {}) {
  const options = {
    // Defaults
    statusUrl: process.env.SILEX_PUBLICATION_STATUS_URL,
    backend: 'src/plugins/DefaultBackend.js',
    // Options
    ...opts,
  }

  // Link to the desired backend
  const backend = resolve(__dirname, '../..', options.backend)
  const { publish } = require(backend)

  config.on('silex:startup:start', ({app}) => {
    // Start publication
    router.post('/publish', async function(req, res) {
      const { pages, files, id } = req.body.data
      if (!pages || !id) {
        console.error('Error in the request, pages and id parmas required', {id})
        res.status(400).send({
          message: 'Error in the request, pages and id parmas required',
        })
      } else {
        // Optim
        files.forEach(file => {
          file.html = minify(file.html, {
            continueOnParseError: true,
            collapseInlineTagWhitespace: true,
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
          }).trim()
        })
        // Publication
        await config.emit(EVENT_PUBLISH_START, { id, files, req})
        let url
        try {
          url = await publish(id, files, req.body.data)
        } catch (err) {
          console.error('Error publishing the website', err)
          res.status(500).json({ message: `Error publishing the website. ${err.message}`})
          return
        }
        const mutable = { id, files, req, res, url, statusUrl: options.statusUrl }
        await config.emit(EVENT_PUBLISH_END, mutable)
        res.json({
          url: mutable.url,
          statusUrl: mutable.statusUrl,
        })
      }
    })

    app.use(noCache,  router)
  })
}
