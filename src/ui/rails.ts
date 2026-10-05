// Touch rails (new): the bars either side of the 4:3 game on a phone hold big touch
// controls, and take over from the HUD bar (cropped off during play on touch, see
// screen.ts viewTop). Left: pause, level name, time, score, kills, rank (and fullscreen
// where it exists). Right:
// all nine weapons with their ammo, one tap each, instead of cycling through the HUD's
// weapon box. Positioned from screen.ts's layout; plain DOM outside the scaled #ui
// overlay, so they're laid out in real CSS pixels at finger size.

import { hdImageUrl, imageUrl } from '../engine/assets';
import { onLayout, type Rect } from '../engine/screen';
import { PISTOL, WEAPONS } from '../game/weapons';
import { h } from './dom';

export interface RailState {
  level: string;
  time: number;
  score: number;
  kills: number;
  rank: number;
  weapon: number;
  ammo: number[];
  cooldown: number; // 0-1: how much of the current weapon's reload is left
  active: boolean; // false while paused or between levels: controls are dimmed
}

interface Handlers {
  weapon(num: number): void;
  pause(): void;
}

export class Rails {
  private left: HTMLElement;
  private right: HTMLElement;
  private stats: Record<'time' | 'score' | 'kills' | 'rank', HTMLElement>;
  private level: HTMLElement;
  private weapons: Array<{ el: HTMLButtonElement; ammo: HTMLElement }> = [];
  private last: Partial<Record<string, string | number | boolean>> = {};
  private unsubscribe: () => void;

  constructor(handlers: Handlers) {
    const stat = (label: string) => {
      const value = h('b', { text: '0' });
      return [h('div', { class: 'rail-stat' }, [h('span', { text: label }), value]), value] as const;
    };
    const [time, timeValue] = stat('Time');
    const [score, scoreValue] = stat('Score');
    const [kills, killsValue] = stat('Kills');
    const [rank, rankValue] = stat('Rank');
    this.stats = { time: timeValue, score: scoreValue, kills: killsValue, rank: rankValue };
    this.level = h('div', { class: 'rail-level' });

    const pause = h('button', { class: 'rail-pause', text: '❚❚', 'aria-label': 'Pause' });
    onTap(pause, handlers.pause);
    const children: HTMLElement[] = [pause, this.level, time, score, kills, rank];
    if (document.fullscreenEnabled) {
      const full = h('button', { class: 'rail-full', text: '⛶', 'aria-label': 'Fullscreen' });
      onTap(full, () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen().catch(() => {});
      });
      children.push(full);
    }
    this.left = h('div', { class: 'rail rail-left' }, children);

    this.right = h('div', { class: 'rail rail-right' });
    for (const w of WEAPONS) {
      const img = h('img', { alt: '', draggable: 'false' });
      const fallback = imageUrl('sprites', w.icon);
      img.src = hdImageUrl('sprites', w.icon) ?? fallback;
      img.onerror = () => {
        if (img.src !== fallback) img.src = fallback; // HD not available (e.g. offline)
      };
      const ammo = h('span', { class: 'ammo' });
      const el = h('button', { class: 'rail-weapon', 'aria-label': w.name, title: w.name }, [img, h('span', { class: 'num', text: String(w.num) }), ammo]);
      onTap(el, () => handlers.weapon(w.num));
      this.right.appendChild(el);
      this.weapons.push({ el, ammo });
    }

    document.body.append(this.left, this.right);
    document.body.classList.add('has-rails');
    this.unsubscribe = onLayout((l) => {
      if (l.left) place(this.left, l.left);
      if (l.right) {
        place(this.right, l.right);
        // Two columns when the rail is wide enough, otherwise one tall column.
        this.right.classList.toggle('two-col', l.right.w >= 128);
      }
    });
  }

  update(s: RailState): void {
    this.set('time', Math.max(0, s.time), (v) => (this.stats.time.textContent = String(v)));
    this.set('score', s.score, (v) => (this.stats.score.textContent = String(v)));
    this.set('kills', s.kills, (v) => (this.stats.kills.textContent = String(v)));
    this.set('rank', s.rank, (v) => (this.stats.rank.textContent = String(v)));
    this.set('level', s.level, (v) => (this.level.textContent = v));
    this.set('active', s.active, (v) => {
      this.left.classList.toggle('inactive', !v);
      this.right.classList.toggle('inactive', !v);
    });
    WEAPONS.forEach((w, i) => {
      const { el, ammo } = this.weapons[i];
      const n = s.ammo[w.num] ?? 0;
      this.set(`ammo${w.num}`, n, () => {
        ammo.textContent = w.num === PISTOL ? '∞' : String(n);
        el.classList.toggle('empty', n <= 0);
      });
      this.set(`sel${w.num}`, s.weapon === w.num, (v) => el.classList.toggle('selected', !!v));
    });
    // Reload sweep on the selected weapon, in 5% steps so it isn't restyled every frame.
    const cd = Math.ceil(s.cooldown * 20) / 20;
    this.set('cooldown', `${s.weapon}:${cd}`, () => {
      this.weapons.forEach(({ el }, i) => el.style.setProperty('--cd', i + 1 === s.weapon ? String(cd) : '0'));
    });
  }

  destroy(): void {
    this.unsubscribe();
    this.left.remove();
    this.right.remove();
    document.body.classList.remove('has-rails');
  }

  private set<T extends string | number | boolean>(key: string, value: T, apply: (v: T) => void): void {
    if (this.last[key] === value) return;
    this.last[key] = value;
    apply(value);
  }
}

function place(el: HTMLElement, r: Rect): void {
  Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
}

// Acts on touch-down rather than click, so a weapon swap mid-fight is instant.
function onTap(el: HTMLElement, fn: () => void): void {
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    fn();
  });
  // Keyboard users (and screen readers) still get the button's click.
  el.addEventListener('click', (e) => {
    if (e.detail === 0) fn();
  });
}
