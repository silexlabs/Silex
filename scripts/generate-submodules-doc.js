#!/usr/bin/env node

import { access, readFile } from 'fs/promises';
import ini from 'js-ini';

async function exists(path) {
  try {
    await access(path)
    return true
  } catch(e) {
    return false
  }
}

async function main() {
  try {
    const data = await readFile('.gitmodules', 'utf-8')
    const parsedData = ini.parse(data)
    const array = Object.keys(parsedData)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      // From submodule "submodules/..." to "..."
      name: key.replace(/^submodule \"packages\//, '').replace(/\"$/, ''),
      ...parsedData[key],
    }))
    let markdown = `
| Package | Description |
| ------- | ----------- |
`
    let readmeCount = 0
    for(const project of array) {
      let title = project.name
      let description = ''
      // Convert git URL to web URL
      const webUrl = project.url
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/^git@gitlab\.com:/, 'https://gitlab.com/')
        .replace(/\.git$/, '')
      try {
        const readmeFile =
          await exists(`${project.path}/README.md`) ? `${project.path}/README.md` :
          await exists(`${project.path}/readme.md`) ? `${project.path}/readme.md` :
          await exists(`${project.path}/README`) ? `${project.path}/README` : null

        if (readmeFile) {
          const readme = await readFile(readmeFile, 'utf-8')
          readmeCount++
          const lines = readme.split('\n')
          const titleIndex = lines.findIndex((line) => line.match(/^(#+)/))
          title = titleIndex >= 0 ? lines[titleIndex].replace(/^(#+)/, '').trim() : project.name
          const rawDesc = titleIndex >= 0 ? lines.slice(titleIndex + 1).find((line) => line.length > 0) ?? '' : ''
          // Remove markdown links and images for cleaner table display
          let cleaned = rawDesc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/!\[[^\]]*\]\([^)]+\)/g, '')
          // Keep only the first sentence (but ignore dots in common abbreviations and patterns)
          const firstSentence = cleaned.match(/^.+?(?<!\be\.g|\bi\.e|\bnode\.js|\betc|\bvs|\bpackage|\bsitemap|\bsilex\.me|\b11ty\.dev)[.!?](?:\s|$)/i)
          description = firstSentence ? firstSentence[0].trim() : cleaned
          // Truncate if still too long
          if (description.length > 120) {
            description = description.substring(0, 117) + '...'
          }
        } else {
          console.error('Skipping', title, '- No readme file found')
        }
      } catch (err) {
        console.error('Skipping', title)
        if(err.code === 'ENOENT') continue
        else throw err
      }
      markdown += `| [${title}](${webUrl}) | ${description} |\n`
    }
    console.log(markdown)
  } catch (err) {
    console.error(err)
  }
}

main()
