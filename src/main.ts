// Phase 0 smoke test: proves the asset pipeline end to end (scaled canvas,
// background, animated keyed sprite sheet, click-to-shoot sound).
// Replaced by the real game state machine in Phase 1+.

import { fitCanvas, toLogical, SCREEN_W, SCREEN_H } from './engine/screen';
import { loadManifest, loadImage, soundUrl } from './engine/assets';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
fitCanvas(canvas);

await loadManifest();
const [bg, topbar, fairy] = await Promise.all([
  loadImage('bg', 'beach'),
  loadImage('sprites', 'topbar'),
  loadImage('sprites', 'fairy1'),
]);

const FRAMES = 8;
const fw = fairy.width / FRAMES;
const fh = fairy.height;
const pos = { x: 400, y: 300, vx: 150, vy: 90 };
let audio: AudioContext | null = null;
let shot: AudioBuffer | null = null;

canvas.addEventListener('pointerdown', async (e) => {
  // Browsers only allow audio after a user gesture.
  if (!audio) {
    audio = new AudioContext();
    shot = await audio.decodeAudioData(await (await fetch(soundUrl('44mag'))).arrayBuffer());
  }
  const src = audio.createBufferSource();
  src.buffer = shot;
  const pan = audio.createStereoPanner();
  pan.pan.value = toLogical(canvas, e).x / SCREEN_W * 2 - 1;
  src.connect(pan).connect(audio.destination);
  src.start();
});

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  pos.x += pos.vx * dt;
  pos.y += pos.vy * dt;
  if (pos.x < 0 || pos.x + fw > SCREEN_W) pos.vx = -pos.vx;
  if (pos.y < 83 || pos.y + fh > SCREEN_H) pos.vy = -pos.vy;

  ctx.drawImage(bg, 0, 0);
  const f = Math.floor(now / 35) % FRAMES;
  ctx.drawImage(fairy, f * fw, 0, fw, fh, Math.round(pos.x), Math.round(pos.y), fw, fh);
  ctx.drawImage(topbar, 0, 0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
