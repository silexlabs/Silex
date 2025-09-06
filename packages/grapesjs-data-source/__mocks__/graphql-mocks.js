const fs = require('fs')
const path = require('path')

exports.directusTestSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'directus-test-schema.json'), 'utf8'))
exports.strapiSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'strapi-schema.json'), 'utf8'))
exports.simpleSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'simple-schema.json'), 'utf8'))
exports.squidexSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'squidex-schema.json'), 'utf8'))
