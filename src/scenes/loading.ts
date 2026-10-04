// Generic loading screen: runs a set of load tasks with a progress bar, then waits
// for a click (which also unlocks browser audio) before moving to the next scene.

import type { Engine, Scene } from '../engine/engine';
import { audio } from '../engine/audio';
import { drawText } from '../engine/text';
import { SCREEN_W, SCREEN_H } from '../engine/screen';

export class LoadingScene implements Scene {
  private engine!: Engine;
  private total = 0;
  private done = 0;
  private failed: string | null = null;
  private finished = false;

  constructor(
    private title: string,
    private tasks: Array<() => Promise<unknown>>,
    private next: () => Scene,
  ) {}

  enter(engine: Engine): void {
    this.engine = engine;
    this.total = this.tasks.length;
    Promise.all(this.tasks.map((t) => t().then(() => this.done++)))
      .then(() => (this.finished = true))
      .catch((err: unknown) => {
        console.error(err);
        this.failed = err instanceof Error ? err.message : String(err);
      });
  }

  update(): void {
    const clicked = this.engine.input.takeClicks().length > 0;
    if (!this.finished) return;
    if (audio.unlocked) {
      this.engine.setScene(this.next());
    } else if (clicked) {
      void audio.unlock().then(() => this.engine.setScene(this.next()));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const cx = SCREEN_W / 2;
    drawText(ctx, cx, 300, this.title, { color: '#8f8', font: 'bold 32px Arial', align: 'center' });

    const w = 400;
    const x = cx - w / 2;
    ctx.strokeStyle = '#8f8';
    ctx.strokeRect(x, 360, w, 20);
    ctx.fillStyle = '#4a4';
    ctx.fillRect(x + 2, 362, (w - 4) * (this.total ? this.done / this.total : 1), 16);

    const msg = this.failed
      ? `Load failed: ${this.failed}`
      : this.finished
        ? 'Click to start'
        : `Loading... ${this.done}/${this.total}`;
    drawText(ctx, cx, 400, msg, { color: this.failed ? '#f66' : undefined, font: 'bold 18px Arial', align: 'center' });
  }
}
