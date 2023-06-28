/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const { Router } = require('express')
const formidable = require('formidable')
const { noCache } = require('./Cache')

module.exports = async function(config, opts = {}) {
  // Options with defaults
  const options = {
    // Default constants
    assetsPath: '/assets',
    // Options
    ...opts
  }

  // Link to the desired backend
  const storage = config.getStorage()

  config.on('silex:startup:start', ({app}) => {
    // Create a new router
    const router = Router()

    // website specials
    router.get('/website', readWebsite)
    router.post('/website', writeWebsite)
    router.delete('/website', deleteWebsite)
    router.get(/\/assets\/(.*)/, readAsset)
    router.post('/assets', writeAsset)

    app.use(noCache,  router)
  })

  /**
   * Returns a website data or list all websites
   * 
   */
  async function readWebsite(req, res) {
    const { id } = req.query
    const { session } = req
    if(id) {
      // Returns a website data
      try {
        const file = await storage.readFile(session, id, `/website.json`)
        if (typeof file.content === 'string') {
          res.json(JSON.parse(file.content))
        } else {
          file.content.pipe(res.type('application/json'))
        }
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
        const data = await storage.listDir(session, '/')
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
    const { session } = req
    const id = req.query.id
    const [content, err] = fromBody(req.body)
    if(err) {
      res.status(400).json({ message: 'Error writing data file, could not parse the provided body: ' + err.message, code: err.code})
      return
    }
    try {
      await storage.init(session, id)
      await storage.writeFiles(session, id, [
        {
          path: `/website.json`,
          content: JSON.stringify(content),
        },
      ]);

    } catch (err) {
      console.error('Error writing data file', err)
      res.status(500).json({ message: 'Error writing data file: ' + err.message, code: err.code})
      return
    }

    res.json({
      message: 'OK',
    })
  }

  async function deleteWebsite(req, res) {
    const { id } = req.query
    if(id) {
      try {
        const data = await storage.deleteDir(id, '/')
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
      res.status(400).json({ message: 'Missing id'})
    }
  }

  async function readAsset(req, res) {
    const { session } = req
    const id = req.query.id
    const fileName = req.params[0]
    //const uploadDir = await assetsDir(id)
    //res.sendFile(`${uploadDir}/${fileName}`)
    const file = await storage.readFile(session, id, `/${options.assetsPath}/${fileName}`)
    if (typeof file.content === 'string') {
      res.send(file.content)
    } else {
      await files.content.pipe(res)
    }
  }

  async function writeAsset(req, res) {
    const { session } = req
    const id = req.query.id

    const form = formidable({
      uploadDir,
      filename: (name, ext, part, _form) => `${name}${ext}`,
      multiples: true,
      keepExtensions: true,
    })

    form.parse(req, async (err, fields, _files) => {
      if (err) {
        console.error('Error parsing upload data', err)
        res
          .status(400)
          .json({ message: 'Error parsing upload data: ' + err.message, code: err.code})
      } else {
        const files = [].concat(_files['files[]'])
        await storage.writeFiles(
          session,
          id,
          files
            .map(({ originalFilename, filepath }) => ({
              path: `/${options.assetsPath}/${originalFilename}`,
              content: fs.createReadStream(filepath),
            }))
        )
        res.json(files.map(({ originalFilename }) => `assets/${originalFilename}?id=${id}`))
      }
    })
  }
}
