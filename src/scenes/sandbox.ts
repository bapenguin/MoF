// Phase 1 engine sandbox: exercises sprite sheets (1- and 2-row), frame animation,
// per-pixel hit testing, panned/retriggered sounds, looping music and the fixed-step
// loop. Not the real game: Phase 2 replaces this with the gameplay port.

import type { Engine, Scene } from '../engine/engine';
import { getSheet, loadSheet, type SpriteSheet } from '../engine/sprites';
import { audio } from '../engine/audio';
import { drawText, str } from '../engine/text';
import { SCREEN_W, SCREEN_H } from '../engine/screen';

const SCREENTOP = 83; // below the top HUD bar
const FRAME_MS = 35; // original UpdateFrame interval

type Kind = 'fairy' | 'walker' | 'sitter' | 'flyer';

interface Spec {
  kind: Kind;
  sprite: string;
  death: string;
  rows: number;
  speed: number;
  dieSound: string;
}

const SPECS: Spec[] = [
  { kind: 'fairy', sprite: 'fairy1', death: 'fairy1d1', rows: 1, speed: 150, dieSound: 'fdie4' },
  { kind: 'fairy', sprite: 'fairy8', death: 'fairy8d1', rows: 1, speed: 300, dieSound: 'fdie8' },
  { kind: 'walker', sprite: 'boydog', death: 'boydogd1', rows: 2, speed: 150, dieSound: 'bdie' },
  { kind: 'flyer', sprite: 'bird', death: 'bird', rows: 2, speed: 150, dieSound: 'cdie' },
  { kind: 'sitter', sprite: 'screechowl', death: 'screechowld1', rows: 1, speed: 0, dieSound: 'owld1' },
];

const POPULATION: Array<[number, number]> = [
  [0, 5],
  [1, 2],
  [2, 1],
  [3, 2],
  [4, 1],
];

export const SANDBOX_SOUNDS = ['44mag', 'music5', ...new Set(SPECS.map((s) => s.dieSound))];

export function sandboxAssets(): Array<() => Promise<unknown>> {
  return [
    () => loadSheet('beach', 1, 1, 'bg'),
    () => loadSheet('topbar'),
    ...SPECS.flatMap((s) => [() => loadSheet(s.sprite, 8, s.rows), () => loadSheet(s.death, 8, s.rows)]),
    ...SANDBOX_SOUNDS.map((k) => () => audio.load(k)),
  ];
}

interface Actor {
  spec: Spec;
  sheet: SpriteSheet;
  x: number;
  y: number;
  vx: number;
  vy: number;
  frame: number;
  dying: boolean;
  respawnAt: number; // >0 while dead
}

export class SandboxScene implements Scene {
  private engine!: Engine;
  private actors: Actor[] = [];
  private frameClock = 0;
  private shots = 0;
  private hits = 0;
  private musicOn = true;

  enter(engine: Engine): void {
    this.engine = engine;
    for (const [idx, count] of POPULATION) {
      for (let i = 0; i < count; i++) this.actors.push(this.spawn({ spec: SPECS[idx] } as Actor));
    }
    audio.play('music5', { channel: 'music', loop: true });
  }

  exit(): void {
    audio.stopAll();
  }

  private spawn(a: Actor): Actor {
    const sheet = getSheet(a.spec.sprite);
    const s = a.spec.speed;
    const w = sheet.frameW;
    const h = sheet.frameH;
    Object.assign(a, { sheet, dying: false, respawnAt: 0, frame: Math.floor(Math.random() * 8), vy: 0 });
    switch (a.spec.kind) {
      case 'fairy':
        a.x = Math.random() * (SCREEN_W - w);
        a.y = SCREENTOP + Math.random() * (SCREEN_H - h - SCREENTOP);
        a.vx = Math.random() * s - s / 2;
        a.vy = Math.random() * s - s / 2;
        break;
      case 'walker':
        a.x = Math.random() * (SCREEN_W - w);
        a.y = SCREEN_H - h;
        a.vx = s;
        break;
      case 'flyer':
        a.x = Math.random() * (SCREEN_W - w);
        a.y = SCREENTOP + Math.random() * (SCREEN_H - h - SCREENTOP);
        a.vx = s;
        break;
      case 'sitter':
        a.x = 0;
        a.y = SCREENTOP + Math.random() * (SCREEN_H - h - SCREENTOP);
        a.vx = 0;
        break;
    }
    return a;
  }

  // Innocents face left on row 1 when moving left (modfairy.bas .flip).
  private row(a: Actor): number {
    return a.spec.rows === 2 && a.vx < 0 ? 1 : 0;
  }

  update(dt: number): void {
    const { input, now } = this.engine;

    for (const key of input.takeKeys()) {
      if (key === 'KeyM') {
        this.musicOn = !this.musicOn;
        audio.setEnabled('music', this.musicOn);
      }
    }

    for (const c of input.takeClicks()) {
      this.shots++;
      audio.play('44mag', { x: c.x });
      // Top-most first: actors are drawn in array order, so test in reverse.
      for (let i = this.actors.length - 1; i >= 0; i--) {
        const a = this.actors[i];
        if (a.dying || a.respawnAt) continue;
        if (a.sheet.hit(c.x - a.x, c.y - a.y, a.frame, this.row(a))) {
          this.hits++;
          a.dying = true;
          a.sheet = getSheet(a.spec.death);
          a.frame = 0;
          audio.play(a.spec.dieSound, { x: c.x });
          break;
        }
      }
    }

    this.frameClock += dt * 1000;
    const advance = this.frameClock >= FRAME_MS;
    if (advance) this.frameClock -= FRAME_MS;

    for (const a of this.actors) {
      if (a.respawnAt) {
        if (now >= a.respawnAt) this.spawn(a);
        continue;
      }
      if (a.spec.kind === 'fairy' && !a.dying && Math.random() < 0.01) {
        a.vx = Math.random() * a.spec.speed - a.spec.speed / 2;
        a.vy = Math.random() * a.spec.speed - a.spec.speed / 2;
      }
      if (a.dying) a.vy += 6000 * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;

      const w = a.sheet.frameW;
      const h = a.sheet.frameH;
      if (a.x + w > SCREEN_W) { a.x = SCREEN_W - w; a.vx = -a.vx; }
      if (a.x < 0) { a.x = 0; a.vx = -a.vx; }
      if (a.y < SCREENTOP) { a.y = SCREENTOP; a.vy = -a.vy; }
      if (a.y + h > SCREEN_H) { a.y = SCREEN_H - h; a.vy = a.dying ? 0 : -a.vy; }

      if (advance) {
        if (a.dying && a.frame === a.sheet.framesX - 1) {
          a.respawnAt = now + 2000;
        } else {
          a.frame = (a.frame + 1) % a.sheet.framesX;
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    getSheet('beach', 'bg').draw(ctx, 0, 0);
    for (const a of this.actors) {
      if (!a.respawnAt) a.sheet.draw(ctx, a.x, a.y, a.frame, this.row(a));
    }
    getSheet('topbar').draw(ctx, 0, 0);

    drawText(ctx, 70, 23, str(this.hits * 25));
    drawText(ctx, 70, 60, str(this.hits));
    drawText(ctx, 700, 30, 'Engine Sandbox');
    drawText(ctx, 0, 0, `${str(this.engine.fps)} FPS`);
    const acc = this.shots ? Math.round((100 * this.hits) / this.shots) : 0;
    drawText(ctx, 8, SCREEN_H - 24, `Click to shoot · M toggles music · shots ${this.shots} · accuracy ${acc}%`, {
      color: '#fff',
      font: 'bold 14px Arial',
    });
  }
}
