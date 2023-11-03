#!/usr/bin/env node

const fs = require('fs/promises')
const ini = require('js-ini')

async function main() {
  try {
    const data = await fs.readFile('.gitmodules', 'utf-8')
    const parsedData = ini.parse(data)
    const array = Object.keys(parsedData)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      // From submodule "submodules/..." to "..."
      name: key.replace(/^submodule \"packages\//, '').replace(/\"$/, ''),
      ...parsedData[key],
    }))
    let markdown = `
# Silex packages

| Name | Directory | Repo | Description |
| ---- | --------- | ---- | ----------- |
`
    let readmeCount = 0
    for(project of array) {
      let title = project.name
      let description = ''
      try {
        const readme = await fs.readFile(`${project.path}/README.md`, 'utf-8')
        readmeCount++
        const lines = readme.split('\n')
        const titleIndex = lines.findIndex((line) => line.match(/^(#+)/))
        title = titleIndex >= 0 ? lines[titleIndex].replace(/^(#+)/, '').trim() : project.name
        description = titleIndex >= 0 ? lines.slice(titleIndex + 1).find((line) => line.length > 0) ?? '' : ''
      } catch (err) {
        if(err.code === 'ENOENT') continue
        else throw err
      }
      markdown += `| ${title} | \`packages/${project.name}\` | \`${project.url}\` | ${description} |\n`
    }
    console.log(markdown)
  } catch (err) {
    console.error(err)
  }
}

main()
