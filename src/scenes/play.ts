// The game itself: modfairy.bas gameloop / SetupLevel / ScoreAndWait /
// iwonthisstupidgame / the end-of-game screens, as one scene with phases.

import type { Engine, Scene } from '../engine/engine';
import { audio } from '../engine/audio';
import { getSheet } from '../engine/sprites';
import { drawText, str } from '../engine/text';
import { SCREEN_W, SCREEN_H } from '../engine/screen';
import type { ScenarioDef } from '../game/data';
import { GameMode, Session, World } from '../game/world';
import { WEAPONS, isRapid } from '../game/weapons';

type Phase = 'play' | 'summary' | 'victory' | 'gameover';

export interface GameResult {
  scenario: ScenarioDef;
  session: Session;
  won: boolean;
}

export class PlayScene implements Scene {
  private engine!: Engine;
  private session: Session;
  private world!: World;
  private phase: Phase = 'play';
  private phaseStart = 0;
  private levelStart = 0;
  private timeLeft = 0;
  private music?: string;
  private loopSound?: string;

  constructor(
    private scenario: ScenarioDef,
    mode: GameMode,
    private onExit: (result: GameResult) => void,
  ) {
    this.session = new Session(scenario, mode);
  }

  enter(engine: Engine): void {
    this.engine = engine;
    if (import.meta.env.DEV) (window as unknown as { __play: PlayScene }).__play = this;
    this.startLevel(this.scenario.start);
    this.session.switchWeapon(1);
  }

  exit(): void {
    audio.stopAll();
  }

  // SetupLevel
  private startLevel(id: string): void {
    const level = this.scenario.levels[id];
    if (!level) throw new Error(`level ${id} not found in ${this.scenario.id}`);
    audio.stopAll();
    this.world = new World(this.session, level, this.engine.now);
    this.music = level.music;
    audio.play(level.music, { channel: 'music', loop: true });
    // The original special-cased the beach with a looping ocean.
    this.loopSound = level.bg === 'beach' ? 'ocean' : undefined;
    audio.play(this.loopSound, { channel: 'ambient', loop: true });
    this.levelStart = this.engine.now;
    this.timeLeft = level.timeLimit;
    this.setPhase('play');
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseStart = this.engine.now;
  }

  private get level() {
    return this.world.level;
  }

  update(dt: number): void {
    const { input, now } = this.engine;
    const clicks = input.takeClicks();
    const keys = input.takeKeys();

    if (this.phase !== 'play') {
      this.updateWaiting(clicks.length > 0);
      return;
    }

    for (const key of keys) {
      const digit = /^Digit([1-9])$/.exec(key);
      if (digit) this.session.switchWeapon(Number(digit[1]));
      else if (key === 'KeyQ') return this.endGame(false);
      else if (key === 'F1') this.cheat();
    }

    // One shot per update, like the original: the latest click, or the cursor
    // position while the trigger is held on a rapid-fire weapon.
    let shot = clicks.at(-1);
    if (input.down && isRapid(this.session.weaponDef)) shot = { x: input.x, y: input.y };
    if (shot) this.world.shoot(shot.x, shot.y);

    this.world.update(dt, now);

    this.timeLeft = Math.round(this.level.timeLimit - (now - this.levelStart) / 1000);
    if (this.timeLeft <= 0) return this.endGame(false);
    if (this.world.cleared) {
      this.session.displayScore = this.session.score;
      audio.stop(this.music);
      audio.stop(this.loopSound);
      audio.play('win');
      this.setPhase('summary');
    }
  }

  // F1: every weapon gets 1000 ammo (the original's built-in cheat).
  private cheat(): void {
    for (const w of WEAPONS) this.session.ammo[w.num] = 1000;
  }

  // Out of time, or quit: the end-of-game screen.
  private endGame(won: boolean): void {
    audio.stopAll();
    this.session.displayScore = this.session.score;
    if (this.session.mode === GameMode.Adventure && !won) audio.play('die');
    this.setPhase(won ? 'victory' : 'gameover');
  }

  // waitforclick(delay, seconds): ignore clicks for `delay` seconds, then
  // continue on a click, or automatically after `seconds` (0 = never).
  private updateWaiting(clicked: boolean): void {
    const elapsed = (this.engine.now - this.phaseStart) / 1000;
    const [delay, timeout] = this.phase === 'victory' ? [3, 0] : this.phase === 'summary' ? [5, 0] : [5, 15];
    if (elapsed < delay) return;
    if (!clicked && !(timeout && elapsed >= timeout)) return;

    if (this.phase === 'summary') {
      audio.stop('win');
      if (this.level.next === 'end') this.endGame(true);
      else this.startLevel(this.level.next);
    } else {
      audio.stopAll();
      this.onExit({ scenario: this.scenario, session: this.session, won: this.phase === 'victory' });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.session;
    this.world.render(ctx, this.engine.now);

    // HUD, at the original DoText positions.
    drawText(ctx, 300, 60, str(Math.max(0, this.timeLeft)));
    drawText(ctx, 70, 60, str(s.hits));
    drawText(ctx, 70, 23, str(s.displayScore));
    drawText(ctx, 700, 30, this.level.name);
    drawText(ctx, 696, 58, str(Math.floor(s.rank)));
    drawText(ctx, 565, 58, str(s.ammo[s.weapon]));
    getSheet(s.weaponDef.icon).draw(ctx, 380, 30);
    if (import.meta.env.DEV) drawText(ctx, 0, 0, `${str(this.engine.fps)} FPS`);

    if (this.phase === 'summary') this.renderSummary(ctx);
    else if (this.phase === 'victory') this.centered(ctx, 'win2');
    else if (this.phase === 'gameover') this.centered(ctx, s.mode === GameMode.Adventure ? 'endgame' : 'win');
  }

  // putstuffonthatstatssheet: the round stats card.
  private renderSummary(ctx: CanvasRenderingContext2D): void {
    const w = this.world;
    getSheet('roundinfo').draw(ctx, 373, 220);
    drawText(ctx, 477, 296, str(w.kills));
    drawText(ctx, 477, 329, str(this.level.timeLimit - this.timeLeft));
    drawText(ctx, 477, 359, str(w.shots));
    if (w.shots > 0) drawText(ctx, 477, 390, `${str(Math.floor((100 * w.hits) / w.shots))}%`);
    // The original printed the next level's internal id here; show its name instead.
    const next = this.scenario.levels[this.level.next]?.name ?? 'The End!';
    drawText(ctx, 403, 490, next, { font: 'bold 13px "MS Sans Serif", Tahoma, Arial, sans-serif' });
  }

  private centered(ctx: CanvasRenderingContext2D, key: string): void {
    const sheet = getSheet(key);
    sheet.draw(ctx, (SCREEN_W - sheet.frameW) / 2, (SCREEN_H - sheet.frameH) / 2);
  }
}
