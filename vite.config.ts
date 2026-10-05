import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Relative asset paths, so the built site works from any folder on any web
// server (e.g. https://example.com/games/mof/) without reconfiguring.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  plugins: [serviceWorker()],
});

// Writes dist/sw.js from tools/sw.template.js with the list of every built
// file to cache for offline play, and a version that changes with the content.
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'mof-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push(path.relative(outDir, full).split(path.sep).join('/'));
        }
      };
      walk(outDir);
      // The 2x art (assets/hd/) isn't precached: only high-DPI screens use it, so the
      // service worker caches it as it's fetched instead.
      const precache = ['./', ...files.filter((f) => f !== 'sw.js' && f !== 'index.html' && !f.startsWith('assets/hd/')).sort()];
      const hash = createHash('sha256');
      for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(outDir, f)));
      const template = fs.readFileSync(path.resolve(__dirname, 'tools/sw.template.js'), 'utf8');
      const sw = template
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      fs.writeFileSync(path.join(outDir, 'sw.js'), sw);
    },
  };
}
