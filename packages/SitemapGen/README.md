# @silexlabs/sitemapgen

Generate a`sitemap.xml` from a static site generator (SSG) output directory.

> This code is part of a larger project: [about Silex v3](https://www.silexlabs.org/silex-v3-kickoff/)
> The Advanced Selector Manager comes pre-installed in Silex v3, [give it a try here](https://v3.silex.me/)

## Installation

Use without install:

```bash
npx @silexlabs/sitemapgen -s _site -o _site -u https://example.com
```

Or as a dev dependency:

```bash
npm install --save-dev @silexlabs/sitemapgen
```

## CLI Usage

```bash
npx @silexlabs/sitemapgen [options]
```

### Options

| Option             | Alias | Description                                 |
| ------------------ | ----- | ------------------------------------------- |
| `--source`         | `-s`  | Source folder with `.html` files            |
| `--output`         | `-o`  | Output file or directory                    |
| `--url`            | `-u`  | Base URL (e.g. `https://example.com`)       |
| `--lastmod <mode>` |       | Add `<lastmod>`: `meta`, `mtime`, or `auto` |

### Example

```bash
npx @silexlabs/sitemapgen -s _site -o _site -u https://silex.me --lastmod auto
```

---

## Module Usage

```js
import { generateSitemap } from '@silexlabs/sitemapgen';

await generateSitemap({
  siteUrl: 'https://example.com',
  inputDir: '_site',
  output: '_site/sitemap.xml',
  lastmod: 'auto', // or 'meta', 'mtime', or null
});
```

---

## Language & Alternate Support

* Language is detected via `<html lang="...">`
* Alternates are read from `<link rel="alternate" hreflang="..." href="...">`
* All variants are grouped under one `<url>` block

---

## `<lastmod>` Support

If you use `--lastmod`, the following modes are supported:

* `meta`: use `<meta name="lastmod">`
* `mtime`: use file modification date
* `auto`: use `meta` if found, fallback to `mtime`

### Example `<meta>` tag:

```html
<meta name="lastmod" content="2024-08-01">
```

---

## License

GPL — © Silex Labs
