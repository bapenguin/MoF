// Gameplay simulation for one level: a port of modfairy.bas (InitFairies,
// UpdateFairies, Shot, KillFairy, splats, gifts, score popups, DrawFairies).
//
// Original per-loop behaviour (velocity damping, gore physics, "intel" turning)
// assumed the loop ran at the display refresh rate (DirectDraw flip waits for
// vsync), so it's applied once per fixed 60 Hz step here.

import { audio } from '../engine/audio';
import { getSheet, type SpriteSheet } from '../engine/sprites';
import { SCREEN_W, SCREEN_H } from '../engine/screen';
import { FairyClass, spriteRows, type FairyDef, type LevelDef, type ScenarioDef } from './data';
import { GIFTS, PISTOL, WEAPONS, WeaponType, isBlast, type WeaponDef } from './weapons';
import { Weather } from './weather';
import { settings } from './settings';

export const SCREENTOP = 83; // height of the top HUD bar
const SPRITE_SIZE = 75; // fmod.bas SpriteSize, used for spawn placement
const G = 100; // per-update downward boost for dying fairies
const GORE_GRAVITY = 15;
const GIFT_SPEED = 60; // px/s
const FRAME_MS = 35; // sprite animation interval
const MAX_SPLATS = 300;
const MAX_SCORES = 15;
const MAX_GIFTS = 5;
const MAX_FAIRIES = 201;

export enum GameMode {
  Adventure,
  Massacre, // dead fairies respawn; the level only ends when time runs out
}

enum State {
  Dead,
  Dying,
  Alive,
  Acting, // showing the alternate "act" animation for a second
}

interface Fairy {
  def: FairyDef;
  state: State;
  hp: number;
  x: number;
  y: number;
  mx: number;
  my: number;
  speed: number;
  size: number; // frame height of the normal sprite; the original used it for both axes
  frame: number;
  flip: number;
  sheet: SpriteSheet; // what's drawn now: normal, act or death sprite
  ltime: number;
}

interface Splat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sheet: SpriteSheet;
  frame: number;
  show: boolean;
}

interface ScorePopup {
  x: number;
  y: number;
  sheet: SpriteSheet;
  spawn: number;
  show: boolean;
}

interface Gift {
  x: number;
  y: number;
  type: number;
  sheet: SpriteSheet;
}

// Special weapons (FireMine/FireHole/FireIon/FirePiano/FireBus and their Do*/LookOutFor* routines).
const MAX_MINES = 10; // also the black-hole limit
const MINE_RANGE = 500; // knockback and chain-reaction radius
const MINE_KILL_RANGE = 300;
const BUS_SPEED = 400; // px/s
const HOLE_PULL = 9000;

interface Mine {
  x: number;
  y: number;
  sheet: SpriteSheet;
  frame: number;
  armed: boolean; // false once it's exploding
}

interface Hole {
  x: number;
  y: number;
  sheet: SpriteSheet;
  frame: number; // 0-7, drawn at half speed over 4 sprite frames
  expires: number;
}

interface Piano {
  x: number;
  y: number;
  vy: number; // px per update
  sheet: SpriteSheet;
  frame: number;
  falling: boolean; // false once it has smashed into the ground
}

const SCORE_SPRITES: Record<number, string> = { 25: '25', 50: '50', 100: '100', 200: '200', 500: '500', 1000: '1000' };

// State that carries across levels for one play-through (pstats, ammo, weapon, streak).
export class Session {
  readonly ammo: number[] = new Array(WEAPONS.length + 1).fill(0);
  readonly lastShot: number[] = new Array(WEAPONS.length + 1).fill(-Infinity);
  readonly weaponShots: number[] = new Array(WEAPONS.length + 1).fill(0);
  readonly kills: Record<string, number> = {}; // per fairy name (FWasShot)
  weapon = PISTOL;
  score = 0;
  displayScore = 0; // the rolling counter shown in the HUD (DScore)
  shots = 0;
  hits = 0;
  damage = 0;
  rank = 0;
  streak = 0;
  longStreak = 0;

  constructor(
    readonly scenario: ScenarioDef,
    readonly mode: GameMode,
  ) {
    for (const [num, amount] of Object.entries(scenario.ammo)) this.ammo[Number(num)] = amount;
  }

  get weaponDef(): WeaponDef {
    return WEAPONS[this.weapon - 1];
  }

  // switchgun: only weapons with ammo can be selected.
  switchWeapon(num: number): void {
    const w = WEAPONS[num - 1];
    if (!w || this.ammo[num] <= 0) return;
    this.weapon = num;
    audio.play('switch');
  }

  // Next weapon (wrapping round) that has ammo: the touch-friendly way to switch.
  nextWeapon(): void {
    const count = WEAPONS.length;
    for (let i = 1; i <= count; i++) {
      const num = ((this.weapon - 1 + i) % count) + 1;
      if (this.ammo[num] > 0) {
        if (num !== this.weapon) this.switchWeapon(num);
        return;
      }
    }
  }

  // Rolls the displayed score towards the real one (DrawFairies DScore logic).
  tickDisplayScore(): void {
    const diff = Math.abs(this.displayScore - this.score);
    if (diff < 10) this.displayScore = this.score;
    const step = 5 * (Math.floor(diff / 50) + 1);
    if (this.displayScore < this.score) this.displayScore += step;
    if (this.displayScore > this.score) this.displayScore -= step;
  }
}

export class World {
  // Per-level counters for the round summary sheet.
  shots = 0;
  hits = 0;
  kills = 0;

  private fairies: Fairy[] = [];
  private alive = 0; // flive: class-0 fairies still standing
  private splats: Splat[] = [];
  private nextSplat = 0;
  private scores: ScorePopup[] = [];
  private nextScore = 0;
  private gifts: Gift[] = [];
  private mines: Mine[] = [];
  private holes: Hole[] = [];
  private ion: { x: number; frame: number } | null = null;
  private piano: Piano | null = null;
  private bus: { x: number; y: number; frame: number } | null = null;
  private frameClock = 0;
  private bg: SpriteSheet;
  private fg: SpriteSheet | null;
  private topbar: SpriteSheet;
  readonly weather: Weather | null;

  constructor(
    readonly session: Session,
    readonly level: LevelDef,
    private now: number,
  ) {
    this.bg = getSheet(level.bg, 'bg');
    this.fg = level.foreground ? getSheet(level.foreground, 'fg') : null;
    this.topbar = getSheet('topbar');
    const kind = level.weather;
    this.weather = settings.weather && (kind === 'rain' || kind === 'snow') ? new Weather(kind) : null;
    this.initFairies(session.scenario);
    const splat = getSheet('splat');
    const gore = getSheet('gore');
    for (let i = 0; i < MAX_SPLATS; i++) {
      this.splats.push({ x: 0, y: 0, vx: 0, vy: 0, sheet: i % 4 === 0 ? splat : gore, frame: 0, show: false });
    }
  }

  // All target fairies dead: the level is cleared (flive = 0).
  get cleared(): boolean {
    return this.session.mode === GameMode.Adventure && this.alive === 0;
  }

  private initFairies(scenario: ScenarioDef): void {
    for (const spawn of this.level.spawns) {
      const def = scenario.fairies[spawn.type];
      if (!def) continue; // e.g. "blue" in fland.txt: the original silently skipped it
      for (let i = 0; i < spawn.count && this.fairies.length < MAX_FAIRIES; i++) {
        this.fairies.push(this.spawnFairy(def));
      }
    }
  }

  private spawnFairy(def: FairyDef): Fairy {
    const sheet = getSheet(def.sprite);
    const size = sheet.frameH;
    const f: Fairy = {
      def,
      state: State.Alive,
      hp: def.hp,
      x: (SCREEN_W - SPRITE_SIZE) * Math.random() + 1,
      y: (SCREEN_H - SPRITE_SIZE - SCREENTOP) * Math.random() + 1 + SCREENTOP,
      mx: 0,
      my: 0,
      speed: def.speed,
      size,
      frame: Math.floor(Math.random() * def.frames),
      flip: 0,
      sheet,
      ltime: this.now,
    };
    switch (def.class) {
      case FairyClass.Fairy:
        this.alive++;
        this.turn(f);
        break;
      case FairyClass.Walker:
        f.mx = f.speed;
        f.y = SCREEN_H - size;
        break;
      case FairyClass.Sitter:
        f.x = 0;
        f.y = Math.random() * (SCREEN_H - size);
        f.speed = 100;
        break;
      case FairyClass.Flyer:
        f.mx = f.speed;
        break;
    }
    return f;
  }

  private turn(f: Fairy): void {
    f.mx = f.speed * Math.random() + 1 - f.speed / 2;
    f.my = f.speed * Math.random() + 1 - f.speed / 2;
  }

  update(dt: number, now: number): void {
    this.now = now;
    this.frameClock += dt * 1000;
    const advance = this.frameClock >= FRAME_MS;
    if (advance) this.frameClock -= FRAME_MS;

    if (this.mines.length) {
      for (const f of this.fairies) if (f.state !== State.Dead) this.checkMines(f);
    }

    for (const f of this.fairies) {
      if (f.state === State.Dead) continue;

      // Knockback decays back towards cruising speed.
      if (Math.abs(f.mx) > f.speed) f.mx *= 0.9;
      if (Math.abs(f.my) > f.speed) f.my *= 0.9;
      if (!(Math.abs(f.mx) > f.speed || Math.abs(f.my) > f.speed)) {
        if (f.state === State.Alive && Math.random() * 100 + 1 < f.def.intel) this.turn(f);
      }

      if (f.state !== State.Dying) {
        if (this.bus) this.checkBus(f);
        if (this.ion) this.checkIon(f);
        if (this.piano) this.checkPiano(f);
        if (this.holes.length) this.checkHoles(f);
      }

      if (f.state === State.Acting) {
        if (now - f.ltime > 1000) {
          f.state = State.Alive;
          f.sheet = getSheet(f.def.sprite);
        }
      } else if (f.state === State.Alive && f.def.actSprite) {
        if (Math.random() * 1000 < (f.def.actChance ?? 0)) {
          f.state = State.Acting;
          f.sheet = getSheet(f.def.actSprite);
          f.frame = 0;
          f.ltime = now;
          // The original had the act sound (asound) commented out, so it stays silent.
        }
      }

      f.x += dt * f.mx;
      f.y += dt * f.my;
      f.flip = f.def.class !== FairyClass.Fairy && f.mx < 0 ? 1 : 0;

      if (f.state === State.Dying) {
        f.my += G;
        if (f.frame === f.def.frames - 1) this.finishDying(f);
      }

      if (advance && f.def.frames) f.frame = (f.frame + 1) % f.def.frames;

      if (f.x + f.size > SCREEN_W) {
        f.x = SCREEN_W - f.size;
        f.mx = -f.mx;
      }
      if (f.x < 0) {
        f.x = 0;
        f.mx = -f.mx;
      }
      if (f.y < SCREENTOP) {
        f.y = SCREENTOP;
        f.my = -f.my;
      }
      if (f.y + f.size > SCREEN_H) {
        f.y = SCREEN_H - f.size;
        f.my = -f.my;
      }
    }

    this.updateSpecials(dt, advance);
    this.weather?.update(dt);
    this.updateSplats(dt);
    for (const g of this.gifts) g.y += dt * GIFT_SPEED;
    this.gifts = this.gifts.filter((g) => g.y + g.sheet.frameH <= SCREEN_H);

    // Ambient sound: a 1-in-300 chance each update.
    if (this.level.ambient && Math.floor(Math.random() * 300) === 0) {
      audio.play(this.level.ambient, { channel: 'ambient' });
    }
    this.session.tickDisplayScore();
  }

  private finishDying(f: Fairy): void {
    if (this.session.mode === GameMode.Adventure) {
      f.state = State.Dead;
      if (f.def.class === FairyClass.Fairy) this.alive--;
    } else {
      // Massacre mode: back from the dead, dropping in from somewhere random.
      f.hp = f.def.hp;
      f.state = State.Alive;
      f.sheet = getSheet(f.def.sprite);
      f.my = Math.random() * 1000 + 500;
      f.x = Math.floor(Math.random() * (SCREEN_W - f.sheet.frameW));
      f.y = Math.floor(Math.random() * (SCREEN_H - f.size));
    }
  }

  // Shot(): one trigger pull at (x, y). Returns false if the gun couldn't fire.
  shoot(x: number, y: number): boolean {
    const s = this.session;
    const w = s.weaponDef;
    if (s.ammo[w.num] <= 0) return false;
    if (this.now - s.lastShot[w.num] < w.delay) return false;
    // Only one bus, ion beam or piano at a time. The original still spent the
    // ammo when you fired another; here the trigger just doesn't respond.
    if ((w.type === WeaponType.Bus && this.bus) || (w.type === WeaponType.Ion && this.ion) || (w.type === WeaponType.Piano && this.piano)) {
      return false;
    }

    s.weaponShots[w.num]++;
    s.shots++;
    this.shots++;
    if (w.num !== PISTOL) s.ammo[w.num]--;
    s.lastShot[w.num] = this.now;

    switch (w.type) {
      case WeaponType.Bus:
        return this.fireBus();
      case WeaponType.Mine:
        return this.fireMine(x, y);
      case WeaponType.Ion:
        return this.fireIon(x);
      case WeaponType.Piano:
        return this.firePiano(x);
      case WeaponType.Hole:
        return this.fireHole(x, y);
    }

    this.checkGiftHit(x, y);
    audio.play(w.sound, { x });

    let hitCount = 0;
    for (const f of this.fairies) {
      if (f.state !== State.Alive && f.state !== State.Acting) continue;
      if (isBlast(w)) {
        const dx = x - (f.x + f.size / 2);
        const dy = y - (f.y + f.size / 2);
        if (Math.hypot(dx, dy) < w.blast!) {
          // Knock the fairy away from the blast; stronger the closer it was.
          f.mx -= (Math.sign(dx) * w.blast! - dx) * 3;
          f.my -= (Math.sign(dy) * w.blast! - dy) * 3;
          hitCount++;
          this.hurt(f, w.power, x);
        }
      } else if (f.sheet.hit(x - f.x, y - f.y, f.frame, this.row(f))) {
        // Pixel-accurate, and like the original it passes through every fairy under the cursor.
        hitCount++;
        this.hurt(f, w.power, x);
      }
    }

    // The original only counted streaks for blast weapons (and reset them after
    // every pistol shot); here any shot that hits extends the streak.
    s.streak = hitCount > 0 ? s.streak + hitCount : 0;
    s.longStreak = Math.max(s.longStreak, s.streak);
    const percent = s.shots ? (s.hits / s.shots) * 100 : 0;
    s.rank = s.damage * percent;
    return true;
  }

  // KillFairy (really "hurt fairy").
  private hurt(f: Fairy, power: number, panX: number): void {
    const s = this.session;
    this.addSplats(f.x + f.sheet.frameW / 2, f.y + f.sheet.frameH / 2, power);
    s.hits++;
    s.damage += power;
    this.hits++;
    f.hp -= power;
    if (f.hp > 0) return;

    f.state = State.Dying;
    f.my += G;
    f.sheet = getSheet(f.def.deathSprite);
    f.frame = 0;
    if (f.def.class === FairyClass.Fairy) this.kills++;
    else audio.play('dumbass', { x: panX });
    s.score += f.def.worth;
    const sounds = f.def.dieSounds;
    if (sounds.length) audio.play(sounds[Math.floor(Math.random() * sounds.length)], { x: panX });
    s.kills[f.def.name] = (s.kills[f.def.name] ?? 0) + 1;
    this.addScore(f.x + f.size, f.y, f.def.worth);
    if (f.def.gift) this.spawnGift(f.def.gift, f.x, f.y);
  }

  // ---- Fairy Mines: proximity mines with a huge blast that chain-reacts ----

  private fireMine(x: number, y: number): boolean {
    if (this.mines.length >= MAX_MINES) return true; // ammo still spent, as in the original
    const sheet = getSheet('fmine');
    const half = sheet.frameH / 2;
    this.mines.push({ x: x - half, y: y - half, sheet, frame: 0, armed: true });
    audio.play('arm', { x });
    return true;
  }

  // The original sized mines by frame height on both axes; kept for identical ranges.
  private mineCenter(m: Mine): [number, number] {
    return [m.x + m.sheet.frameH / 2, m.y + m.sheet.frameH / 2];
  }

  private checkMines(f: Fairy): void {
    for (const m of this.mines) {
      if (!m.armed || f.state !== State.Alive) continue;
      const [mx, my] = this.mineCenter(m);
      const d = Math.hypot(mx - (f.x + f.size / 2), my - (f.y + f.size / 2));
      if (d < (f.size + m.sheet.frameH) / 2) this.blowUpMine(m);
    }
  }

  private blowUpMine(m: Mine): void {
    audio.play('boom', { x: m.x });
    m.armed = false;
    m.frame = 0;
    m.sheet = getSheet('fmined1');
    const [cx, cy] = this.mineCenter(m);
    for (const f of this.fairies) {
      if (f.state === State.Dead) continue;
      const dx = cx - (f.x + f.size / 2);
      const dy = cy - (f.y + f.size / 2);
      const d = Math.hypot(dx, dy);
      if (d >= MINE_RANGE) continue;
      f.mx -= (Math.sign(dx) * MINE_RANGE - dx) * 3;
      f.my -= (Math.sign(dy) * MINE_RANGE - dy) * 3;
      if (f.state === State.Alive && d < MINE_KILL_RANGE) this.hurt(f, 25, m.x);
    }
    for (const other of this.mines) {
      if (!other.armed) continue;
      const [ox, oy] = this.mineCenter(other);
      if (Math.hypot(cx - ox, cy - oy) < MINE_RANGE) this.blowUpMine(other);
    }
  }

  // ---- Black Hole: sucks fairies in and grinds them up for 8-13 seconds ----

  private fireHole(x: number, y: number): boolean {
    if (this.holes.length >= MAX_MINES) return true;
    const sheet = getSheet('bhole');
    this.holes.push({
      x: x - sheet.frameW / 2,
      y: y - sheet.frameH / 2,
      sheet,
      frame: 0,
      expires: this.now + Math.random() * 5000 + 8000,
    });
    return true;
  }

  private checkHoles(f: Fairy): void {
    for (const h of this.holes) {
      if (f.state === State.Dying) return;
      let dx = f.x + f.sheet.frameW / 2 - (h.x + h.sheet.frameW / 2);
      let dy = f.y + f.sheet.frameH / 2 - (h.y + h.sheet.frameH / 2);
      const d = Math.hypot(dx, dy);
      // Pull strength falls off with distance on each axis (LookOutForTheSingularity).
      dx += Math.sign(dx) * d;
      dy += Math.sign(dy) * d;
      if (Math.abs(dx) < 20) dx = Math.sign(dx) * 20;
      if (Math.abs(dy) < 20) dy = Math.sign(dy) * 20;
      if (dx !== 0) f.mx -= HOLE_PULL / dx;
      if (dy !== 0) f.my -= HOLE_PULL / dy;
      if (Math.abs(dx) < 50 && Math.abs(dy) < 50) this.hurt(f, 5, h.x);
    }
  }

  // ---- Ion o' Death: a beam straight down from the top bar ----

  // The original put the beam's left edge at the cursor, so it landed to the
  // right of where you aimed. Centred here (same for the piano).
  private fireIon(x: number): boolean {
    this.ion = { x: x - getSheet('ion').frameW / 2, frame: 0 };
    audio.play('ionzap', { x });
    return true;
  }

  private checkIon(f: Fairy): void {
    const w = getSheet('ion').frameW;
    if (Math.abs(f.x + f.size / 2 - (this.ion!.x + w / 2)) < (f.size + w) / 2) this.hurt(f, 50, this.ion!.x);
  }

  // Beam grows over 9 frames, flickers, then shrinks back (DoIon).
  private ionFrame(frame: number): number {
    if (frame < 9) return frame;
    if (frame < 25) return 7 + (frame % 2);
    if (frame < 33) return 33 - frame;
    return 0;
  }

  // ---- Piano Man: drops a piano from the top of the screen ----

  private firePiano(x: number): boolean {
    const sheet = getSheet('piano');
    this.piano = { x: x - sheet.frameW / 2, y: SCREENTOP - sheet.frameH, vy: 50, sheet, frame: 0, falling: true };
    audio.play('pfall', { x });
    return true;
  }

  private checkPiano(f: Fairy): void {
    const p = this.piano!;
    const { frameW: w, frameH: h } = p.sheet;
    if (Math.abs(f.x + f.size / 2 - (p.x + w / 2)) < w / 2 && Math.abs(f.y + f.size / 2 - (p.y + h / 2)) < h / 2) {
      this.hurt(f, 25, p.x);
      audio.play('pianobang', { x: p.x });
    }
  }

  // ---- Death Bus: drives along the bottom of the screen ----

  private fireBus(): boolean {
    audio.play('bus');
    const sheet = getSheet('busanim');
    this.bus = { x: -sheet.frameW, y: SCREEN_H - sheet.frameH, frame: 0 };
    return true;
  }

  private checkBus(f: Fairy): void {
    const b = this.bus!;
    if (f.y + f.size > b.y && f.x > b.x && f.x - b.x < getSheet('busanim').frameW) {
      f.mx += 450;
      f.my -= 450;
      audio.play('splat', { x: f.x });
      this.hurt(f, 50, f.x);
    }
  }

  // The Do* routines: advance each special weapon one update.
  private updateSpecials(dt: number, advance: boolean): void {
    if (this.bus) {
      this.bus.frame = (this.bus.frame + 1) % 2;
      this.bus.x += BUS_SPEED * dt;
      if (this.bus.x >= SCREEN_W) this.bus = null;
    }

    this.mines = this.mines.filter((m) => {
      if (!m.armed && m.frame === 7) return false;
      m.frame = (m.frame + 1) % 8;
      return true;
    });

    if (this.ion && ++this.ion.frame > 33) this.ion = null;

    const p = this.piano;
    if (p?.falling) {
      p.y += p.vy;
      p.vy += dt * GORE_GRAVITY;
      p.frame = (p.frame + 1) % 2;
      if (p.y + p.sheet.frameH >= SCREEN_H) {
        p.sheet = getSheet('p1d1');
        p.frame = 0;
        p.y = SCREEN_H - p.sheet.frameH;
        p.falling = false;
        this.addSplats(p.x + p.sheet.frameW / 2, SCREEN_H - 10, 35);
      }
    } else if (p && ++p.frame >= 4) {
      audio.play('pianobang', { x: p.x });
      this.piano = null;
    }

    this.holes = this.holes.filter((h) => this.now <= h.expires);
    if (advance) for (const h of this.holes) h.frame = (h.frame + 1) % 8;
  }

  private renderSpecials(ctx: CanvasRenderingContext2D): void {
    if (this.bus) getSheet('busanim').draw(ctx, this.bus.x, this.bus.y, this.bus.frame);
    for (const m of this.mines) m.sheet.draw(ctx, m.x, m.y, m.frame);
    if (this.ion) getSheet('ion').draw(ctx, this.ion.x, SCREENTOP, this.ionFrame(this.ion.frame));
    if (this.piano) this.piano.sheet.draw(ctx, this.piano.x, this.piano.y, this.piano.frame);
    for (const h of this.holes) h.sheet.draw(ctx, h.x, h.y, Math.floor(h.frame / 2));
  }

  // Innocents face left on row 1. Single-row sheets (e.g. act sprites) stay on row 0.
  private row(f: Fairy): number {
    return f.sheet.framesY > 1 ? f.flip : 0;
  }

  private addSplats(x: number, y: number, power: number): void {
    for (let i = 0; i <= power; i++) {
      const s = this.splats[this.nextSplat];
      this.nextSplat = (this.nextSplat + 1) % MAX_SPLATS;
      s.show = true;
      s.x = x;
      s.y = y;
      s.vx = Math.random() * 10 - 5; // px per update
      s.vy = -(Math.random() * 20 + 5);
      s.frame = Math.floor(Math.random() * s.sheet.framesX);
    }
  }

  private updateSplats(dt: number): void {
    for (const s of this.splats) {
      if (!s.show) continue;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += dt * GORE_GRAVITY;
      if (s.y > SCREEN_H) {
        // Bounce once or twice off the bottom, then disappear.
        if (s.vy < 10) s.show = false;
        else s.vy *= -0.3;
      }
    }
  }

  private addScore(x: number, y: number, worth: number): void {
    const key = SCORE_SPRITES[worth] ?? (worth < 0 ? '0' : null);
    if (!key) return; // the original only had popups for these values
    const sheet = getSheet(key);
    const p: ScorePopup = {
      x: Math.min(x, SCREEN_W - sheet.frameW),
      y: Math.min(y, SCREEN_H - sheet.frameH),
      sheet,
      spawn: this.now,
      show: true,
    };
    this.scores[this.nextScore] = p;
    this.nextScore = (this.nextScore + 1) % MAX_SCORES;
  }

  private spawnGift(type: number, x: number, y: number): void {
    const gift = GIFTS[type];
    if (!gift || this.gifts.length >= MAX_GIFTS) return;
    this.gifts.push({ x, y, type, sheet: getSheet(gift.sprite) });
  }

  // Shooting a falling crate collects it. (The original only checked the
  // right/bottom edges, so any click above-left of a crate grabbed it.)
  private checkGiftHit(x: number, y: number): void {
    this.gifts = this.gifts.filter((g) => {
      const hit = x >= g.x && x < g.x + g.sheet.frameW && y >= g.y && y < g.y + g.sheet.frameH;
      if (hit) {
        const gift = GIFTS[g.type];
        this.session.ammo[gift.weapon] += gift.ammo;
        audio.play('yoink', { x: g.x });
      }
      return !hit;
    });
  }

  // DrawFairies, minus the HUD text (drawn by the play scene).
  render(ctx: CanvasRenderingContext2D, now: number): void {
    this.bg.draw(ctx, 0, 0);
    for (const f of this.fairies) {
      if (f.state !== State.Dead) f.sheet.draw(ctx, f.x, f.y, f.frame, this.row(f));
    }
    this.renderSpecials(ctx);
    this.weather?.render(ctx);
    this.fg?.draw(ctx, 0, SCREEN_H - this.fg.frameH);
    this.topbar.draw(ctx, 0, 0);

    for (const p of this.scores) {
      if (!p?.show) continue;
      const age = now - p.spawn;
      const frame = age < 1000 ? 0 : Math.round((age - 1000) / 100);
      if (frame > 7) p.show = false;
      else p.sheet.draw(ctx, p.x, p.y, frame);
    }
    for (const g of this.gifts) g.sheet.draw(ctx, g.x, g.y);
    for (const s of this.splats) if (s.show) s.sheet.draw(ctx, s.x, s.y, s.frame);
  }
}

// Everything a scenario needs loaded before play, with the frame layouts the game uses.
export function scenarioSprites(scenario: ScenarioDef): Array<[key: string, framesX: number, framesY: number]> {
  const list: Array<[string, number, number]> = [];
  for (const f of Object.values(scenario.fairies)) {
    const rows = spriteRows(f);
    list.push([f.sprite, f.frames, rows], [f.deathSprite, f.frames, rows]);
    if (f.actSprite) list.push([f.actSprite, 8, 1]);
  }
  return list;
}
