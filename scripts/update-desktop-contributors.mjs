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
