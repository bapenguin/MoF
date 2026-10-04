// The front end: test.frm (Form2) rebuilt as HTML panels over the canvas.
// Positions come from the original form layout (twips / 15 = pixels).
//
//   main       Picture8: the wooden menu panel (+ the P&P title above it)
//   login      loginframe: pick or create a player (no passwords)
//   scenarios  roundsel: "Fairy Adventures", unlocked scenarios only
//   options    optionspic: sound / music / ambient / weather
//   stats      Picture3: the User Stats card
//   hof        mofhof: the MoF Hall of Fame
//   quit       Picture5: "Thank you for Playing"

import type { Engine, Scene } from '../engine/engine';
import { audio } from '../engine/audio';
import { getSheet, loadSheet } from '../engine/sprites';
import { hasImage, imageUrl } from '../engine/assets';
import { SCREEN_W, SCREEN_H } from '../engine/screen';
import { loadScenario, scenarioList } from '../game/data';
import { scenarioTasks } from '../game/preload';
import { GameMode } from '../game/world';
import { saveSettings, settings, type Settings } from '../game/settings';
import {
  accuracy,
  createProfile,
  favouriteWeapon,
  getProfile,
  lastPlayer,
  listProfiles,
  setLastPlayer,
  totalKills,
  type Profile,
} from '../game/profiles';
import { bg, h, menuLink } from '../ui/dom';
import { LoadingScene } from './loading';
import { PlayScene } from './play';

const MENU_MUSIC = 'music2';

export const MENU_ASSETS = [
  () => loadSheet('bforrest', 1, 1, 'bg'),
  () => loadSheet('hof-panel', 1, 1, 'ui'),
  () => loadSheet('full', 1, 1, 'ui'),
  () => audio.load(MENU_MUSIC),
];

type Panel = 'main' | 'login' | 'scenarios' | 'options' | 'stats' | 'hof' | 'quit';
type Mode = 'adventure' | 'massacre';

// The developers' own faces shipped with the game (sprites/<name>.bmp); a
// player with one of these names gets that face on their stats card.
const FACES = ['nick', 'dave', 'bozo'];

export class MenuScene implements Scene {
  private engine!: Engine;
  private panel: Panel = 'main';
  private mode: Mode = 'adventure';
  private player: Profile | null = null;
  private nameDraft = lastPlayer();
  private starting = false;

  enter(engine: Engine): void {
    this.engine = engine;
    audio.play(MENU_MUSIC, { channel: 'music', loop: true });
    this.show('main');
  }

  exit(): void {
    audio.stop(MENU_MUSIC);
  }

  update(): void {
    this.engine.input.takeClicks();
    this.engine.input.takeKeys();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.panel === 'hof') {
      getSheet('hof-panel', 'ui').draw(ctx, 0, 0);
      return;
    }
    getSheet('bforrest', 'bg').draw(ctx, 0, 0);
    if (this.panel === 'quit') {
      const full = getSheet('full', 'ui');
      full.draw(ctx, (SCREEN_W - full.frameW) / 2, (SCREEN_H - full.frameH) / 2);
    }
  }

  private show(panel: Panel, popup?: string): void {
    this.panel = panel;
    const build: Record<Panel, () => HTMLElement[]> = {
      main: () => [this.title(), this.mainPanel()],
      login: () => [this.title(), this.loginPanel()],
      scenarios: () => [this.scenarioPanel()],
      options: () => [this.title(), this.optionsPanel()],
      stats: () => [this.title(), this.loginPanel(), this.statsPanel()],
      hof: () => [this.hofPanel()],
      quit: () => [h('div', { at: [0, 0, SCREEN_W, SCREEN_H], onClick: () => this.show('main') })],
    };
    const els = build[panel]();
    if (popup) els.push(this.popup(popup));
    this.engine.overlay.replaceChildren(...els);
    if (panel === 'login') this.engine.overlay.querySelector<HTMLInputElement>('input')?.focus();
  }

  // Picture1: "P&P Enterprises Proudly Presents"
  private title(): HTMLElement {
    return h('img', { src: imageUrl('ui', 'title'), at: [376, 224, 287, 132] });
  }

  // ---- main menu (Picture8) ----

  private mainPanel(): HTMLElement {
    const font = '19px Arial';
    const login = (mode: Mode) => () => {
      this.mode = mode;
      this.show('login');
    };
    return h('div', { class: 'panel', at: [360, 360, 305, 273], style: { backgroundImage: bg('ui', 'menu-panel') } }, [
      h('img', { src: imageUrl('ui', 'menu-logo'), at: [36, 8, 232, 145] }),
      menuLink('Your Very Own Fairy Adventure', [0, 152, 305, 24], '21px Arial', login('adventure')),
      menuLink("Massacre dem' Fairies", [0, 176, 305, 22], font, login('massacre')),
      menuLink('Options', [0, 200, 305, 22], font, () => this.show('options')),
      menuLink('MoF HoF', [0, 224, 305, 22], font, () => this.show('hof')),
      menuLink("Quit dis' Shit!", [0, 248, 305, 22], font, () => this.show('quit')),
    ]);
  }

  // ---- login (loginframe), without the original's passwords ----

  private loginPanel(): HTMLElement {
    const names = listProfiles().map((p) => p.name);
    const input = h('input', {
      type: 'text',
      list: 'mof-players',
      maxlength: 20,
      placeholder: 'Your name',
      value: this.nameDraft,
      at: [172, 40, 201, 25],
    });
    input.addEventListener('input', () => (this.nameDraft = input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.go();
      if (e.key === 'Escape') this.show('main');
    });
    const modeText = this.mode === 'adventure' ? 'Fairy Adventure' : 'Massacre Mode';
    return h('div', { class: 'panel', at: [312, 512, 393, 137], style: { background: 'rgb(0,64,0)' } }, [
      h('div', { text: 'Login', at: [232, 0, 137, 41], style: { font: '32px Arial', color: '#0f0', textAlign: 'right' } }),
      h('button', { text: 'Cancel', at: [8, 8, 105, 25], onClick: () => this.show('main') }),
      h('button', { text: 'New User', at: [8, 40, 105, 25], onClick: () => this.newUser() }),
      h('button', { text: 'View Stats', at: [8, 72, 105, 25], onClick: () => this.viewStats() }),
      h('button', { text: 'Go!', at: [8, 104, 105, 25], onClick: () => this.go() }),
      h('div', { text: 'Name:', at: [118, 43, 50, 25], style: { font: '16px Arial', color: '#f00', textAlign: 'right' } }),
      input,
      h('datalist', { id: 'mof-players' }, names.map((n) => h('option', { value: n }))),
      h('div', { text: modeText, at: [172, 74, 201, 20], style: { font: 'italic 14px Arial', color: '#9f9' } }),
      h('div', {
        text: names.length ? `${names.length} player${names.length === 1 ? '' : 's'} on this computer` : 'New here? Type a name and click New User.',
        at: [172, 98, 215, 30],
        style: { font: '12px Arial', color: '#9c9' },
      }),
    ]);
  }

  // LoadGuy, with the original's messages.
  private findPlayer(): Profile | null {
    const name = this.nameDraft.trim();
    if (!name) {
      this.show(this.panel, 'Please type your name.');
      return null;
    }
    const p = getProfile(name);
    if (!p) {
      this.show(this.panel, "User not found! To create a new user, enter the name and click the 'New User' button.");
      return null;
    }
    return p;
  }

  private newUser(): void {
    const result = createProfile(this.nameDraft);
    if (typeof result === 'string') return this.show('login', result);
    this.nameDraft = result.name;
    this.show('login', "Finished! Press 'Go!' to begin your game.");
  }

  private viewStats(): void {
    const p = this.findPlayer();
    if (!p) return;
    this.player = p;
    this.show('stats');
  }

  private go(): void {
    const p = this.findPlayer();
    if (!p) return;
    this.player = p;
    setLastPlayer(p.name);
    if (this.mode === 'massacre') {
      this.show('login', 'Massacre Mode is coming in the next update!');
      return;
    }
    this.show('scenarios');
  }

  // ---- scenario select (roundsel) ----

  private scenarioPanel(): HTMLElement {
    const unlocked = Math.min(this.player?.scenario ?? 0, scenarioList.length - 1);
    const rows = scenarioList.flatMap((s, i) => {
      const top = 48 + i * 88;
      // The original hid locked scenarios entirely; showing them dimmed tells
      // players there's more to unlock.
      if (i > unlocked) {
        return [
          h('div', { at: [8, top, 104, 79], style: { backgroundImage: bg('ui', `scenario-${s.id}`), backgroundSize: '104px 79px', filter: 'grayscale(1) brightness(0.35)' } }),
          h('div', {
            text: `Locked. Beat "${scenarioList[i - 1].title}" to unlock.`,
            at: [120, top + 28, 465, 30],
            style: { font: 'italic 16px Arial', color: 'rgba(0,192,0,0.6)' },
          }),
        ];
      }
      const title = h('div', {
        text: s.title,
        at: [0, 16, 104, 60],
        style: { font: 'bold 16px Arial', color: 'rgb(0,0,192)', textAlign: 'center', textShadow: '0 0 3px #fff' },
      });
      const pic = h('div', {
        class: 'link',
        at: [8, top, 104, 79],
        style: { backgroundImage: bg('ui', `scenario-${s.id}`), backgroundSize: '104px 79px', whiteSpace: 'normal' },
        onClick: () => this.startScenario(s.id),
      }, [title]);
      pic.addEventListener('mouseenter', () => (title.style.color = 'rgb(0,225,54)'));
      pic.addEventListener('mouseleave', () => (title.style.color = 'rgb(0,0,192)'));
      return [pic, h('div', { text: s.description, at: [120, top, 465, 81], style: { font: '16px Arial', color: 'rgb(0,192,0)' } })];
    });
    return h('div', { class: 'panel', at: [216, 112, 601, 441], style: { backgroundImage: bg('ui', 'scenario-panel') } }, [
      h('div', { text: 'Fairy Adventures', at: [0, 0, 585, 49], style: { font: '32px Arial', color: 'rgb(0,192,0)', textAlign: 'center' } }),
      ...rows,
      h('button', { text: 'Cancel', at: [16, 404, 73, 22], onClick: () => this.show('login') }),
    ]);
  }

  private async startScenario(id: string): Promise<void> {
    if (this.starting || !this.player) return;
    this.starting = true;
    const scenario = await loadScenario(id);
    const engine = this.engine;
    engine.setScene(
      new LoadingScene(scenario.title, scenarioTasks(scenario), () =>
        new PlayScene(scenario, GameMode.Adventure, this.player, () => engine.setScene(new MenuScene())),
      ),
    );
  }

  // ---- options (optionspic) ----

  private optionsPanel(): HTMLElement {
    const draft = { ...settings };
    const box = (key: keyof Settings, text: string, top: number) => {
      const input = h('input', { type: 'checkbox', checked: draft[key] });
      input.addEventListener('change', () => (draft[key] = input.checked));
      return h('label', { class: 'check', at: [0, top, 145, 17] }, [input, document.createTextNode(text)]);
    };
    return h('div', { class: 'panel', at: [440, 464, 145, 169], style: { backgroundImage: bg('ui', 'options-panel') } }, [
      h('div', { text: 'Options', at: [24, 24, 89, 25], style: { font: '19px Arial', textAlign: 'center' } }),
      box('sound', 'Sound', 64),
      box('ambient', 'Ambient Sounds', 81),
      box('music', 'Music', 98),
      box('weather', 'Weather Effects', 115),
      h('button', {
        text: 'Ok',
        at: [32, 138, 81, 25],
        onClick: () => {
          saveSettings(draft);
          // The menu music follows the new settings straight away.
          audio.play(MENU_MUSIC, { channel: 'music', loop: true });
          this.show('main');
        },
      }),
    ]);
  }

  // ---- User Stats card (Picture3) ----

  private statsPanel(): HTMLElement {
    const p = this.player!;
    const value = (text: string, at: [number, number, number, number]) =>
      h('div', { text, at, style: { font: '15px Arial', color: '#0f0', textAlign: 'center', whiteSpace: 'nowrap' } });
    const face = FACES.includes(p.name.toLowerCase()) && hasImage('sprites', p.name.toLowerCase())
      ? imageUrl('sprites', p.name.toLowerCase())
      : imageUrl('ui', 'stats-face');
    const kills = Object.entries(p.kills)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) =>
        h('div', { style: { display: 'flex', gap: '8px', marginBottom: '3px' } }, [
          h('span', { text: n.toLocaleString(), style: { flex: '0 0 44px', textAlign: 'right' } }),
          h('span', { text: name }),
        ]),
      );
    const close = h('div', {
      class: 'link',
      text: 'X',
      at: [512, 8, 33, 25],
      style: { font: '21px Arial', color: 'rgb(0,192,0)', border: '1px solid rgb(0,192,0)' },
      onClick: () => this.show('login'),
    });
    return h('div', { class: 'panel', at: [232, 88, 550, 600], style: { backgroundImage: bg('ui', 'stats-panel') } }, [
      h('img', { src: face, at: [48, 88, 121, 113], style: { objectFit: 'cover' } }),
      close,
      value(p.name, [32, 216, 161, 25]),
      value(p.score.toLocaleString(), [40, 290, 145, 25]),
      value(p.shots.toLocaleString(), [48, 338, 137, 25]),
      value(p.hits.toLocaleString(), [48, 386, 129, 25]),
      value(favouriteWeapon(p), [40, 442, 129, 25]),
      value(String(p.levelsPlayed), [56, 498, 97, 25]),
      value(`${accuracy(p)}%`, [80, 546, 65, 25]),
      value(String(p.longStreak), [180, 546, 57, 25]),
      h('div', {
        class: 'list',
        text: kills.length ? undefined : 'No fairies harmed yet.',
        at: [304, 304, 217, 236],
        style: { background: 'rgb(69,39,10)', color: '#0f0', font: '13px Arial', whiteSpace: 'normal', overflowX: 'hidden' },
      }, kills),
    ]);
  }

  // ---- Hall of Fame (mofhof) ----

  private hofPanel(): HTMLElement {
    const all = listProfiles();
    const best = (score: (p: Profile) => number, format: (n: number) => string, eligible = (_: Profile) => true) => {
      let top: Profile | null = null;
      for (const p of all) if (eligible(p) && score(p) > 0 && (!top || score(p) > score(top))) top = p;
      return top ? `${top.name} (${format(score(top))})` : '—';
    };
    const n = (v: number) => v.toLocaleString();
    // The original filled in Most Kills, Best Shot and No Life Award, and left
    // the other two blank. Best Shot needs 50+ shots so one lucky shot can't win it.
    const rows: Array<[string, string, string, number]> = [
      ['Most Kills', best(totalKills, n), '37px Arial', 232],
      ['Best Shot', best(accuracy, (v) => `${v}%`, (p) => p.shots >= 50), '37px Arial', 280],
      ['Levels Completed', best((p) => p.levelsCompleted, n), '29px Arial', 330],
      ['No Life Award', best((p) => p.levelsPlayed, (v) => `${n(v)} levels`), '32px Arial', 376],
      ['Coolest Guy', best((p) => p.score, (v) => `${n(v)} pts`), '29px Arial', 426],
    ];
    return h('div', { at: [0, 0, SCREEN_W, SCREEN_H], style: { cursor: 'pointer' }, onClick: () => this.show('main') }, [
      ...rows.flatMap(([label, value, font, top]) => [
        h('div', { text: label, at: [276, top], style: { font, color: '#f00', whiteSpace: 'nowrap' } }),
        h('div', {
          text: value,
          at: [520, top + 8, 222],
          style: { font: '19px Arial', color: '#ff6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        }),
      ]),
      h('div', { text: 'Click anywhere to go back', at: [250, 630, 500], style: { font: '14px Arial', color: '#fc9', textAlign: 'center' } }),
    ]);
  }

  // The VB "pop" frame: a message with an Ok button.
  private popup(message: string): HTMLElement {
    return h('div', {
      class: 'panel',
      at: [336, 272, 345, 96],
      style: { background: '#d4d0c8', border: '2px outset #fff', boxSizing: 'border-box', zIndex: '10' },
    }, [
      h('div', { text: message, at: [12, 8, 317, 44], style: { font: '13px Tahoma, Arial, sans-serif' } }),
      h('button', { text: 'Ok', at: [126, 58, 89, 25], onClick: () => this.show(this.panel) }),
    ]);
  }
}
