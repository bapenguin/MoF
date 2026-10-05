// Mouse/touch/keyboard input in logical 1024x768 coordinates (frmmain.frm's
// Form_MouseDown/MouseMove/MouseUp/KeyDown). Events are queued and drained by the
// fixed-step update so a click is never lost between frames.

import { toLogical } from './screen';

export interface Click {
  x: number;
  y: number;
  touch?: boolean; // a finger (or pen) rather than a mouse: gets a little aim forgiveness
}

export class Input {
  x = 0;
  y = 0;
  down = false;
  touch = false; // the pointer currently aiming is a finger or pen
  private clicks: Click[] = [];
  private keys: string[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      try {
        // Keeps rapid fire tracking a finger/mouse that drags off the canvas.
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Unknown pointer (e.g. synthetic events): capture is a nicety, never lose the shot.
      }
      this.move(e);
      this.down = true;
      this.touch = e.pointerType === 'touch' || e.pointerType === 'pen';
      this.clicks.push({ x: this.x, y: this.y, touch: this.touch });
    });
    canvas.addEventListener('pointermove', (e) => this.move(e));
    const up = () => (this.down = false);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('blur', up);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F1') e.preventDefault(); // the game's cheat key, not browser help
      if (e.repeat) return;
      this.keys.push(e.code);
    });
  }

  private move(e: PointerEvent) {
    const p = toLogical(this.canvas, e);
    this.x = p.x;
    this.y = p.y;
  }

  takeClicks(): Click[] {
    const c = this.clicks;
    this.clicks = [];
    return c;
  }

  takeKeys(): string[] {
    const k = this.keys;
    this.keys = [];
    return k;
  }
}
