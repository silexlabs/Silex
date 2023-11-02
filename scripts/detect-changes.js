#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const {projects} = JSON.parse(fs.readFileSync('./.meta').toString())

const result = Object.keys(projects)
  .map((folder) => ({
    project: folder.split('/').pop(),
    path: path.resolve(folder),
  }))
  .map(({path, project}) => ({
    command: `cd ${path} && git --no-pager log --oneline $(git describe --tags --abbrev=0 @^)..@`,
    path,
    project,
  }))
  .filter(({path, command, project}) => {
    // console.log(`Run command "${command}"`)
    // console.log(`Run command in ${project}`)

    try {
      const stdout = execSync(command)
      console.log(`${project}\n\n${stdout}\n**********\n`)
      return stdout.toString() !== '' // stdout will never be '' here as no change => error
    } catch(error) {
      // console.error(`exec error: ${error}`)
      return false
    }
  })

console.log(`Projects with changes:\n* ${result.map(({project})=>project).join('\n* ')}`)
