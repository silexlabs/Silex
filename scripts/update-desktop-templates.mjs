import { writeFile } from 'node:fs/promises'

const api = 'https://silex2026.wp.cms.blue/graphql-silex'

const content = `
  templateDescription
  preview
`

const query = `{
  templates(first: 1000, where: { language: EN }) {
    nodes {
      title
      paymentLink
      repo
      screenshot { node { sourceUrl(size: MEDIUM_LARGE) } }
      ${content}
      translation(language: FR) { ${content} }
    }
  }
}`

function text(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

const localized = (node) => node && { description: text(node.templateDescription ?? ''), preview: node.preview }

const response = await fetch(api, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
})
if (!response.ok) throw new Error(`${api}: HTTP ${response.status}`)
const { data, errors } = await response.json()
if (errors) throw new Error(errors.map((error) => error.message).join('\n'))

// Same order as silex.me/templates: it sorts by payment link, so the free templates come first
const templates = data.templates.nodes
  .sort((a, b) => (a.paymentLink ?? '').localeCompare(b.paymentLink ?? ''))
  .map((node) => ({
    name: node.title,
    repo: node.repo,
    image: node.screenshot?.node.sourceUrl ?? '',
    ...(node.paymentLink && { paymentLink: node.paymentLink }),
    en: localized(node),
    ...(node.translation && { fr: localized(node.translation) }),
  }))

const file = new URL('../desktop/dashboard/src/templates.json', import.meta.url)
await writeFile(file, `${JSON.stringify(templates, null, 2)}\n`)
console.log(`${templates.length} templates written to ${file.pathname}`)
