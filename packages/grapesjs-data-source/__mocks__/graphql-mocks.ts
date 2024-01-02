import fs from 'fs'

export const directusTestSchema = JSON.parse(fs.readFileSync(__dirname + '/directus-test-schema.json', 'utf8'))
export const strapiSchema = JSON.parse(fs.readFileSync(__dirname + '/strapi-schema.json', 'utf8'))
export const simpleSchema = JSON.parse(fs.readFileSync(__dirname + '/simple-schema.json', 'utf8'))
export const squidexSchema = JSON.parse(fs.readFileSync(__dirname + '/squidex-schema.json', 'utf8'))
