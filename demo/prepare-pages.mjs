import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Run the separate static demo build first. Production server output is never copied.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist-demo');
const entries = await readdir(output, { withFileTypes: true });
if (entries.some(entry => !['index.html', 'demo-assets'].includes(entry.name))) {
  throw new Error('Unexpected files in demo output; refusing to publish them.');
}
const html = await readFile(resolve(output, 'index.html'), 'utf8');
if (!html.includes('/xinkalius/demo-assets/')) throw new Error('Missing GitHub Pages base path.');
await mkdir(resolve(root, 'demo-assets'), { recursive: true });
await cp(resolve(output, 'demo-assets'), resolve(root, 'demo-assets'), { recursive: true });
await writeFile(resolve(root, 'index.html'), html);
await writeFile(resolve(root, '.nojekyll'), '');
console.log('Prepared index.html, demo-assets/ and .nojekyll for GitHub Pages.');
