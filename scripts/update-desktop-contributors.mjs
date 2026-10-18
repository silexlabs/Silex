import { readFile, writeFile } from 'node:fs/promises'

// The README list is the one `pnpm run doc` keeps from the git history: run it first
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')
const [, block] = readme.split('<!-- Auto generated contributors -->')

const years = [...block.matchAll(/^\*\*(\d{4})\*\* \S+ (.+)$/gm)].map(([, year, line]) => ({
  year,
  people: [...line.matchAll(/\[([^\]]+)\]\(([^)]+)\)|(?:^|, )([^,[\]]+?)(?=,|$)/g)]
    .map(([, name, url, plain]) => (plain ? { name: plain.trim() } : { name, url })),
}))

const file = new URL('../desktop/dashboard/src/contributors.json', import.meta.url)
await writeFile(file, `${JSON.stringify(years, null, 1)}\n`)
console.log(`${years.length} years of contributors written to ${file.pathname}`)

const thanks = await readFile(new URL('../THANKS.md', import.meta.url), 'utf8')
// The app shows the names only: what each one did is in English, THANKS.md says it
const sectionIds = { Partners: 'partners', Community: 'community' }
const sections = Object.fromEntries(thanks.split(/^## /m).slice(1).map((section) => {
  const [title, ...lines] = section.split(/\r?\n/)
  const id = sectionIds[title.trim()]
  if (!id) throw new Error(`THANKS.md: unknown section "${title.trim()}", expected one of ${Object.keys(sectionIds).join(', ')}`)
  return [id, lines.filter((line) => /^[-*+] /.test(line)).map((line) => {
    const [, name, href] = line.match(/^. \[([^\]]+)\]\(([^)]+)\)/) ?? line.match(/^. ([^:,]+)/)
    return href ? { name, href } : { name: name.trim() }
  })]
}))

const thanksFile = new URL('../desktop/dashboard/src/thanks.json', import.meta.url)
await writeFile(thanksFile, `${JSON.stringify(sections, null, 1)}\n`)
console.log(`${Object.keys(sections).length} sections of thanks written to ${thanksFile.pathname}`)
