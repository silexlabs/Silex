const { Router } = require('express')
const { resolve } = require('path')
const formidable = require('formidable')

const { noCache } = require('./Cache')
const { defaultSite } = require('../../')

const EVENT_READ_START = 'EVENT_READ_START'
const EVENT_READ_END = 'EVENT_READ_END'
const EVENT_DELETE_START = 'EVENT_WRITE_START'
const EVENT_DELETE_END = 'EVENT_WRITE_END'
const EVENT_WRITE_START = 'EVENT_WRITE_START'
const EVENT_WRITE_END = 'EVENT_WRITE_END'
const EVENT_ASSET_READ_START = 'EVENT_ASSET_READ_START'
const EVENT_ASSET_READ_END = 'EVENT_ASSET_READ_END'
const EVENT_ASSET_WRITE_START = 'EVENT_ASSET_WRITE_START'
const EVENT_ASSET_WRITE_END = 'EVENT_ASSET_WRITE_END'

module.exports = async function(config, opts = {}) {
  // Options with defaults
  const options = {
    // Defaults
    backend: 'src/plugins/DefaultBackend.js',
    // Default data for new websites
    defaultSite,
    // Options
    ...opts
  }

  // Link to the desired backend
  const backend = resolve(__dirname, '../..', options.backend)
  const { assetsDir, assetUrl, init, writeData, readData, list, del } = require(backend)

  config.on('silex:startup:start', ({app}) => {
    const router = Router()

    // website specials
    router.get('/website', readWebsite)
    router.post('/website', writeWebsite)
    router.delete('/website', deleteWebsite)
    router.get(/\/assets\/(.*)/, readAsset)
    router.post('/assets', writeAsset)

    app.use(noCache,  router)
  })

  async function readWebsite(req, res) {
    const { id } = req.query
    if(id) {
      // Returns a website data
      try {
        config.emit(EVENT_READ_START, { req, id })
        const data = await readData(id)
        config.emit(EVENT_READ_END, { req, res, data, id })
        res
          .type('application/json')
          .send({
            ...options.defaultSite,
            ...data,
          })
      } catch (err) {
        if(err.code === 'ENOENT') {
          console.error('Read file error, website does not exist', err)
          res.status(404).json({ message: 'Read file error, website does not exist: ' + err.message, code: err.code})
        } else {
          console.error('Read file error', err)
          res.status(400).json({ message: err.message, code: err.code})
        }
      }
    } else {
      // list websites
      try {
        config.emit(EVENT_READ_START, { req, id })
        const data = await list()
        config.emit(EVENT_READ_END, { req, res, data, id })
        res
          .type('application/json')
          .send(data)
      } catch (err) {
        console.error('List sites error', err)
        res.status(400).json({ message: err.message, code: err.code })
      }
    }
  }

  function fromBody(body) {
    try {
      return [{
        assets: body.assets,
        pages: body.pages,
        files: body.files,
        styles: body.styles,
        settings: body.settings,
        publication: body.publication,
        name: body.name,
        fonts: body.fonts,
        symbols: body.symbols,
      }, null]
    } catch(err) {
      console.error('Could not parse body data', body, err)
      return [null, err]
    }
  }

  async function writeWebsite(req, res) {
    const id = req.query.id
    const [data, err] = fromBody(req.body)
    if(err) {
      res.status(400).json({ message: 'Error writing data file, could not parse the provided body: ' + err.message, code: err.code})
      return
    }
    config.emit(EVENT_WRITE_START, { req, id, data })
    try {
      await init(id)
      await writeData(id, data)
    } catch (err) {
      console.error('Error writing data file', err)
      res.status(500).json({ message: 'Error writing data file: ' + err.message, code: err.code})
      return
    }

    config.emit(EVENT_WRITE_END, { res, req, id, data })

    res.json({
      message: 'OK',
    })
  }

  async function deleteWebsite(req, res) {
    const { id } = req.query
    if(id) {
      try {
        config.emit(EVENT_DELETE_START, { req, id })
        const data = await del(id)
        config.emit(EVENT_DELETE_END, { req, res, data, id })
        res
          .type('application/json')
          .send(data)
      } catch (err) {
        if(err.code === 'ENOENT') {
          console.error('Delete file error, website does not exist', err)
          res.status(404).json({ message: 'Delete file error, website does not exist: ' + err.message, code: err.code})
        } else {
          console.error('Delete file error', err)
          res.status(400).json({ message: err.message, code: err.code})
        }
      }
    } else {
      // list websites
      try {
        config.emit(EVENT_DELETE_START, { req, id })
        const data = await list()
        config.emit(EVENT_DELETE_END, { req, res, data, id })
        res
          .type('application/json')
          .send(data)
      } catch (err) {
        console.error('List sites error', err)
        res.status(400).json({ message: err.message, code: err.code })
      }
    }
  }

  async function readAsset(req, res) {
    const id = req.query.id
    const fileName = req.params[0]
    const uploadDir = await assetsDir(id)
    config.emit(EVENT_ASSET_READ_START, { req, id, fileName, uploadDir })
    res.sendFile(`${uploadDir}/${fileName}`)
    config.emit(EVENT_ASSET_READ_END, { req, id, fileName, uploadDir })
  }

  async function writeAsset(req, res) {
    const id = req.query.id
    // FIXME: assetsDir and assetsUrl will both download the site settings file => get both in 1 call
    const uploadDir = await assetsDir(id)

    const form = formidable({
      uploadDir,
      filename: (name, ext, part, _form) => `${name}${ext}`,
      multiples: true,
      keepExtensions: true,
    })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing upload data', err)
        res
          .status(400)
          .json({ message: 'Error parsing upload data: ' + err.message, code: err.code})
        return
      }
      Promise.all(
        [].concat(files['files[]']) // may be an array or 1 element
          .map(file => {
            const { originalFilename, filepath } = file
            return assetUrl(id, originalFilename)
          })
      )
        .then(data => {
          config.emit(EVENT_ASSET_WRITE_START, { req, id, uploadDir, form, data })
          res.json({ data })
          config.emit(EVENT_ASSET_WRITE_END, { res, req, id, uploadDir, form, data })
        })
    })
  }
}
