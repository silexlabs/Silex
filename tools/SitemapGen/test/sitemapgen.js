import { generateSitemap } from '../src/index.js';
import fs from 'fs';
import assert from 'node:assert/strict';

const tmpOut = '.'
fs.mkdirSync(tmpOut, { recursive: true });

await generateSitemap({
  siteUrl: 'https://test.local',
  inputDir: 'test-site',
  output: tmpOut,
});

const content = fs.readFileSync(`${tmpOut}/sitemap.xml`, 'utf-8');

assert.ok(content.includes('<urlset'), 'sitemap must contain <urlset>');
assert.ok(content.includes('<loc>https://test.local/'), 'sitemap must contain loc with base URL');
assert.ok(content.includes('<xhtml:link'), 'sitemap must include alternate links');

console.log('✅ Test passed');
