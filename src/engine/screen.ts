// The original ran fullscreen at a fixed 1024x768 (fmod.bas ScreenWidth/ScreenHeight).
// We keep that as the logical resolution and letterbox-scale the canvas to the window.
//
// The canvas's backing store matches the device pixels it covers (capped at 2x the
// logical size), so text, edges and the 2x art stay sharp on phones and big screens.
// Everything still draws in logical pixels: Engine applies `renderScale` as a transform.
//
// Touch layout (new): on phones and tablets the bars either side of the 4:3 game hold
// touch controls (src/ui/rails.ts), so the game leaves room for them and stays inside
// the notch's safe area.

export const SCREEN_W = 1024;
export const SCREEN_H = 768;
const MAX_RENDER_SCALE = 2;
const MIN_RAIL = 76; // CSS px: narrowest a touch rail may be

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  touch: boolean;
  game: Rect;
  // The touch rails either side of the game (null without the touch layout).
  left: Rect | null;
  right: Rect | null;
}

// Phones and tablets (a coarse pointer); `?touch=1` / `?touch=0` force it for testing.
export const touchLayout: boolean = (() => {
  const forced = new URLSearchParams(location.search).get('touch');
  if (forced === '1' || forced === '0') return forced === '1';
  return matchMedia('(pointer: coarse)').matches;
})();

// Device pixels per logical pixel in the canvas's backing store.
export let renderScale = 1;
export let layout: Layout = { touch: touchLayout, game: { x: 0, y: 0, w: SCREEN_W, h: SCREEN_H }, left: null, right: null };
const listeners = new Set<(l: Layout) => void>();
let refit: () => void = () => {};

// Logical rows hidden off the top of the canvas. During play on the touch layout the
// HUD bar's strip is cropped away (the rails show its numbers, and fairies never fly
// up there), so the playfield is shown bigger; everything else shows all 768 rows.
export let viewTop = 0;
export function setViewTop(top: number): void {
  if (top === viewTop) return;
  viewTop = top;
  refit();
}

// Calls `fn` now and whenever the layout changes; returns an unsubscribe function.
export function onLayout(fn: (l: Layout) => void): () => void {
  listeners.add(fn);
  fn(layout);
  return () => listeners.delete(fn);
}

// env(safe-area-inset-*) is only readable through CSS, so measure a probe element.
let probe: HTMLElement | null = null;
function safeArea() {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
  }
  const s = getComputedStyle(probe);
  return { l: parseFloat(s.paddingLeft) || 0, r: parseFloat(s.paddingRight) || 0, t: parseFloat(s.paddingTop) || 0, b: parseFloat(s.paddingBottom) || 0 };
}

function computeLayout(): Layout {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const viewH = SCREEN_H - viewTop;
  if (!touchLayout) {
    const scale = Math.min(W / SCREEN_W, H / viewH);
    const w = Math.floor(SCREEN_W * scale);
    const h = Math.floor(viewH * scale);
    return { touch: false, game: { x: Math.floor((W - w) / 2), y: Math.floor((H - h) / 2), w, h }, left: null, right: null };
  }
  const safe = safeArea();
  const usableW = W - safe.l - safe.r;
  const usableH = H - safe.t - safe.b;
  // Wide phones have room to spare; on squarer screens the game shrinks to fit the rails.
  const scale = Math.max(0.1, Math.min((usableW - 2 * MIN_RAIL) / SCREEN_W, usableH / viewH));
  const w = Math.floor(SCREEN_W * scale);
  const h = Math.floor(viewH * scale);
  const x = Math.floor(safe.l + (usableW - w) / 2);
  const y = Math.floor(safe.t + (usableH - h) / 2);
  return {
    touch: true,
    game: { x, y, w, h },
    left: { x: safe.l, y, w: x - safe.l, h },
    right: { x: x + w, y, w: safe.l + usableW - (x + w), h },
  };
}

// `overlay` is the HTML menu layer: laid out in logical 1024x768 pixels and
// scaled with a transform so it always lines up with the canvas.
export function fitCanvas(canvas: HTMLCanvasElement, overlay?: HTMLElement): void {
  const resize = () => {
    layout = computeLayout();
    const { x, y, w, h } = layout.game;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
    // Never below 1x: a small window keeps the original resolution, scaled down by CSS.
    renderScale = Math.min(MAX_RENDER_SCALE, Math.max(1, (w / SCREEN_W) * (window.devicePixelRatio || 1)));
    const bw = Math.round(SCREEN_W * renderScale);
    const bh = Math.round((SCREEN_H - viewTop) * renderScale);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    if (overlay) {
      const scale = w / SCREEN_W;
      overlay.style.left = `${x}px`;
      overlay.style.top = `${y - viewTop * scale}px`; // so its logical rows line up with the canvas
      overlay.style.transform = `scale(${scale})`;
      overlay.style.clipPath = viewTop ? `inset(${viewTop}px 0 0 0)` : '';
    }
    for (const fn of listeners) fn(layout);
  };
  refit = resize;
  window.addEventListener('resize', resize);
  // Moving the window to a screen with a different pixel ratio doesn't fire resize.
  const watchDpr = () => {
    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => {
        resize();
        watchDpr();
      },
      { once: true },
    );
  };
  watchDpr();
  resize();
}

// CSS pixels per logical pixel: how big the game currently is on screen.
export function displayScale(): number {
  return layout.game.w / SCREEN_W;
}

// Converts a pointer event to logical 1024x768 coordinates.
export function toLogical(canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * SCREEN_W,
    y: viewTop + ((e.clientY - r.top) / r.height) * (SCREEN_H - viewTop),
  };
}
