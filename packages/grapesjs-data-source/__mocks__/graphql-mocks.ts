import fs from 'fs'

export const connect = {"data":{"__typename":"Query"}}
export const directusSchema = JSON.parse(fs.readFileSync(__dirname + '/directus-schema.json', 'utf8'))
export const strapiSchema = JSON.parse(fs.readFileSync(__dirname + '/strapi-schema.json', 'utf8'))
export const simpleSchema = JSON.parse(fs.readFileSync(__dirname + '/simple-schema.json', 'utf8'))
