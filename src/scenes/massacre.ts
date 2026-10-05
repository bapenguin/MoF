// Massacre Mode builder: mmode.frm rebuilt as HTML. Pick weapons and ammo,
// fairies and how many, a locale, foreground, music, weather and a time limit,
// then GO. The original wrote all this to massacre.mof and loaded it like any
// scenario; here the same scenario is built in memory.
//
// On the touch layout the same setup is edited at finger size by massacre-touch.ts;
// the rules (limits, Random, GO, sharing) stay here.

import type { Engine, Scene } from '../engine/engine';
import { audio } from '../engine/audio';
import { getManifest, imageUrl } from '../engine/assets';
import { getSheet } from '../engine/sprites';
import { layout } from '../engine/screen';
import type { LevelDef, ScenarioDef } from '../game/data';
import renames from '../../data/renames.json';
import { scenarioTasks } from '../game/preload';
import { GameMode } from '../game/world';
import { WEAPONS } from '../game/weapons';
import type { Profile } from '../game/profiles';
import {
  FAIRIES,
  MAX_AMMO,
  MAX_FAIRIES,
  MAX_TIME,
  MAX_TYPES,
  blankSetup as blankConfig,
  setupLink,
  type MassacreSetup as Config,
  type Weather,
} from '../game/share';
import { h } from '../ui/dom';
import { LoadingScene } from './loading';
import { PlayScene } from './play';
import { MenuScene, MENU_MUSIC } from './menu';
import { TouchMassacre } from './massacre-touch';

export const DEFAULT_AMMO = 50; // filled in when a weapon is ticked with no ammo typed
const KEY = 'mof.massacre';

// The arsenal checkbox captions from mmode.frm (weapon 1 is always included).
export const ARSENAL: Array<[number, string]> = [
  [1, 'Magnum'],
  [2, 'Shotgun'],
  [3, 'Machine Gun'],
  [4, 'Da Howitzer'],
  [5, 'Fairy Mines'],
  [6, 'Da Bus'],
  [7, "Ion O' Death"],
  [8, 'Mr. Piano Man'],
  [9, 'Black hole SUN!'],
];

function loadConfig(): Config {
  try {
    const c: Config = { ...blankConfig(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    // Setups saved before fairy ids were renamed.
    const ids = renames.ids as Record<string, string>;
    c.fairies = c.fairies.map((f) => ({ ...f, id: ids[f.id] ?? f.id })).filter((f) => FAIRIES[f.id]);
    return c;
  } catch {
    return blankConfig();
  }
}

function saveConfig(c: Config): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

// The original form was 875x688; centre it on the 1024x768 screen.
const OX = 74;
const OY = 40;
const at = (x: number, y: number, w?: number, hgt?: number): [number, number, number?, number?] => [x + OX, y + OY, w, hgt];
const GREEN = 'rgb(0,192,0)';
const label = (text: string, pos: ReturnType<typeof at>, size = 21) =>
  h('div', { text, at: pos, style: { font: `bold ${size}px Arial`, color: GREEN } });

export class MassacreScene implements Scene {
  private engine!: Engine;
  // Read by massacre-touch.ts too.
  config = loadConfig();
  message = '';
  shareLink = '';
  private starting = false;
  private touch: TouchMassacre | null = null;

  // `shared`: a setup that arrived in a link, loaded in place of the saved one.
  constructor(
    private player: Profile,
    private shared: Config | null = null,
  ) {}

  enter(engine: Engine): void {
    this.engine = engine;
    if (layout.touch) this.touch = new TouchMassacre(this);
    audio.play(MENU_MUSIC, { channel: 'music', loop: true });
    if (this.shared) {
      this.config = this.shared;
      saveConfig(this.config);
      this.message = "A friend's massacre is loaded and ready. Hit GO when you're ready!";
    }
    this.build();
  }

  exit(): void {
    this.touch?.destroy();
    audio.stop(MENU_MUSIC);
  }

  update(): void {
    this.engine.input.takeClicks();
    this.engine.input.takeKeys();
  }

  render(ctx: CanvasRenderingContext2D): void {
    getSheet('massacre-bg', 'ui').draw(ctx, 0, 0);
  }

  get totalFairies(): number {
    return this.config.fairies.reduce((a, f) => a + f.count, 0);
  }

  change(fn: (c: Config) => void): void {
    fn(this.config);
    saveConfig(this.config);
    this.build();
  }

  build(): void {
    if (this.touch) return this.touch.render();
    const c = this.config;
    const m = getManifest();
    const els: HTMLElement[] = [
      h('img', { src: imageUrl('ui', 'massacre-logo'), at: at(384, 0, 287, 132) }),
      label('Massacre Mode', at(410, 130, 290), 37),
      label('Your Arsenal', at(192, 166)),
      ...this.arsenal(),
      label('Your Innocent Fairies', at(424, 178), 18),
      ...this.fairyPicker(),
      label('Your Locale', at(656, 176)),
      this.listBox(Object.keys(m.bg), c.bg, at(632, 202, 185, 186), (v) => this.change((c) => (c.bg = v))),
      label('Your Fore Ground', at(632, 396)),
      this.listBox(['', ...Object.keys(m.fg)], c.fg, at(632, 424, 185, 71), (v) => this.change((c) => (c.fg = v)), '(none)'),
      label('Your Music', at(648, 504)),
      this.listBox(Object.keys(m.sfx).filter((k) => /^music\d/.test(k)), c.music, at(640, 532, 177, 62), (v) => this.change((c) => (c.music = v))),
      ...this.weatherPicker(),
      h('div', {
        text: 'How Long would you like to slaughter perfectly innocent fairies for? In seconds....',
        at: at(216, 452, 200, 80),
        style: { font: 'bold 16px Arial', color: GREEN },
      }),
      this.numberBox(c.time, at(248, 536, 105, 25), MAX_TIME, (v) => this.change((c) => (c.time = v ?? 0))),
      h('button', { text: 'GO', at: at(232, 568, 121, 76), style: { font: '48px Arial' }, onClick: () => void this.go() }),
      h('button', { text: 'Random Massacre', at: at(232, 652, 121, 25), onClick: () => this.random() }),
      h('button', { text: 'Reset All', at: at(472, 584, 105, 21), onClick: () => this.change((c) => Object.assign(c, blankConfig())) }),
      h('button', { text: 'QUIT', at: at(400, 662, 201, 21), onClick: () => this.quit() }),
      h('button', { text: 'Share this massacre', at: at(632, 646, 185, 26), onClick: () => void this.share() }),
    ];
    if (this.message) els.push(this.popup(this.message, this.shareLink));
    this.engine.overlay.replaceChildren(...els);
  }

  private arsenal(): HTMLElement[] {
    return ARSENAL.flatMap(([num, caption], i) => {
      const top = 200 + i * 24;
      const fixed = num === 1; // the Magnum always comes along, with 999 rounds
      const ammo = fixed ? 999 : this.config.ammo[num];
      const checked = fixed || ammo != null;
      const box = h('input', { type: 'checkbox', checked, disabled: fixed });
      box.addEventListener('change', () =>
        this.change((c) => (c.ammo[num] = box.checked ? (c.ammo[num] ?? DEFAULT_AMMO) : null)),
      );
      const title = `${caption} (${WEAPONS[num - 1].name})`;
      return [
        h('label', { class: 'check', at: at(184, top, 153, 22), title }, [box, document.createTextNode(caption)]),
        fixed
          ? h('input', { type: 'text', value: '999', disabled: true, at: at(344, top, 50, 22), style: { textAlign: 'right' } })
          : this.numberBox(ammo ?? null, at(344, top, 50, 22), MAX_AMMO, (v) =>
              // Typing ammo ticks the box, like ammo_Change in the original.
              this.change((c) => (c.ammo[num] = v)),
            ),
      ];
    });
  }

  quit(): void {
    this.engine.setScene(new MenuScene());
  }

  // Adds `n` of a fairy (negative removes), within the original's limits.
  // Returns why it couldn't, or null.
  addFairies(id: string, n: number): string | null {
    const c = this.config;
    const existing = c.fairies.find((f) => f.id === id);
    if (n > 0 && !existing && c.fairies.length >= MAX_TYPES) return `That's ${MAX_TYPES} kinds of fairy already.`;
    if (n > 0 && this.totalFairies + n > MAX_FAIRIES) return `Only ${MAX_FAIRIES} fairies fit on screen at once.`;
    this.change((c) => {
      if (existing) existing.count = Math.max(0, existing.count + n);
      else if (n > 0) c.fairies.push({ id, count: n });
      c.fairies = c.fairies.filter((f) => f.count > 0);
    });
    return null;
  }

  private fairyPicker(): HTMLElement[] {
    const c = this.config;
    const available = h(
      'select',
      { size: 12, at: at(432, 202, 201, 186) },
      Object.values(FAIRIES).map((f) => h('option', { value: f.id, text: f.name, title: f.worth < 0 ? 'Innocent (costs points)' : '' })),
    );
    const count = h('input', { type: 'text', inputmode: 'numeric', at: at(472, 400, 49, 33), style: { fontSize: '18px' } });
    const submit = () => {
      const id = available.value;
      const n = Math.floor(Number(count.value));
      if (!id) return this.toast('Pick a fairy from the list first.');
      if (!(n > 0)) return this.toast('How many? Type a number in the box.');
      const problem = this.addFairies(id, n);
      if (problem) this.toast(problem);
    };
    count.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
    available.addEventListener('dblclick', () => count.focus());

    const ready = h(
      'select',
      { size: 6, at: at(424, 480, 193, 95) },
      c.fairies.map((f, i) => h('option', { value: String(i), text: `${f.count}:   ${FAIRIES[f.id]?.name ?? f.id}` })),
    );
    return [
      available,
      count,
      h('button', { text: 'Submit Fairies for Slaughtering', at: at(528, 400, 97, 36), style: { fontSize: '11px', lineHeight: '13px' }, onClick: submit }),
      h('button', {
        text: 'Remove',
        at: at(424, 448, 65, 25),
        onClick: () => {
          const i = Number(ready.value);
          if (ready.value !== '') this.change((c) => c.fairies.splice(i, 1));
        },
      }),
      label('Fairies Ready to Die', at(496, 444, 130, 34), 14),
      ready,
      h('div', {
        text: `${this.totalFairies} / ${MAX_FAIRIES}`,
        at: at(420, 586, 50, 20),
        style: { font: 'bold 12px Arial', color: '#ff6', whiteSpace: 'nowrap' },
      }),
    ];
  }

  private weatherPicker(): HTMLElement[] {
    const options: Array<[Weather, string, number]> = [
      ['none', 'None', 528],
      ['rain', 'Rain', 608],
      ['snow', 'Snow', 688],
    ];
    return [
      h('div', { text: 'Weather:', at: at(400, 612, 121, 25), style: { font: '16px Arial', color: GREEN, textAlign: 'right' } }),
      ...options.map(([value, text, left]) => {
        const radio = h('input', { type: 'radio', name: 'weather', checked: this.config.weather === value });
        radio.addEventListener('change', () => this.change((c) => (c.weather = value)));
        return h('label', { class: 'check', at: at(left, 614, 74, 20) }, [radio, document.createTextNode(text)]);
      }),
    ];
  }

  private listBox(items: string[], selected: string, pos: ReturnType<typeof at>, onPick: (v: string) => void, blankText = '') {
    const sel = h(
      'select',
      { size: Math.max(2, Math.floor((pos[3] ?? 60) / 17)), at: pos },
      items.map((v) => h('option', { value: v, text: v || blankText })),
    );
    sel.value = selected;
    sel.addEventListener('change', () => onPick(sel.value));
    return sel;
  }

  // Digits only, clamped; empty means "not set" (null).
  private numberBox(value: number | null, pos: ReturnType<typeof at>, max: number, onSet: (v: number | null) => void) {
    const input = h('input', { type: 'text', inputmode: 'numeric', value: value == null ? '' : String(value), at: pos, style: { textAlign: 'right' } });
    input.addEventListener('change', () => {
      const digits = input.value.replace(/\D/g, '');
      onSet(digits ? Math.min(max, Number(digits)) : null);
    });
    return input;
  }

  // Command6_Click: random ammo for some weapons (1 in 5 each), up to eight
  // random fairy batches, and a random locale, foreground and music. Unlike the
  // original it starts from a clean slate, so repeated clicks don't pile up.
  random(): void {
    const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
    const m = getManifest();
    this.change((c) => {
      Object.assign(c, blankConfig(), { time: c.time, weather: c.weather });
      for (let num = 2; num <= 9; num++) if (Math.floor(Math.random() * 5) === 3) c.ammo[num] = Math.floor(Math.random() * 99) + 1;
      const ids = Object.keys(FAIRIES);
      for (let x = 1; x <= 8; x++) {
        if (Math.floor(Math.random() * 3) !== 2) continue;
        const id = pick(ids);
        const n = 2 * x;
        if (this.totalFairies + n > MAX_FAIRIES) continue;
        const existing = c.fairies.find((f) => f.id === id);
        if (existing) existing.count += n;
        else c.fairies.push({ id, count: n });
      }
      c.bg = pick(Object.keys(m.bg));
      c.fg = pick(Object.keys(m.fg));
      c.music = pick(Object.keys(m.sfx).filter((k) => /^music\d/.test(k)));
    });
  }

  // Command2_Click: build the custom scenario and play it.
  async go(): Promise<void> {
    if (this.starting) return;
    const c = this.config;
    if (!c.fairies.length) return this.toast('Submit some fairies for slaughtering first!');
    const m = getManifest();
    const level: LevelDef = {
      id: 'custom',
      name: 'Your Own Custom Massacre',
      bg: c.bg || Object.keys(m.bg)[0],
      music: c.music || 'music1',
      timeLimit: c.time > 0 ? c.time : 60,
      next: 'end',
      weather: c.weather === 'none' ? undefined : c.weather,
      foreground: c.fg || undefined,
      spawns: c.fairies.map((f) => ({ type: f.id, count: f.count })),
    };
    const ammo: Record<string, number> = { 1: 999 };
    for (const [num, n] of Object.entries(c.ammo)) if (n) ammo[num] = n;
    const scenario: ScenarioDef = {
      id: 'massacre',
      title: 'Your Own Custom Massacre',
      description: '',
      worth: -10,
      start: 'custom',
      ammo,
      levels: { custom: level },
      fairies: FAIRIES,
    };

    this.starting = true;
    const engine = this.engine;
    const player = this.player;
    engine.setScene(
      new LoadingScene(scenario.title, scenarioTasks(scenario), () =>
        // Afterwards it's back to the builder, settings intact (the original reloaded mmode).
        new PlayScene(scenario, GameMode.Massacre, player, () => engine.setScene(new MassacreScene(player))),
      ),
    );
  }

  toast(message: string, link = ''): void {
    this.message = message;
    this.shareLink = link;
    this.build();
  }

  // Share (new): the setup as a link, copied to the clipboard if the browser allows.
  async share(): Promise<void> {
    if (!this.config.fairies.length) return this.toast('Add some fairies first, then share your massacre.');
    const link = setupLink(this.config);
    let copied = false;
    try {
      await navigator.clipboard.writeText(link);
      copied = true;
    } catch {
      // no clipboard access (e.g. plain http): the link is shown to copy by hand
    }
    this.toast(copied ? 'Link copied! Send it to a friend to let them play this massacre.' : 'Copy this link and send it to a friend:', link);
  }

  private popup(message: string, link = ''): HTMLElement {
    const height = link ? 128 : 96;
    const linkBox = link
      ? h('input', { type: 'text', value: link, readonly: true, at: [12, 52, 317, 26], style: { font: '12px Arial' } })
      : null;
    linkBox?.addEventListener('focus', () => linkBox.select());
    return h('div', {
      class: 'panel',
      at: [336, 300, 345, height],
      style: { background: '#d4d0c8', border: '2px outset #fff', boxSizing: 'border-box', zIndex: '10' },
    }, [
      h('div', { text: message, at: [12, 8, 317, 44], style: { font: '13px Tahoma, Arial, sans-serif' } }),
      linkBox,
      h('button', {
        text: 'Ok',
        at: [126, height - 38, 89, 25],
        onClick: () => {
          this.message = '';
          this.shareLink = '';
          this.build();
        },
      }),
    ]);
  }
}
