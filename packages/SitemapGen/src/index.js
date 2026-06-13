import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

export async function generateSitemap({
  siteUrl,
  inputDir,
  output,
  lastmod = null, // 'meta', 'mtime', or 'auto'
}) {
  if (!siteUrl || !inputDir || !output) {
    throw new Error('Missing required options: siteUrl, inputDir, or output');
  }

  const files = getAllHtmlFiles(inputDir);
  const pages = files.map(file => getPageData(file, inputDir, siteUrl, lastmod));
  console.log(`Found ${pages.length} HTML files.`, pages);
  const xml = buildSitemap(pages, siteUrl);

  const outputPath = fs.existsSync(output) && fs.lstatSync(output).isDirectory()
    ? path.join(output, 'sitemap.xml')
    : output;

  fs.writeFileSync(outputPath, xml);
  console.log(`✅ sitemap.xml written to ${outputPath}`);
}

function getAllHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const rel = fullPath.slice(dir.length);
      if (!rel.includes('/404') && !rel.includes('/error')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function sanitizeHtmlForDom(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '');
}

function getPageData(filePath, rootDir, siteUrl, lastmodOption) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const sanitized = sanitizeHtmlForDom(raw);
  const dom = new JSDOM(sanitized, {
    runScripts: 'outside-only',
    resources: 'usable',
  });
  const doc = dom.window.document;

  const lang = doc.documentElement.lang || 'en';
  const alternates = Array.from(doc.querySelectorAll('link[rel="alternate"]'))
    .filter(link => link.getAttribute('hreflang') && link.getAttribute('href'))
    .map(link => ({
      hreflang: link.getAttribute('hreflang'),
      href: link.getAttribute('href'),
    }));

  const url = filePath
    .replace(rootDir, '')
    .replace(/index\.html$/, '')
    .replace(/\\/g, '/');
  const normalized = url.endsWith('/') ? url : url + '/';

  const stat = fs.statSync(filePath);
  const metaLastmod = doc.querySelector('meta[name="lastmod"]')?.getAttribute('content');

  let lastmod = null;
  if (lastmodOption === 'meta') {
    lastmod = metaLastmod || null;
  } else if (lastmodOption === 'mtime') {
    lastmod = stat.mtime.toISOString().split('T')[0];
  } else if (lastmodOption === 'auto') {
    lastmod = (metaLastmod || stat.mtime.toISOString()).split('T')[0];
  }

  return { lang, url: normalized, alternates, lastmod };
}

function groupPages(pages) {
  const map = new Map();
  for (const page of pages) {
    console.log(`Processing page: ${page.lang} - ${page.url}`);
    const altUrls = [page.url, ...page.alternates];
    const key = altUrls.sort().join('|');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(page);
  }
  return [...map.values()];
}

function buildSitemap(pages, siteUrl) {
  const groups = groupPages(pages);

  const entries = groups.map(group => {
    const defaultPage = group.find(p => p.lang === 'en') || group[0];
    const loc = `${siteUrl}${defaultPage.url}`;
    const lastmod = defaultPage.lastmod;

    const allAlternates = new Map();
    for (const p of group) {
      allAlternates.set(p.lang, `${siteUrl}${p.url}`);
      for (const alt of p.alternates) {
        allAlternates.set(alt.hreflang, alt.href);
      }
    }

    const altLinks = [...allAlternates.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />`)
      .join('\n    ');

    return `  <url>\n    <loc>${loc}</loc>` +
      (lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '') +
      `\n    ${altLinks}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>`;
}
