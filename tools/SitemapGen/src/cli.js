#!/usr/bin/env node

import { generateSitemap } from './index.js';
import { program } from 'commander';
import path from 'path';

program
  .name('sitemapgen')
  .description('Generate a multilingual sitemap.xml from an HTML folder')
  .requiredOption('-s, --source <dir>', 'Source directory containing .html files')
  .requiredOption('-o, --output <path>', 'Output path (file or directory)')
  .requiredOption('-u, --url <url>', 'Base URL of the website')
  .option('--lastmod <mode>', 'Add a <lastmod> tag (meta|mtime|auto)', '');

program.parse();

const options = program.opts();

await generateSitemap({
  siteUrl: options.url,
  inputDir: path.resolve(options.source),
  output: path.resolve(options.output),
  lastmod: options.lastmod || null,
});
