// Makes the 2x ("HD") art the game draws on high-DPI screens (phones, big monitors),
// and public/assets/hd/manifest.json. Review it at /tools/upscale-review.html.
//
//   sprites  legacy/Sprites/*.bmp -> public/assets/hd/sprites/<key>.webp
//   fg       legacy/fg/*.bmp      -> public/assets/hd/fg/<key>.webp
//   bg       legacy/BG/*.bmp      -> public/assets/hd/bg/<key>.webp
//
// Keyed art is defringed first: the originals were rendered against black and keyed on
// exact #000, which leaves a dark halo. Edge pixels darker than the shape's interior get
// partial alpha with the black blended back out (see defringe()). Then each frame is upscaled on its
// own (so neighbouring frames can't bleed into it) with Real-ESRGAN x4plus, downsampled
// to 2x, and given an alpha channel resized separately.
//
// Needs realesrgan-ncnn-vulkan (github.com/xinntao/Real-ESRGAN releases), unzipped to
// tools/bin/realesrgan/ or pointed at by the ESRGAN env var. Re-running only redoes
// changed files; `--force` redoes everything.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { decodeBmp } from './lib/bmp.mjs';
import { assetKey } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = path.join(root, 'legacy');
const outRoot = path.join(root, 'public', 'assets', 'hd');
const exe = process.env.ESRGAN || path.join(root, 'tools', 'bin', 'realesrgan', 'realesrgan-ncnn-vulkan.exe');
const force = process.argv.includes('--force');
const MODEL = 'realesrgan-x4plus';
const PAD = 8; // transparent border around each frame while upscaling

// Frame layouts, as the game loads them: src/game/preload.ts COMMON_SPRITES plus every
// fairy in the scenarios and the Massacre roster (sprite + death sprite share a layout,
// act sprites are 8x1). Anything not listed is treated as a single frame.
const COMMON = {
  splat: [4, 1], gore: [16, 1], fmine: [8, 1], fmined1: [8, 1], bhole: [4, 1], ion: [9, 1],
  piano: [2, 1], p1d1: [4, 1], busanim: [2, 1],
  0: [8, 1], 25: [8, 1], 50: [8, 1], 100: [8, 1], 200: [8, 1], 500: [8, 1], 1000: [8, 1],
};

// Flat UI art, logos, HUD icons and faces: drawn, not rendered against black, so their
// dark edges are deliberate. These only get the exact-black key.
const KEY_ONLY = new Set([
  'topbar', 'topbar2', 'roundinfo', 'endgame', 'win', 'win2', 'banner', 'mofhof', 'mofhof2', 'usstats',
  'logospl', 'pplogo', 'pandp', 'pandptitle', 'fairy-splash-screen',
  'gun', 'shotgun', 'mgun', 'howitz', 'fmine1', 'buscon', 'ioncon', 'pianocon', 'holewep',
  'shotammo', 'howieammo', 'mineammo', 'busammo', 'bozo', 'dave', 'nick', 'face1',
]);

function layouts() {
  const map = new Map(Object.entries(COMMON));
  const fairyLists = [
    ...fs.readdirSync(path.join(root, 'data', 'scenarios')).map((f) => JSON.parse(fs.readFileSync(path.join(root, 'data', 'scenarios', f), 'utf8')).fairies),
    JSON.parse(fs.readFileSync(path.join(root, 'data', 'fairies.json'), 'utf8')),
  ];
  for (const fairies of fairyLists) {
    for (const f of Object.values(fairies)) {
      const rows = f.class === 1 || f.class === 3 ? 2 : 1; // spriteRows(): walkers and flyers face both ways
      for (const key of [f.sprite, f.deathSprite]) if (!map.has(key)) map.set(key, [f.frames, rows]);
      if (f.actSprite && !map.has(f.actSprite)) map.set(f.actSprite, [8, 1]);
    }
  }
  return map;
}

// Sprites the port actually uses: any key that appears quoted in src/ or data/. The
// original folder also holds leftovers (old logos, an unused second top bar, ...).
function referencedKeys() {
  const text = [];
  for (const dir of ['src', 'data']) {
    for (const f of fs.readdirSync(path.join(root, dir), { recursive: true })) {
      if (/\.(ts|json)$/.test(f)) text.push(fs.readFileSync(path.join(root, dir, f), 'utf8'));
    }
  }
  const all = text.join('\n');
  return (key) => all.includes(`'${key}'`) || all.includes(`"${key}"`);
}

function listBmps(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.bmp')).map((f) => path.join(dir, f));
}

const upToDate = (src, dest) => !force && fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
const rawImage = (img) => sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } });

// Exact black is transparent, as in the original's DirectDraw colour key (anything else,
// however dark, is part of the art: a black piano, dark wood grain). The halo comes from
// edge pixels the renderer anti-aliased against black, so an edge pixel is only faded
// when it's darker than the solid colour just inside the shape: alpha = its brightness /
// the interior's, and the black is divided back out. A dark pixel on a dark object keeps
// full alpha. Tiny isolated dark specks (render noise) are dropped; small bright ones are
// blood drops and sparks, so they stay. `fringe: false` (UI art) only applies the key.
function defringe(img, { fringe = true, edgeDist = 1, reach = 3, fade = 0.6, minIsland = 6, speck = 40, maxHole = 40 } = {}) {
  const { width: w, height: h } = img;
  const d = Buffer.from(img.data);
  const n = w * h;
  const mx = new Uint8Array(n);
  for (let i = 0; i < n; i++) mx[i] = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) solid[i] = mx[i] > 0 ? 1 : 0;
  if (!fringe) {
    for (let i = 0; i < n; i++) d[i * 4 + 3] = solid[i] ? 255 : 0;
    return { ...img, data: d };
  }

  // Pinholes: the renderer left scattered pure-black pixels inside dark surfaces (the
  // piano body). In the original they showed as see-through specks; upscaled they merge
  // into blotches. Small transparent pockets that don't reach the frame edge or the
  // open background are filled (colour comes from bleed() later). Real gaps, like
  // between arms and body, are bigger than maxHole.
  const open = new Uint8Array(n);
  for (let s = 0; s < n; s++) {
    if (solid[s] || open[s]) continue;
    const comp = [s];
    open[s] = 1;
    let edge = false;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k];
      const x = p % w;
      const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (!solid[q] && !open[q]) {
          open[q] = 1;
          comp.push(q);
        }
      }
    }
    if (!edge && comp.length <= maxHole) for (const p of comp) solid[p] = 2;
  }

  const seen = new Uint8Array(n);
  for (let s = 0; s < n; s++) {
    if (!solid[s] || seen[s]) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k];
      const x = p % w;
      const y = (p - x) / w;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (solid[q] && !seen[q]) {
          seen[q] = 1;
          comp.push(q);
        }
      }
    }
    const avg = comp.reduce((sum, p) => sum + mx[p], 0) / comp.length;
    if (comp.length < minIsland && avg < speck && comp.every((p) => solid[p] === 1)) for (const p of comp) solid[p] = 0;
  }

  // Chessboard distance from the transparent area, up to edgeDist + 1.
  const dist = new Uint8Array(n).fill(255);
  for (let i = 0; i < n; i++) if (!solid[i]) dist[i] = 0;
  for (let pass = 0; pass <= edgeDist; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (dist[i] !== 255) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h && dist[ny * w + nx] === pass) dist[i] = pass + 1;
          }
        }
      }
    }
  }

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (!solid[i]) {
      d[o + 3] = 0;
      continue;
    }
    d[o + 3] = 255;
    if (solid[i] === 2) continue; // filled pinhole, coloured below
    if (dist[i] > edgeDist) continue;
    // Reference brightness: the average interior pixel nearby (or, for thin parts with
    // no interior, the brightest solid neighbour).
    const x = i % w;
    const y = (i - x) / w;
    let innerSum = 0;
    let innerCount = 0;
    let near = 0;
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (solid[q] !== 1) continue;
        if (dist[q] > edgeDist) {
          innerSum += mx[q];
          innerCount++;
        } else near = Math.max(near, mx[q]);
      }
    }
    const ref = innerCount ? innerSum / innerCount : near;
    if (!ref || mx[i] >= ref * fade) continue;
    const a = Math.max(0.15, mx[i] / ref);
    d[o] = Math.min(255, d[o] / a);
    d[o + 1] = Math.min(255, d[o + 1] / a);
    d[o + 2] = Math.min(255, d[o + 2] / a);
    d[o + 3] = Math.round(a * 255);
  }

  // Colour filled pinholes from their solid neighbours, working inwards.
  let todo = [];
  for (let i = 0; i < n; i++) if (solid[i] === 2) todo.push(i);
  while (todo.length) {
    const left = [];
    const done = [];
    for (const i of todo) {
      const x = i % w;
      const y = (i - x) / w;
      let r = 0, g = 0, b = 0, c = 0;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const q = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || solid[q] !== 1) continue;
        r += d[q * 4];
        g += d[q * 4 + 1];
        b += d[q * 4 + 2];
        c++;
      }
      if (c) done.push([i, r / c, g / c, b / c]);
      else left.push(i);
    }
    if (!done.length) break;
    for (const [i, r, g, b] of done) {
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = b;
      solid[i] = 1;
    }
    todo = left;
  }
  return { ...img, data: d };
}

// Spreads edge colours into transparent pixels so the upscaler never sees a black border.
function bleed(img, passes = 6) {
  const { width: w, height: h } = img;
  const d = Buffer.from(img.data);
  const known = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) known[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  for (let p = 0; p < passes; p++) {
    const add = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (known[i]) continue;
        let r = 0, g = 0, b = 0, c = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const q = ny * w + nx;
            if (known[q]) {
              r += d[q * 4];
              g += d[q * 4 + 1];
              b += d[q * 4 + 2];
              c++;
            }
          }
        }
        if (c) add.push([i, r / c, g / c, b / c]);
      }
    }
    for (const [i, r, g, b] of add) {
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = b;
      known[i] = 1;
    }
  }
  return { ...img, data: d };
}

// One frame with a transparent `pad` border.
function frame(img, x0, y0, fw, fh, pad) {
  const W = fw + pad * 2;
  const H = fh + pad * 2;
  const d = Buffer.alloc(W * H * 4);
  for (let y = 0; y < fh; y++) {
    const s = ((y0 + y) * img.width + x0) * 4;
    img.data.copy(d, ((y + pad) * W + pad) * 4, s, s + fw * 4);
  }
  return { width: W, height: H, data: d };
}

function runEsrgan(inDir, outDir) {
  if (!fs.existsSync(exe)) throw new Error(`Real-ESRGAN not found at ${exe} (set ESRGAN or unzip it to tools/bin/realesrgan/)`);
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(exe, ['-i', inDir, '-o', outDir, '-n', MODEL, '-s', '4', '-f', 'png'], { cwd: path.dirname(exe), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Real-ESRGAN failed: ${(r.stderr || '').slice(-800)}`);
}

const started = Date.now();
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mof-upscale-'));
const inDir = path.join(work, 'in');
const outDir = path.join(work, 'out');
fs.mkdirSync(inDir);
const frameLayouts = layouts();
const isUsed = referencedKeys();
const jobs = []; // keyed sheets waiting for their upscaled frames
const manifest = { sprites: {}, fg: {}, bg: {} };
let skipped = 0;

// 1. Write upscaler input: every frame of every changed keyed sheet, plus whole backgrounds.
for (const [group, dir] of [['sprites', 'Sprites'], ['fg', 'fg']]) {
  for (const src of listBmps(path.join(legacy, dir))) {
    const key = assetKey(src);
    if (group === 'sprites' && !isUsed(key)) {
      fs.rmSync(path.join(outRoot, group, `${key}.webp`), { force: true }); // from older runs
      continue;
    }
    const [fx, fy] = group === 'fg' ? [1, 1] : (frameLayouts.get(key) ?? [1, 1]);
    const dest = path.join(outRoot, group, `${key}.webp`);
    const img = decodeBmp(fs.readFileSync(src));
    const fw = Math.floor(img.width / fx);
    const fh = Math.floor(img.height / fy);
    manifest[group][key] = { file: `${group}/${key}.webp`, w: img.width * 2, h: img.height * 2, frames: [fx, fy] };
    if (fw * fx !== img.width || fh * fy !== img.height) console.warn(`${key}: ${img.width}x${img.height} doesn't divide into ${fx}x${fy} frames`);
    if (upToDate(src, dest)) {
      skipped++;
      continue;
    }
    const clean = defringe(img, { fringe: !KEY_ONLY.has(key) });
    const bled = bleed(clean);
    for (let y = 0; y < fy; y++) {
      for (let x = 0; x < fx; x++) {
        const f = frame(bled, x * fw, y * fh, fw, fh, PAD);
        await rawImage(f).removeAlpha().png().toFile(path.join(inDir, `${group}~${key}~${x}~${y}.png`));
      }
    }
    jobs.push({ group, key, clean, fx, fy, fw, fh, dest, size: [img.width, img.height] });
  }
}
const bgJobs = [];
for (const src of listBmps(path.join(legacy, 'BG'))) {
  const key = assetKey(src);
  const dest = path.join(outRoot, 'bg', `${key}.webp`);
  const img = decodeBmp(fs.readFileSync(src));
  manifest.bg[key] = { file: `bg/${key}.webp`, w: img.width * 2, h: img.height * 2 };
  if (upToDate(src, dest)) {
    skipped++;
    continue;
  }
  await rawImage(img).removeAlpha().png().toFile(path.join(inDir, `bg~${key}~0~0.png`));
  bgJobs.push({ key, dest, size: [img.width, img.height] });
}

// 2. One upscaler run for everything (the model loads once).
if (jobs.length + bgJobs.length) {
  console.log(`Upscaling ${fs.readdirSync(inDir).length} images with ${MODEL}...`);
  runEsrgan(inDir, outDir);
}

// 3. Reassemble: 4x model output downsampled to 2x, alpha resized from the cleaned 1x.
for (const { group, key, clean, fx, fy, fw, fh, dest, size } of jobs) {
  const W = size[0] * 2;
  const H = size[1] * 2;
  const PW = (fw + PAD * 2) * 2;
  const PH = (fh + PAD * 2) * 2;
  const sheet = Buffer.alloc(W * H * 4);
  for (let y = 0; y < fy; y++) {
    for (let x = 0; x < fx; x++) {
      const rgb = await sharp(path.join(outDir, `${group}~${key}~${x}~${y}.png`)).resize(PW, PH, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
      const a1 = frame(clean, x * fw, y * fh, fw, fh, PAD);
      const alpha = await rawImage(a1).extractChannel(3).resize(PW, PH, { kernel: 'lanczos3' }).raw().toBuffer();
      for (let yy = 0; yy < fh * 2; yy++) {
        for (let xx = 0; xx < fw * 2; xx++) {
          const s = (yy + PAD * 2) * PW + xx + PAD * 2;
          const o = ((y * fh * 2 + yy) * W + x * fw * 2 + xx) * 4;
          // Lanczos rings a little around hard edges; snap the faint ends back to 0/255.
          const a = alpha[s];
          sheet[o] = rgb[s * 3];
          sheet[o + 1] = rgb[s * 3 + 1];
          sheet[o + 2] = rgb[s * 3 + 2];
          sheet[o + 3] = a < 24 ? 0 : a > 232 ? 255 : Math.round(((a - 24) / 208) * 255);
        }
      }
    }
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(sheet, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 100 }).toFile(dest);
}
for (const { key, dest, size } of bgJobs) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(path.join(outDir, `bg~${key}~0~0.png`)).resize(size[0] * 2, size[1] * 2, { kernel: 'lanczos3' }).webp({ quality: 85 }).toFile(dest);
}

fs.rmSync(work, { recursive: true, force: true });
for (const group of Object.keys(manifest)) {
  manifest[group] = Object.fromEntries(Object.entries(manifest[group]).sort(([a], [b]) => a.localeCompare(b)));
}
fs.writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Upscaled ${jobs.length + bgJobs.length}, skipped ${skipped} up to date, in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
