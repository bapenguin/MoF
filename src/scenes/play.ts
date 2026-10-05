// The game itself: modfairy.bas gameloop / SetupLevel / ScoreAndWait /
// iwonthisstupidgame / the end-of-game screens, as one scene with phases.

import type { Engine, Scene } from '../engine/engine';
import { audio } from '../engine/audio';
import { getSheet } from '../engine/sprites';
import { drawText, str } from '../engine/text';
import { SCREEN_W, SCREEN_H } from '../engine/screen';
import type { ScenarioDef } from '../game/data';
import { GameMode, SCREENTOP, Session, World } from '../game/world';
import { WEAPONS, isRapid } from '../game/weapons';
import { saveProfile, type Profile } from '../game/profiles';
import { h } from '../ui/dom';

// The HUD bar's weapon box: tapping it switches weapon (keys 1-9 do too).
const WEAPON_BOX = { left: 360, right: 460 };

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
  private loopSounds: string[] = [];
  // Game clock in ms. Unlike engine.now it stops while paused, so the level
  // timer, waits and weapon cooldowns all freeze.
  private time = 0;
  private paused = false;
  private onVisibility = () => {
    if (document.hidden && this.phase === 'play') this.pause();
  };
  // What has already been added to the profile, so each commit adds only the difference.
  private committed = { score: 0, weaponShots: [] as number[], kills: {} as Record<string, number> };

  constructor(
    private scenario: ScenarioDef,
    mode: GameMode,
    private profile: Profile | null,
    private onExit: (result: GameResult) => void,
  ) {
    this.session = new Session(scenario, mode);
    this.committed.weaponShots = [...this.session.weaponShots];
  }

  enter(engine: Engine): void {
    this.engine = engine;
    if (import.meta.env.DEV) (window as unknown as { __play: PlayScene }).__play = this;
    document.addEventListener('visibilitychange', this.onVisibility);
    this.startLevel(this.scenario.start);
    this.session.switchWeapon(1);
  }

  exit(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.paused) audio.release();
    audio.stopAll();
  }

  // Esc / P, the HUD bar, or switching tabs. Sound pauses and the clock stops.
  private pause(): void {
    if (this.paused || this.phase !== 'play') return;
    this.paused = true;
    this.engine.input.down = false;
    audio.hold();
    const hint = (text: string) => h('div', { text, style: { font: '14px Arial', color: '#cfc', marginTop: '6px' } });
    this.engine.overlay.replaceChildren(
      h('div', { at: [0, 0, SCREEN_W, SCREEN_H], style: { background: 'rgba(0,0,0,0.55)' } }, [
        h('div', {
          class: 'panel',
          at: [337, 250, 350, 230],
          style: { background: 'rgb(0,64,0)', border: '2px outset #4a4', boxSizing: 'border-box', textAlign: 'center', padding: '16px' },
        }, [
          h('div', { text: 'PAUSED', style: { font: 'bold 40px Arial', color: '#0f0', marginBottom: '6px' } }),
          hint('Esc or P to carry on · Q to quit'),
          hint('Tap the weapon box to switch weapons'),
          hint('Tap the top bar to pause'),
          h('button', { text: 'Resume', at: [40, 172, 120, 30], onClick: () => this.resume() }),
          h('button', { text: 'Quit game', at: [186, 172, 120, 30], onClick: () => this.quitFromPause() }),
        ]),
      ]),
    );
  }

  private resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.engine.overlay.replaceChildren();
    this.engine.input.takeClicks(); // the click that resumed isn't a shot
    audio.release();
  }

  private quitFromPause(): void {
    this.resume();
    this.endGame(false);
  }

  // SetupLevel
  private startLevel(id: string): void {
    const level = this.scenario.levels[id];
    if (!level) throw new Error(`level ${id} not found in ${this.scenario.id}`);
    audio.stopAll();
    this.world = new World(this.session, level, this.time);
    this.music = level.music;
    audio.play(level.music, { channel: 'music', loop: true });
    // Background loops: rain with rainy weather, and the original special-cased
    // the beach with a looping ocean.
    this.loopSounds = [];
    if (this.world.weather?.kind === 'rain') this.loopSounds.push('rain');
    if (level.bg === 'beach') this.loopSounds.push('ocean');
    for (const key of this.loopSounds) audio.play(key, { channel: 'ambient', loop: true });
    this.levelStart = this.time;
    this.timeLeft = level.timeLimit;
    this.setPhase('play');
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseStart = this.time;
  }

  private get level() {
    return this.world.level;
  }

  update(dt: number): void {
    const { input } = this.engine;
    const clicks = input.takeClicks();
    const keys = input.takeKeys();

    if (this.paused) {
      for (const key of keys) {
        if (key === 'Escape' || key === 'KeyP') this.resume();
        else if (key === 'KeyQ') this.quitFromPause();
      }
      return;
    }

    this.time += dt * 1000;
    const now = this.time;

    if (this.phase !== 'play') {
      this.updateWaiting(clicks.length > 0);
      return;
    }

    for (const key of keys) {
      const digit = /^Digit([1-9])$/.exec(key);
      if (digit) this.session.switchWeapon(Number(digit[1]));
      else if (key === 'KeyQ') return this.endGame(false);
      else if (key === 'F1') this.cheat();
      else if (key === 'Escape' || key === 'KeyP') return this.pause();
    }

    // Fairies never go above the HUD bar, so taps there are controls rather
    // than shots: the weapon box cycles weapons, anywhere else pauses.
    // (Lets touch players do without a keyboard.)
    for (const c of clicks) {
      if (c.y >= SCREENTOP) continue;
      if (c.x >= WEAPON_BOX.left && c.x < WEAPON_BOX.right) this.session.nextWeapon();
      else return this.pause();
    }

    // One shot per update, like the original: the latest click, or the cursor
    // position while the trigger is held on a rapid-fire weapon.
    let shot = clicks.filter((c) => c.y >= SCREENTOP).at(-1);
    if (input.down && input.y >= SCREENTOP && isRapid(this.session.weaponDef)) shot = { x: input.x, y: input.y };
    if (shot) this.world.shoot(shot.x, shot.y);

    this.world.update(dt, now);

    this.timeLeft = Math.round(this.level.timeLimit - (now - this.levelStart) / 1000);
    if (this.timeLeft <= 0) return this.endGame(false);
    if (this.world.cleared) {
      this.recordLevel(true);
      this.session.displayScore = this.session.score;
      audio.stop(this.music);
      this.loopSounds.forEach((key) => audio.stop(key));
      audio.play('win');
      this.setPhase('summary');
    }
  }

  // F1: every weapon gets 1000 ammo (the original's built-in cheat).
  private cheat(): void {
    for (const w of WEAPONS) this.session.ammo[w.num] = 1000;
  }

  // userstats + writeguy: fold this level into the player's profile. Like the
  // original, Massacre games only count towards weapon/fairy/streak stats.
  // (The original added the whole game's running score after every level,
  // double counting; here only the new points are added.)
  private recordLevel(cleared: boolean): void {
    const p = this.profile;
    if (!p) return;
    const s = this.session;
    if (s.mode === GameMode.Adventure) {
      p.score += s.score - this.committed.score;
      p.shots += this.world.shots;
      p.hits += this.world.hits;
      p.levelsPlayed++;
      if (cleared) p.levelsCompleted++;
    }
    this.committed.score = s.score;
    s.weaponShots.forEach((n, i) => {
      p.weaponShots[i] = (p.weaponShots[i] ?? 0) + n - (this.committed.weaponShots[i] ?? 0);
    });
    this.committed.weaponShots = [...s.weaponShots];
    for (const [name, n] of Object.entries(s.kills)) {
      p.kills[name] = (p.kills[name] ?? 0) + n - (this.committed.kills[name] ?? 0);
    }
    this.committed.kills = { ...s.kills };
    p.longStreak = Math.max(p.longStreak, s.longStreak);
    saveProfile(p);
  }

  // Out of time, or quit (won = false), or the last level cleared (won = true).
  private endGame(won: boolean): void {
    if (won) {
      // Beating a scenario unlocks the next one on the scenario select screen.
      if (this.profile && this.profile.scenario < this.scenario.worth) {
        this.profile.scenario = this.scenario.worth;
        saveProfile(this.profile);
      }
    } else {
      this.recordLevel(false);
    }
    audio.stopAll();
    this.session.displayScore = this.session.score;
    if (this.session.mode === GameMode.Adventure && !won) audio.play('die');
    this.setPhase(won ? 'victory' : 'gameover');
  }

  // waitforclick(delay, seconds): ignore clicks for `delay` seconds, then
  // continue on a click, or automatically after `seconds` (0 = never).
  private updateWaiting(clicked: boolean): void {
    const elapsed = (this.time - this.phaseStart) / 1000;
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
    this.world.render(ctx, this.time);

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
