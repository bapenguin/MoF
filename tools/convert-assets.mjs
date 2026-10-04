// Converts the original BMP/WAV media in legacy/ into web formats under public/assets/
// and writes public/assets/manifest.json. Re-running only converts changed files.
//
//   sprites  legacy/Sprites/*.bmp -> sprites/<key>.png   (black keyed to transparent)
//   fg       legacy/fg/*.bmp      -> fg/<key>.png        (black keyed to transparent)
//   bg       legacy/BG/*.bmp      -> bg/<key>.webp
//   ui       legacy/*.bmp/jpg     -> ui/<key>.webp       (menu/splash art)
//   sfx      legacy/sfx/*.wav     -> sfx/<key>.mp3       (needs ffmpeg on PATH)

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import sharp from 'sharp';
import { decodeBmp, applyBlackColorKey } from './lib/bmp.mjs';
import { assetKey } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = path.join(root, 'legacy');
const outRoot = path.join(root, 'public', 'assets');

const manifest = { sprites: {}, fg: {}, bg: {}, ui: {}, sfx: {} };
let converted = 0;
let skipped = 0;

function listFiles(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .map((f) => path.join(dir, f));
}

function upToDate(src, dest) {
  return fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
}

async function readImage(src) {
  if (path.extname(src).toLowerCase() === '.bmp') {
    const { width, height, data } = decodeBmp(fs.readFileSync(src));
    return { width, height, data };
  }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

async function convertImages(group, srcDir, exts, format, keyed) {
  const outDir = path.join(outRoot, group);
  fs.mkdirSync(outDir, { recursive: true });
  for (const src of listFiles(srcDir, exts)) {
    const key = assetKey(src);
    const dest = path.join(outDir, `${key}.${format}`);
    if (upToDate(src, dest)) {
      const meta = await sharp(dest).metadata();
      manifest[group][key] = { file: `${group}/${key}.${format}`, w: meta.width, h: meta.height };
      skipped++;
      continue;
    }
    const img = await readImage(src);
    if (keyed) applyBlackColorKey(img);
    let pipeline = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } });
    pipeline = format === 'png' ? pipeline.png({ compressionLevel: 9, palette: false }) : pipeline.webp({ quality: 82 });
    await pipeline.toFile(dest);
    manifest[group][key] = { file: `${group}/${key}.${format}`, w: img.width, h: img.height };
    converted++;
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-500)))));
  });
}

async function convertSounds() {
  const outDir = path.join(outRoot, 'sfx');
  fs.mkdirSync(outDir, { recursive: true });
  const jobs = listFiles(path.join(legacy, 'sfx'), ['.wav']).map((src) => async () => {
    const key = assetKey(src);
    const dest = path.join(outDir, `${key}.mp3`);
    manifest.sfx[key] = { file: `sfx/${key}.mp3` };
    if (upToDate(src, dest)) {
      skipped++;
      return;
    }
    // Music gets stereo 128k; effects are mono and smaller.
    const isMusic = key.startsWith('music');
    const audioArgs = isMusic ? ['-ac', '2', '-b:a', '128k'] : ['-ac', '1', '-b:a', '96k'];
    await runFfmpeg(['-y', '-loglevel', 'error', '-i', src, '-codec:a', 'libmp3lame', ...audioArgs, dest]);
    converted++;
  });

  const width = Math.max(2, os.cpus().length - 1);
  let next = 0;
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (next < jobs.length) await jobs[next++]();
    }),
  );
}

const started = Date.now();
await convertImages('sprites', path.join(legacy, 'Sprites'), ['.bmp'], 'png', true);
await convertImages('fg', path.join(legacy, 'fg'), ['.bmp'], 'png', true);
await convertImages('bg', path.join(legacy, 'BG'), ['.bmp'], 'webp', false);
// (mofsplash.png duplicates mofsplash.bmp, so .png is left out to avoid a key clash.)
await convertImages('ui', legacy, ['.bmp', '.jpg'], 'webp', false);
await convertSounds();
// The in-game cursor (frmmain.frm MouseIcon); browsers accept .cur directly.
fs.copyFileSync(path.join(legacy, 'cursor.cur'), path.join(outRoot, 'ui', 'cursor.cur'));

for (const group of Object.keys(manifest)) {
  manifest[group] = Object.fromEntries(Object.entries(manifest[group]).sort(([a], [b]) => a.localeCompare(b)));
}
fs.writeFileSync(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`assets: ${converted} converted, ${skipped} up to date (${((Date.now() - started) / 1000).toFixed(1)}s)`);
