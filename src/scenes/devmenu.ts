// Temporary scenario picker until the real menus (Phase 5): all four adventure
// scenarios unlocked, no profiles.

import type { Engine, Scene } from '../engine/engine';
import { getSheet, loadSheet } from '../engine/sprites';
import { drawText } from '../engine/text';
import { SCREEN_W } from '../engine/screen';
import { loadScenario, scenarioList } from '../game/data';
import { scenarioTasks } from '../game/preload';
import { GameMode } from '../game/world';
import { LoadingScene } from './loading';
import { PlayScene } from './play';

export const MENU_ASSETS = [() => loadSheet('bforrest', 1, 1, 'bg'), () => loadSheet('mofsplash', 1, 1, 'ui')];

const ROW_Y = 300;
const ROW_H = 105;

export class DevMenuScene implements Scene {
  private engine!: Engine;
  private busy = false;
  private lastResult = '';

  enter(engine: Engine): void {
    this.engine = engine;
  }

  // Shows the outcome of the previous game under the title.
  withResult(text: string): this {
    this.lastResult = text;
    return this;
  }

  private rowAt(x: number, y: number): number {
    if (x < 162 || x > SCREEN_W - 162) return -1;
    const i = Math.floor((y - ROW_Y) / ROW_H);
    return i >= 0 && i < scenarioList.length ? i : -1;
  }

  update(): void {
    for (const c of this.engine.input.takeClicks()) {
      const i = this.rowAt(c.x, c.y);
      if (i >= 0 && !this.busy) void this.start(scenarioList[i].id);
    }
  }

  private async start(id: string): Promise<void> {
    this.busy = true;
    const scenario = await loadScenario(id);
    this.engine.setScene(
      new LoadingScene(scenario.title, scenarioTasks(scenario), () =>
        new PlayScene(scenario, GameMode.Adventure, ({ won, session }) => {
          this.busy = false;
          this.engine.setScene(
            this.withResult(`${won ? 'You beat' : 'Game over in'} ${scenario.title}: score ${session.score}`),
          );
        }),
      ),
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    getSheet('bforrest', 'bg').draw(ctx, 0, 0);
    const splash = getSheet('mofsplash', 'ui');
    const scale = 220 / splash.frameH;
    ctx.drawImage(splash.image, (SCREEN_W - splash.frameW * scale) / 2, 20, splash.frameW * scale, 220);
    if (this.lastResult) drawText(ctx, SCREEN_W / 2, 255, this.lastResult, { align: 'center', color: '#fff' });

    const hover = this.rowAt(this.engine.input.x, this.engine.input.y);
    scenarioList.forEach((s, i) => {
      const y = ROW_Y + i * ROW_H;
      ctx.fillStyle = i === hover ? 'rgba(0,60,0,0.85)' : 'rgba(0,0,0,0.7)';
      ctx.fillRect(162, y, SCREEN_W - 324, ROW_H - 10);
      drawText(ctx, 180, y + 10, s.title, { font: 'bold 22px Arial', color: i === hover ? '#7f7' : '#3c3' });
      wrap(ctx, s.description, 180, y + 40, SCREEN_W - 360);
    });
    drawText(ctx, SCREEN_W / 2, 742, 'Keys: 1-9 switch weapon · Q quits · F1 cheat', {
      align: 'center',
      color: '#ccc',
      font: '13px Arial',
    });
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number): void {
  const font = '14px Arial';
  ctx.font = font;
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      drawText(ctx, x, y, line, { font, color: '#ddd' });
      y += 17;
      line = word;
    } else line = next;
  }
  if (line) drawText(ctx, x, y, line, { font, color: '#ddd' });
}
