// The original ran fullscreen at a fixed 1024x768 (fmod.bas ScreenWidth/ScreenHeight).
// We keep that as the logical resolution and letterbox-scale the canvas to the window.
//
// The canvas's backing store matches the device pixels it covers (capped at 2x the
// logical size), so text, edges and the 2x art stay sharp on phones and big screens.
// Everything still draws in logical pixels: Engine applies `renderScale` as a transform.

export const SCREEN_W = 1024;
export const SCREEN_H = 768;
const MAX_RENDER_SCALE = 2;

// Device pixels per logical pixel in the canvas's backing store.
export let renderScale = 1;

// `overlay` is the HTML menu layer: laid out in logical 1024x768 pixels and
// scaled with a transform so it always lines up with the canvas.
export function fitCanvas(canvas: HTMLCanvasElement, overlay?: HTMLElement): void {
  const resize = () => {
    const scale = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
    const w = Math.floor(SCREEN_W * scale);
    const h = Math.floor(SCREEN_H * scale);
    const left = `${Math.floor((window.innerWidth - w) / 2)}px`;
    const top = `${Math.floor((window.innerHeight - h) / 2)}px`;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = left;
    canvas.style.top = top;
    // Never below 1x: a small window keeps the original resolution, scaled down by CSS.
    renderScale = Math.min(MAX_RENDER_SCALE, Math.max(1, (w / SCREEN_W) * (window.devicePixelRatio || 1)));
    const bw = Math.round(SCREEN_W * renderScale);
    const bh = Math.round(SCREEN_H * renderScale);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    if (overlay) {
      overlay.style.left = left;
      overlay.style.top = top;
      overlay.style.transform = `scale(${w / SCREEN_W})`;
    }
  };
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

// Converts a pointer event to logical 1024x768 coordinates.
export function toLogical(canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * SCREEN_W,
    y: ((e.clientY - r.top) / r.height) * SCREEN_H,
  };
}
