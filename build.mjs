import { copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, 'dist');
if (!dist.startsWith(`${root}\\`) && !dist.startsWith(`${root}/`)) throw new Error('Diretório de compilação inválido.');

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'server'), { recursive: true });
await cp(resolve(root, 'public'), resolve(dist, 'client'), { recursive: true });
await copyFile(resolve(root, 'worker.js'), resolve(dist, 'server', 'index.js'));
await writeFile(resolve(dist, 'server', 'wrangler.json'), JSON.stringify({
  main: 'index.js',
  compatibility_date: '2026-08-28',
  assets: { directory: '../client', binding: 'ASSETS', not_found_handling: 'single-page-application' },
}, null, 2));
