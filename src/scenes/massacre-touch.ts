// The Massacre builder at finger size (new), for the touch layout. The original form
// packs nine checkboxes, five list boxes and a dozen buttons into 1024x768, which is
// untappable on a phone. Here it's three tabs (Fairies, Weapons, Scene) with cards,
// steppers and picture tiles, and GO always in reach. MassacreScene keeps the rules.

import { getManifest, hdImageUrl, imageUrl } from '../engine/assets';
import { FAIRIES, MAX_AMMO, MAX_FAIRIES, MAX_TIME, blankSetup, type Weather } from '../game/share';
import { WEAPONS } from '../game/weapons';
import { h } from '../ui/dom';
import { ARSENAL, DEFAULT_AMMO, type MassacreScene } from './massacre';

type Tab = 'fairies' | 'weapons' | 'scene';

const FAIRY_STEP = 5;
const AMMO_STEP = 10;
const TIME_STEP = 10;
const TIME_PRESETS = [30, 60, 120, 300];

export class TouchMassacre {
  private root: HTMLElement;
  private tab: Tab = 'fairies';

  constructor(private scene: MassacreScene) {
    const forest = `linear-gradient(rgba(0, 18, 0, 0.6), rgba(0, 8, 0, 0.85)), url("${imageUrl('ui', 'massacre-bg')}")`;
    this.root = h('div', { class: 'tm', style: { backgroundImage: forest } });
    document.body.appendChild(this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  // Rebuilt after every change; the scroll position of the open tab is kept.
  render(): void {
    const scroll = this.root.querySelector('.tm-body')?.scrollTop ?? 0;
    const tilesScroll = this.root.querySelector('.mm-tiles')?.scrollLeft ?? 0;
    const s = this.scene;
    const total = s.totalFairies;
    const tabs = h(
      'div',
      { class: 'tm-seg mm-tabs' },
      ([
        ['fairies', `Fairies (${total})`],
        ['weapons', 'Weapons'],
        ['scene', 'Scene'],
      ] as Array<[Tab, string]>).map(([tab, text]) =>
        h('button', {
          class: this.tab === tab ? 'on' : '',
          text,
          onClick: () => {
            this.tab = tab;
            this.render();
            this.root.querySelector('.tm-body')!.scrollTop = 0;
          },
        }),
      ),
    );
    const body = { fairies: () => this.fairies(), weapons: () => this.weapons(), scene: () => this.sceneTab() }[this.tab]();
    this.root.replaceChildren(
      h('div', { class: 'tm-screen' }, [
        h('header', { class: 'tm-head' }, [
          h('button', { class: 'tm-btn tm-back', text: '‹ Back', onClick: () => s.quit() }),
          h('div', { class: 'tm-heading' }, [h('h1', { text: 'Massacre Mode' }), h('p', { text: `${total} / ${MAX_FAIRIES} fairies ready to die` })]),
          h('button', { class: 'tm-btn tm-primary mm-go', text: 'GO!', onClick: () => void s.go() }),
        ]),
        h('div', { class: 'mm-bar' }, [
          tabs,
          h('div', { class: 'mm-actions' }, [
            h('button', { class: 'tm-btn', text: 'Random', onClick: () => s.random() }),
            h('button', { class: 'tm-btn', text: 'Reset', onClick: () => s.change((c) => Object.assign(c, blankSetup())) }),
            h('button', { class: 'tm-btn', text: 'Share', onClick: () => void s.share() }),
          ]),
        ]),
        h('div', { class: 'tm-body mm-body' }, [body]),
      ]),
    );
    this.root.querySelector('.tm-body')!.scrollTop = scroll;
    const tiles = this.root.querySelector('.mm-tiles');
    if (tiles) tiles.scrollLeft = tilesScroll;
    if (s.message) this.root.appendChild(this.toast(s.message, s.shareLink));
  }

  // ---- tabs ----

  // Every fairy in the roster as a card with a count.
  private fairies(): HTMLElement {
    const s = this.scene;
    const sprites = getManifest().sprites;
    const cards = Object.values(FAIRIES).map((f) => {
      const count = s.config.fairies.find((x) => x.id === f.id)?.count ?? 0;
      const rows = f.class === 1 || f.class === 3 ? 2 : 1;
      const sheet = sprites[f.sprite];
      // The first animation frame, cut out of the sprite sheet with CSS.
      const thumb = h('div', {
        class: 'mm-thumb',
        style: sheet
          ? {
              backgroundImage: `url("${hdImageUrl('sprites', f.sprite) ?? imageUrl('sprites', f.sprite)}")`,
              backgroundSize: `${f.frames * 100}% ${rows * 100}%`,
              aspectRatio: `${sheet.w / f.frames} / ${sheet.h / rows}`,
            }
          : {},
      });
      const add = (n: number) => {
        const problem = s.addFairies(f.id, n);
        if (problem) s.toast(problem);
      };
      return h('div', { class: `mm-card${count ? ' picked' : ''}` }, [
        h('div', { class: 'mm-thumb-box' }, [thumb]),
        h('div', { class: 'mm-name', text: f.name }),
        f.worth < 0 ? h('div', { class: 'mm-tag', text: 'Innocent: costs points' }) : h('div', { class: 'mm-tag good', text: `${f.worth} pts` }),
        stepper(count, 0, MAX_FAIRIES, FAIRY_STEP, (v) => add((v ?? 0) - count)),
      ]);
    });
    return h('div', { class: 'mm-grid' }, cards);
  }

  private weapons(): HTMLElement {
    const s = this.scene;
    const cards = ARSENAL.map(([num, caption]) => {
      const w = WEAPONS[num - 1];
      const fixed = num === 1; // the Magnum always comes along, with 999 rounds
      const ammo = fixed ? 999 : s.config.ammo[num];
      const on = fixed || ammo != null;
      const toggle = h('input', { type: 'checkbox', role: 'switch', disabled: fixed, 'aria-label': `Take ${caption}` });
      toggle.checked = on;
      toggle.addEventListener('change', () => s.change((c) => (c.ammo[num] = toggle.checked ? (c.ammo[num] ?? DEFAULT_AMMO) : null)));
      return h('div', { class: `mm-card mm-weapon${on ? ' picked' : ''}` }, [
        h('img', { src: hdImageUrl('sprites', w.icon) ?? imageUrl('sprites', w.icon), alt: '', class: 'mm-icon' }),
        h('div', { class: 'mm-name', text: caption }),
        h('label', { class: 'tm-toggle mm-switch' }, [h('span', { text: fixed ? 'Always' : on ? 'Taking it' : 'Leave it' }), toggle]),
        fixed
          ? h('div', { class: 'mm-tag good', text: '999 rounds' })
          : on
            ? stepper(ammo ?? DEFAULT_AMMO, 1, MAX_AMMO, AMMO_STEP, (v) => s.change((c) => (c.ammo[num] = v ?? null)))
            : h('div', { class: 'mm-tag good', text: 'Switch on to set ammo' }),
      ]);
    });
    return h('div', { class: 'mm-grid' }, cards);
  }

  private sceneTab(): HTMLElement {
    const s = this.scene;
    const c = s.config;
    const m = getManifest();
    const pretty = (key: string) => key.replace(/[-_]+/g, ' ').replace(/(\D)(\d)/, '$1 $2');
    const locales = Object.keys(m.bg).map((key) =>
      h('button', { class: `mm-tile${c.bg === key ? ' on' : ''}`, onClick: () => s.change((c) => (c.bg = key)) }, [
        h('img', { src: imageUrl('bg', key), alt: '', loading: 'lazy' }),
        h('span', { text: pretty(key) }),
      ]),
    );
    const chip = (text: string, on: boolean, pick: () => void, img?: string) =>
      h('button', { class: `mm-chip${on ? ' on' : ''}`, onClick: pick }, [img ? h('img', { src: img, alt: '', loading: 'lazy' }) : null, h('span', { text })]);
    const weather = (['none', 'rain', 'snow'] as Weather[]).map((w) =>
      h('button', { class: c.weather === w ? 'on' : '', text: w[0].toUpperCase() + w.slice(1), onClick: () => s.change((c) => (c.weather = w)) }),
    );
    const section = (title: string, ...children: HTMLElement[]) => h('section', { class: 'mm-section' }, [h('label', { class: 'tm-label', text: title }), ...children]);
    return h('div', { class: 'mm-scene' }, [
      section('Locale', h('div', { class: 'mm-tiles' }, locales)),
      section(
        'Foreground',
        h('div', { class: 'mm-chips' }, [
          chip('None', !c.fg, () => s.change((c) => (c.fg = ''))),
          ...Object.keys(m.fg).map((key) => chip(pretty(key), c.fg === key, () => s.change((c) => (c.fg = key)), imageUrl('fg', key))),
        ]),
      ),
      section(
        'Music',
        h('div', { class: 'mm-chips' }, Object.keys(m.sfx).filter((k) => /^music\d/.test(k)).map((key) => chip(`Track ${key.slice(5)}`, c.music === key, () => s.change((c) => (c.music = key))))),
      ),
      h('div', { class: 'mm-row' }, [
        section('Weather', h('div', { class: 'tm-seg' }, weather)),
        section(
          'Time (seconds)',
          h('div', { class: 'mm-time' }, [
            stepper(c.time, 1, MAX_TIME, TIME_STEP, (v) => s.change((c) => (c.time = v ?? 30))),
            ...TIME_PRESETS.map((t) => chip(String(t), c.time === t, () => s.change((c) => (c.time = t)))),
          ]),
        ),
      ]),
    ]);
  }

  // Messages and share links, as a banner at the bottom.
  private toast(message: string, link: string): HTMLElement {
    const dismiss = () => {
      this.scene.message = '';
      this.scene.shareLink = '';
      this.render();
    };
    const linkBox = link ? h('input', { type: 'text', value: link, readonly: true, class: 'mm-link' }) : null;
    linkBox?.addEventListener('focus', () => linkBox.select());
    return h('div', { class: 'tm-toast mm-toast', role: 'alert' }, [
      h('div', { text: message }),
      linkBox,
      h('button', { class: 'tm-btn', text: 'OK', onClick: dismiss }),
    ]);
  }
}

// − [value] +, with the number typeable. Steps snap to multiples of `step`.
function stepper(value: number, min: number, max: number, step: number, onSet: (v: number | null) => void): HTMLElement {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const input = h('input', { type: 'text', inputmode: 'numeric', value: String(value), 'aria-label': 'Amount' });
  input.addEventListener('change', () => {
    const digits = input.value.replace(/\D/g, '');
    onSet(digits ? clamp(Number(digits)) : min > 0 ? min : 0);
  });
  input.addEventListener('focus', () => input.select());
  const down = h('button', { class: 'tm-btn', text: '−', 'aria-label': 'Less', disabled: value <= min, onClick: () => onSet(clamp(Math.ceil(value / step) * step - step)) });
  const up = h('button', { class: 'tm-btn', text: '+', 'aria-label': 'More', disabled: value >= max, onClick: () => onSet(clamp(Math.floor(value / step) * step + step)) });
  return h('div', { class: 'mm-stepper' }, [down, input, up]);
}
