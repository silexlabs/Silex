#!/usr/bin/env node

const fs = require('fs/promises')

async function main(content, key, code) {
  console.log(content)
  // Read README.md
  const readme = await fs.readFile('README.md', 'utf-8')
  const keyText = `> Auto generated ${key}`
  // Replace content between keys
  const lines = readme.split('\n')
  const keyIndexStart = lines.findIndex((line) => line.trim() === keyText)
  const keyIndexEnd = lines.findIndex((line, index) => index > keyIndexStart && line.trim() === keyText)
  if(keyIndexStart < 0 || keyIndexEnd < 0) throw new Error(`Key not found in readme: ${key}`)
  if(code) {
    lines.splice(keyIndexStart + 1, keyIndexEnd - keyIndexStart - 1, `
\`\`\`
${content}
\`\`\`
`)
  } else {
    lines.splice(keyIndexStart + 1, keyIndexEnd - keyIndexStart - 1, content)
  }
  // Write README.md
  await fs.writeFile('README.md', lines.join('\n'))
}

// Read piped content
let content = ''
process.stdin.on('data', (chunk) => {
  content += chunk
})
process.stdin.on('end', () => {
  main(content, process.argv[2], process.argv[3] === '--code')
})
