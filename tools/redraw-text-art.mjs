// Redraws the HD (2x) versions of the art whose baked-in text the AI upscaler can't
// keep sharp: the score pop-ups (sprites 0, 25 ... 1000) and the "Howie Ammo" crate.
// They're drawn as SVG to match the originals (shape, colours, fonts, the dissolve
// over frames 1-7) and written over npm run upscale's versions in
// public/assets/hd/sprites/. The 1x originals are untouched; bigger text (the HUD
// bar, round card, end cards) upscales cleanly and keeps the AI version.
//
//   npm run redraw     (run after npm run upscale; that skips these keys)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'assets', 'hd', 'sprites');
const S = 2; // HD scale
const FRAME = 75; // logical frame size of the score sheets (8x1 frames)
const SERIF = "'Times New Roman', Times, serif";
const SANS = 'Arial, Helvetica, sans-serif';

// Burst colours per sheet: [centre, edge] of the radial fill, number colour, bold
// (the yellow-on-red numbers are heavier, with a dark edge), and whether it has the
// sunburst streaks the green/blue ones have.
const SCORES = {
  25: { fill: ['rgb(0,190,10)', 'rgb(0,20,160)'], text: 'rgb(200,20,20)', streaks: true },
  50: { fill: ['rgb(95,95,245)', 'rgb(35,35,205)'], text: 'rgb(215,25,25)', streaks: true },
  100: { fill: ['rgb(95,95,245)', 'rgb(35,35,205)'], text: 'rgb(215,25,25)', streaks: true },
  200: { fill: ['rgb(95,95,245)', 'rgb(35,35,205)'], text: 'rgb(215,25,25)', streaks: true },
  500: { fill: ['rgb(235,80,80)', 'rgb(205,42,44)'], text: 'rgb(255,255,0)', bold: true, streaks: false },
  1000: { fill: ['rgb(235,80,80)', 'rgb(205,42,44)'], text: 'rgb(255,255,0)', bold: true, streaks: false },
  0: { fill: ['rgb(235,80,80)', 'rgb(205,42,44)'], text: 'rgb(255,255,0)', bold: true, streaks: false, innocent: true },
};

// The fraction of the burst left in each frame as it dissolves, from the originals
// (the 1000 sheet: the number is unreadable by frame 2 or 3).
const KEEP = [1, 0.7, 0.5, 0.42, 0.28, 0.22, 0.15, 0.08];

// A small seeded PRNG, so reruns produce identical files.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// The jagged 16-point burst, centred in the frame. The horizontal points are longest,
// as in the originals.
function burstPath(cx, cy) {
  const pts = [];
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const outer = i % 2 === 0;
    const stretch = 1 + 0.12 * Math.abs(Math.cos(a)) ** 4; // longer spikes at the ends
    const rx = (outer ? 36 : 26) * (outer ? stretch : 1);
    const ry = outer ? 18.5 : 12.5;
    pts.push(`${(cx + Math.cos(a) * rx).toFixed(2)},${(cy + Math.sin(a) * ry).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

function scoreSvg(key, spec) {
  const cx = FRAME / 2;
  const cy = 37;
  const streaks = spec.streaks
    ? Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * 40).toFixed(1)}" y2="${(cy + Math.sin(a) * 22).toFixed(1)}"/>`;
      }).join('')
    : '';
  const number = spec.innocent ? '1000' : key;
  const innocent = spec.innocent
    ? `
      <line x1="${cx - 18}" y1="${cy - 7}" x2="${cx + 20}" y2="${cy + 9}" stroke="${spec.text}" stroke-width="1"/>
      <line x1="${cx - 17}" y1="${cy + 1}" x2="${cx + 17}" y2="${cy - 1}" stroke="${spec.text}" stroke-width="0.9"/>
      <text x="${cx - 33}" y="${cy + 6}" transform="rotate(17 ${cx - 33} ${cy + 6})" font-family="${SERIF}" font-style="italic" font-size="14"
        textLength="66" fill="rgb(70,230,240)" stroke="rgb(0,40,60)" stroke-width="0.6" paint-order="stroke">Innocent</text>`
    : '';
  const weight = spec.bold ? 'bold' : 'normal';
  const edge = spec.bold ? 'stroke="rgb(90,30,0)" stroke-width="0.7" paint-order="stroke"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME * S}" height="${FRAME * S}" viewBox="0 0 ${FRAME} ${FRAME}">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="55%">
        <stop offset="0" stop-color="${spec.fill[0]}"/><stop offset="1" stop-color="${spec.fill[1]}"/>
      </radialGradient>
      <clipPath id="c"><path d="${burstPath(cx, cy)}"/></clipPath>
    </defs>
    <path d="${burstPath(cx, cy)}" fill="url(#g)" stroke="#000" stroke-width="1" stroke-linejoin="miter"/>
    <g clip-path="url(#c)" stroke="rgba(255,255,255,0.13)" stroke-width="1.2">${streaks}</g>
    <text x="${cx}" y="${cy + 5.5}" text-anchor="middle" font-family="${SERIF}" font-size="17" font-weight="${weight}" fill="${spec.text}" ${edge}>${number}</text>
    ${innocent}
  </svg>`;
}

// Frames 1-7: the original's pixel dissolve. Holes eat through the burst in
// logical-pixel blocks (2x2 HD pixels) while it keeps its shape, and the black
// outline outlasts the fill, as in the originals.
function dissolve(frame0, w, h, frame, rand) {
  const out = Buffer.from(frame0);
  const keep = KEEP[frame];
  for (let by = 0; by < h; by += S) {
    for (let bx = 0; bx < w; bx += S) {
      const i = (by * w + bx) * 4;
      const dark = frame0[i] + frame0[i + 1] + frame0[i + 2] < 120;
      if (rand() < (dark ? Math.min(1, keep + 0.25) : keep)) continue;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) out[((by + y) * w + bx + x) * 4 + 3] = 0;
    }
  }
  return out;
}

async function scoreSheet(key, spec) {
  const fw = FRAME * S;
  const { data } = await sharp(Buffer.from(scoreSvg(key, spec))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rand = rng(Number(key) * 7919 + 17);
  const sheetW = fw * 8;
  const sheet = Buffer.alloc(sheetW * fw * 4);
  for (let f = 0; f < 8; f++) {
    const frame = f === 0 ? data : dissolve(data, fw, fw, f, rand);
    for (let y = 0; y < fw; y++) frame.copy(sheet, (y * sheetW + f * fw) * 4, y * fw * 4, (y + 1) * fw * 4);
  }
  await sharp(sheet, { raw: { width: sheetW, height: fw, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(outDir, `${key}.webp`));
}

// The 50x50 "Howie Ammo" crate: a stack of crates fanned out to the left, as in the
// original, with the label in red on the front one.
function crateSvg() {
  const crate = (x, y, shade) => {
    const c = (v) => Math.round(v * shade);
    const planks = [7, 14, 21, 28]
      .map((px) => `<line x1="${x + px}" y1="${y}" x2="${x + px}" y2="${y + 30}" stroke="rgba(40,15,0,0.55)" stroke-width="0.8"/>`)
      .join('');
    return `<rect x="${x}" y="${y}" width="34" height="30" fill="rgb(${c(128)},${c(66)},${c(30)})"/>
      <rect x="${x}" y="${y}" width="34" height="30" fill="url(#grain)" opacity="0.35"/>${planks}
      <rect x="${x}" y="${y}" width="34" height="30" fill="none" stroke="rgb(60,25,6)" stroke-width="0.8"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${50 * S}" height="${50 * S}" viewBox="0 0 50 50">
    ${crate(7, 10, 0.62)}${crate(8.5, 9.3, 0.72)}${crate(10, 8.6, 0.84)}${crate(11.5, 8, 1)}
    <circle cx="14.5" cy="11" r="0.9" fill="#ddd"/>
    <defs><linearGradient id="grain" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </linearGradient></defs>
    <g font-family="${SANS}" font-size="8" fill="rgb(225,0,0)" text-anchor="middle">
      <text x="29.5" y="23">Howie</text><text x="29.5" y="31.5">Ammo</text>
    </g>
  </svg>`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const [key, spec] of Object.entries(SCORES)) await scoreSheet(key, spec);
await sharp(Buffer.from(crateSvg())).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(outDir, 'howieammo.webp'));
console.log(`Redrew ${Object.keys(SCORES).length} score sheets and the Howie Ammo crate in ${path.relative(root, outDir)}.`);
