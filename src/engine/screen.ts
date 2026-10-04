// The original ran fullscreen at a fixed 1024x768 (fmod.bas ScreenWidth/ScreenHeight).
// We keep that as the logical resolution and letterbox-scale the canvas to the window.

export const SCREEN_W = 1024;
export const SCREEN_H = 768;

export function fitCanvas(canvas: HTMLCanvasElement): void {
  const resize = () => {
    const scale = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
    const w = Math.floor(SCREEN_W * scale);
    const h = Math.floor(SCREEN_H * scale);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = `${Math.floor((window.innerWidth - w) / 2)}px`;
    canvas.style.top = `${Math.floor((window.innerHeight - h) / 2)}px`;
  };
  window.addEventListener('resize', resize);
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
