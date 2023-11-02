#!/usr/bin/env node

const fs = require('fs')
const Path = require('path')
const cp = require('child_process')

// build the command to link all projects
const {projects} = JSON.parse(fs.readFileSync('./.meta').toString())
const all = Object.keys(projects).map(path => ({
  path,
  name: JSON.parse(fs.readFileSync(`${path}/package.json`)).name,
  git: projects[path],
}))
const command = (package) => `npm link ${all.map(p => p.name).filter(name => name !== package).join(' ')}`

Promise.all(all.map(p => new Promise((resolve, reject) => {
  const options = {
    cwd: Path.resolve(__dirname, '..', p.path),
    env: process.env,
  }
  console.info('Run"', command(p.name), '" in', options.cwd)
  cp.exec(command(p.name), options, (err) => {
    if (err) {
      console.error(`Error while runing command ${command(p.name)} in ${options.cwd}`, err)
      return reject(err)
    }
    resolve()
  })
})))

console.log('done')
