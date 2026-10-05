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
import { recordStars, saveProfile, type Profile } from '../game/profiles';
import { DIFFICULTY, type Difficulty } from '../game/settings';
import { h } from '../ui/dom';
import { drawVictoryCard } from '../game/victory';

// The HUD bar's weapon box: tapping it switches weapon (keys 1-9 do too).
const WEAPON_BOX = { left: 360, right: 460 };
const WEAPON_ICON = { x: 380, y: 30, size: 50 };
const COOLDOWN_MIN_MS = 300; // weapons slower than this get the cooldown sweep

// Star rating (new): one for clearing the level, one for accuracy, one for
// leaving the innocents alone.
const STAR_ACCURACY = 70;

type Phase = 'play' | 'summary' | 'victory' | 'gameover';

export interface GameResult {
  scenario: ScenarioDef;
  session: Session;
  won: boolean;
}

export interface PlayOptions {
  startLevel?: string; // level select: start part-way through a scenario
  difficulty?: Difficulty;
}

interface Rating {
  stars: number;
  accuracy: number;
  innocents: number;
  newBest: boolean;
}

export class PlayScene implements Scene {
  private engine!: Engine;
  private session: Session;
  private world!: World;
  private phase: Phase = 'play';
  private phaseStart = 0;
  private levelStart = 0;
  private timeLimit = 0;
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
  // Session state at the start of the current level, for "Try again".
  private levelSnapshot!: ReturnType<Session['snapshot']>;
  private rating: Rating | null = null;
  private lastTier = 1;
  private tierShownAt = -Infinity;

  constructor(
    private scenario: ScenarioDef,
    mode: GameMode,
    private profile: Profile | null,
    private onExit: (result: GameResult) => void,
    private options: PlayOptions = {},
  ) {
    const difficulty = mode === GameMode.Adventure ? (options.difficulty ?? 'normal') : 'normal';
    this.session = new Session(scenario, mode, difficulty);
    this.committed.weaponShots = [...this.session.weaponShots];
  }

  enter(engine: Engine): void {
    this.engine = engine;
    if (import.meta.env.DEV) (window as unknown as { __play: PlayScene }).__play = this;
    document.addEventListener('visibilitychange', this.onVisibility);
    const start = this.options.startLevel && this.scenario.levels[this.options.startLevel] ? this.options.startLevel : this.scenario.start;
    this.startLevel(start);
    this.session.switchWeapon(1);
  }

  exit(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.paused) audio.release();
    audio.stopAll();
  }

  // ---- pause ----

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

  // ---- levels ----

  // SetupLevel
  private startLevel(id: string): void {
    const level = this.scenario.levels[id];
    if (!level) throw new Error(`level ${id} not found in ${this.scenario.id}`);
    audio.stopAll();
    this.engine.overlay.replaceChildren();
    this.levelSnapshot = this.session.snapshot();
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
    this.timeLimit = Math.round(level.timeLimit * DIFFICULTY[this.session.difficulty].time);
    this.timeLeft = this.timeLimit;
    this.rating = null;
    this.lastTier = 1;
    this.setPhase('play');
  }

  // "Try again" after a game over: replay this level with the ammo and score
  // you had when it started.
  private retryLevel(): void {
    this.session.restore(this.levelSnapshot);
    this.committed.score = this.session.score; // the failed attempt is already in the profile
    this.startLevel(this.level.id);
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseStart = this.time;
  }

  private get level() {
    return this.world.level;
  }

  // ---- update ----

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
      this.updateWaiting(clicks.length > 0, keys);
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

    const tier = this.session.multiplier;
    if (tier > this.lastTier) this.tierShownAt = now;
    this.lastTier = tier;

    this.timeLeft = Math.round(this.timeLimit - (now - this.levelStart) / 1000);
    if (this.timeLeft <= 0) return this.endGame(false);
    if (this.world.cleared) {
      this.recordLevel(true);
      this.rating = this.rateLevel();
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

  private rateLevel(): Rating {
    const w = this.world;
    const accuracy = w.gunShots ? Math.round((100 * w.gunHits) / w.gunShots) : 100;
    const stars = 1 + (accuracy >= STAR_ACCURACY ? 1 : 0) + (w.innocentsHit === 0 ? 1 : 0);
    let newBest = false;
    if (this.profile && this.session.mode === GameMode.Adventure) {
      newBest = recordStars(this.profile, this.scenario.id, this.level.id, stars);
      if (newBest) saveProfile(this.profile);
    }
    return { stars, accuracy, innocents: w.innocentsHit, newBest };
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

  // waitforclick(delay): ignore clicks for `delay` seconds, then continue on a
  // click. A game over offers Try again / Quit buttons instead of the
  // original's "click to go back to the menu".
  private updateWaiting(clicked: boolean, keys: string[]): void {
    const elapsed = (this.time - this.phaseStart) / 1000;
    const delay = this.phase === 'victory' ? 3 : this.phase === 'summary' ? 5 : 2;
    if (elapsed < delay) return;

    if (this.phase === 'gameover') {
      if (!this.engine.overlay.childElementCount) this.showGameOverButtons();
      if (keys.includes('Enter') || keys.includes('KeyR')) this.retryLevel();
      return;
    }
    if (!clicked) return;
    if (this.phase === 'summary') {
      audio.stop('win');
      if (this.level.next === 'end') this.endGame(true);
      else this.startLevel(this.level.next);
    } else {
      this.exitGame(true);
    }
  }

  private showGameOverButtons(): void {
    const massacre = this.session.mode === GameMode.Massacre;
    this.engine.overlay.replaceChildren(
      h('div', { at: [0, 0, SCREEN_W, SCREEN_H], style: { pointerEvents: 'none' } }, [
        h('button', {
          text: massacre ? 'Play again' : 'Try again (R)',
          at: [SCREEN_W / 2 - 170, 548, 160, 36],
          style: { font: 'bold 15px Tahoma, Arial, sans-serif', pointerEvents: 'auto' },
          onClick: () => this.retryLevel(),
        }),
        h('button', {
          text: massacre ? 'Back to setup' : 'Quit to menu',
          at: [SCREEN_W / 2 + 10, 548, 160, 36],
          style: { font: 'bold 15px Tahoma, Arial, sans-serif', pointerEvents: 'auto' },
          onClick: () => this.exitGame(false),
        }),
      ]),
    );
  }

  private exitGame(won: boolean): void {
    audio.stopAll();
    this.engine.overlay.replaceChildren();
    this.onExit({ scenario: this.scenario, session: this.session, won });
  }

  // ---- drawing ----

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    const s = this.session;
    const playing = this.phase === 'play' && !this.paused;
    this.world.render(ctx, this.time, playing ? alpha : 1);

    // HUD, at the original DoText positions.
    drawText(ctx, 300, 60, str(Math.max(0, this.timeLeft)));
    drawText(ctx, 70, 60, str(s.fairyKills));
    drawText(ctx, 70, 23, str(s.displayScore));
    drawText(ctx, 700, 30, this.level.name);
    drawText(ctx, 696, 58, str(Math.floor(s.rank)));
    drawText(ctx, 565, 58, str(s.ammo[s.weapon]));
    getSheet(s.weaponDef.icon).draw(ctx, WEAPON_ICON.x, WEAPON_ICON.y);
    this.renderCooldown(ctx);
    if (import.meta.env.DEV) drawText(ctx, 0, 0, `${str(this.engine.fps)} FPS`);

    if (this.phase === 'play') {
      this.renderStreak(ctx);
      this.renderBossBar(ctx);
      this.renderHitMark(ctx);
    }

    if (this.phase === 'summary') this.renderSummary(ctx);
    else if (this.phase === 'victory') drawVictoryCard(ctx, this.scenario, (SCREEN_W - 400) / 2, (SCREEN_H - 400) / 2);
    else if (this.phase === 'gameover') this.centered(ctx, s.mode === GameMode.Adventure ? 'endgame' : 'win');
  }

  // A dark sweep over the weapon icon while a slow weapon reloads, or while
  // its bus / ion beam / piano is still out.
  private renderCooldown(ctx: CanvasRenderingContext2D): void {
    const s = this.session;
    const w = s.weaponDef;
    let left = 0;
    if (this.world.specialBusy(w.type)) left = 1;
    else if (w.delay >= COOLDOWN_MIN_MS) left = Math.max(0, 1 - (this.time - s.lastShot[w.num]) / w.delay);
    if (s.ammo[w.num] <= 0) left = 1;
    if (left <= 0) return;
    const { x, y, size } = WEAPON_ICON;
    ctx.save();
    ctx.beginPath(); // clip the sweep to the icon box
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size / 2);
    ctx.arc(x + size / 2, y + size / 2, size * 0.75, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Streak counter and multiplier, just under the HUD bar (new).
  private renderStreak(ctx: CanvasRenderingContext2D): void {
    const s = this.session;
    if (s.streak < 3) return;
    const mult = s.multiplier;
    const shadow = { color: '#000', font: 'bold 16px Arial' };
    const text = `Streak ${s.streak}`;
    drawText(ctx, 11, SCREENTOP + 7, text, shadow);
    drawText(ctx, 10, SCREENTOP + 6, text, { color: '#fff', font: 'bold 16px Arial' });
    if (mult > 1) {
      const m = `×${mult}`;
      drawText(ctx, 111, SCREENTOP + 5, m, { color: '#000', font: 'bold 20px Arial' });
      drawText(ctx, 110, SCREENTOP + 4, m, { color: 'rgb(240,242,86)', font: 'bold 20px Arial' });
    }
    // A big "COMBO ×2" when you reach a new tier, fading out.
    const age = this.time - this.tierShownAt;
    if (age < 900 && mult > 1) {
      ctx.save();
      ctx.globalAlpha = 1 - age / 900;
      const size = 44 + age / 30;
      drawText(ctx, SCREEN_W / 2 + 2, 172, `COMBO ×${mult}`, { color: '#000', font: `bold ${size}px Arial`, align: 'center' });
      drawText(ctx, SCREEN_W / 2, 170, `COMBO ×${mult}`, { color: 'rgb(240,242,86)', font: `bold ${size}px Arial`, align: 'center' });
      ctx.restore();
    }
  }

  // Boss health bar (new): centred under the HUD bar.
  private renderBossBar(ctx: CanvasRenderingContext2D): void {
    const boss = this.world.boss;
    if (!boss) return;
    const w = 420;
    const x = (SCREEN_W - w) / 2;
    const y = SCREENTOP + 26;
    drawText(ctx, SCREEN_W / 2 + 1, SCREENTOP + 6, boss.name, { color: '#000', font: 'bold 16px Arial', align: 'center' });
    drawText(ctx, SCREEN_W / 2, SCREENTOP + 5, boss.name, { color: '#fdd', font: 'bold 16px Arial', align: 'center' });
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 2, y - 2, w + 4, 14);
    ctx.fillStyle = '#b00';
    ctx.fillRect(x, y, w * (boss.hp / boss.maxHp), 10);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, w * (boss.hp / boss.maxHp), 3);
  }

  // A quick X where a shot connected (new).
  private renderHitMark(ctx: CanvasRenderingContext2D): void {
    const m = this.world.lastHitMark;
    if (!m) return;
    const age = this.time - m.at;
    if (age > 160) return;
    const r = 7 + age / 40;
    ctx.save();
    ctx.globalAlpha = 1 - age / 160;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [dx, dy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      ctx.moveTo(m.x + dx * (r - 4), m.y + dy * (r - 4));
      ctx.lineTo(m.x + dx * r, m.y + dy * r);
    }
    ctx.stroke();
    ctx.restore();
  }

  // putstuffonthatstatssheet: the round stats card, plus the star rating.
  private renderSummary(ctx: CanvasRenderingContext2D): void {
    const w = this.world;
    getSheet('roundinfo').draw(ctx, 373, 220);
    drawText(ctx, 477, 296, str(w.kills));
    drawText(ctx, 477, 329, str(this.timeLimit - this.timeLeft));
    drawText(ctx, 477, 359, str(w.shots));
    if (w.shots > 0) drawText(ctx, 477, 390, `${str(Math.floor((100 * w.hits) / w.shots))}%`);
    // The original printed the next level's internal id here; show its name instead.
    const next = this.scenario.levels[this.level.next]?.name ?? 'The End!';
    drawText(ctx, 403, 490, next, { font: 'bold 13px "MS Sans Serif", Tahoma, Arial, sans-serif' });
    if (this.rating && this.session.mode === GameMode.Adventure) this.renderStars(ctx, this.rating);
  }

  private renderStars(ctx: CanvasRenderingContext2D, r: Rating): void {
    const cx = 373 + 278 / 2;
    const y = 572;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(cx - 160, y - 30, 320, 112);
    for (let i = 0; i < 3; i++) drawStar(ctx, cx + (i - 1) * 54, y, 22, i < r.stars);
    const font = '13px Arial';
    const line = (text: string, ok: boolean, row: number) =>
      drawText(ctx, cx, y + 30 + row * 16, `${ok ? '✔' : '✘'} ${text}`, { color: ok ? '#9f9' : '#f99', font, align: 'center' });
    line('Level cleared', true, 0);
    line(`Accuracy ${r.accuracy}% (needs ${STAR_ACCURACY}%)`, r.accuracy >= STAR_ACCURACY, 1);
    line(r.innocents ? 'Innocents were harmed' : 'No innocents harmed', r.innocents === 0, 2);
    if (r.newBest) drawText(ctx, cx + 150, y - 26, 'New best!', { color: 'rgb(240,242,86)', font: 'bold 13px Arial', align: 'right' });
  }

  private centered(ctx: CanvasRenderingContext2D, key: string): void {
    const sheet = getSheet(key);
    sheet.draw(ctx, (SCREEN_W - sheet.frameW) / 2, (SCREEN_H - sheet.frameH) / 2);
  }
}

export function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, filled: boolean): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? 'rgb(255,204,0)' : 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = filled ? 'rgb(140,90,0)' : 'rgba(255,255,255,0.35)';
  ctx.stroke();
}
