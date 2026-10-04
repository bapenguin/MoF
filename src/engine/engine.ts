// Game loop and scene manager.
//
// The VB game ran an uncapped busy loop (gameloop + DoEvents), so anything done
// "per loop" ran at whatever speed the PC managed. Here the simulation steps at a
// fixed 60 Hz and rendering happens once per animation frame. Blocking waits like
// waitforclick become separate scenes.

import { fitCanvas } from './screen';
import { Input } from './input';

export const STEP_MS = 1000 / 60;
const MAX_STEPS = 5; // after a long stall (tab hidden), drop time rather than fast-forward

export interface Scene {
  enter?(engine: Engine): void;
  exit?(): void;
  update(dt: number): void; // dt is always STEP_MS / 1000
  render(ctx: CanvasRenderingContext2D): void;
}

export class Engine {
  readonly ctx: CanvasRenderingContext2D;
  readonly input: Input;
  // Simulation clock in ms. Stands in for GetTickCount; stops while the tab is hidden.
  now = 0;
  fps = 0;
  private scene: Scene | null = null;
  private next: Scene | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    fitCanvas(canvas);
    this.input = new Input(canvas);
  }

  // Switches at the start of the next step, so a scene can switch mid-update safely.
  setScene(scene: Scene): void {
    this.next = scene;
  }

  start(): void {
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let fpsStart = last;
    const tick = (t: number) => {
      acc += t - last;
      last = t;
      let steps = 0;
      while (acc >= STEP_MS && steps < MAX_STEPS) {
        this.swapScene();
        this.now += STEP_MS;
        this.scene?.update(STEP_MS / 1000);
        acc -= STEP_MS;
        steps++;
      }
      if (steps === MAX_STEPS) acc = 0;
      this.swapScene();
      this.scene?.render(this.ctx);

      frames++;
      if (t - fpsStart >= 1000) {
        this.fps = Math.round((frames * 1000) / (t - fpsStart));
        frames = 0;
        fpsStart = t;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private swapScene() {
    if (!this.next) return;
    this.scene?.exit?.();
    this.scene = this.next;
    this.next = null;
    this.input.takeClicks();
    this.input.takeKeys();
    this.scene.enter?.(this);
  }
}
