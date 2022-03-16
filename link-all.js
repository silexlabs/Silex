#!/usr/bin/env node

const metaLoop = require('meta-loop')
const fs = require('fs')

// build the command to link all projects
const {projects} = JSON.parse(fs.readFileSync('./.meta').toString())
const command = `npm link ${Object.keys(projects).map(project => project.split('/').pop()).join(' ')}`

console.log(`meta exec "${command}"`)

metaLoop(command)

console.log('done')
