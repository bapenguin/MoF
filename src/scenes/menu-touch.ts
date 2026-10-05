// The front end at finger size (new), for the touch layout. The original menus are
// laid out in 1024x768 pixels and shrink to unreadable on a phone, so on phones and
// tablets MenuScene hands its screens to this: one full-screen layer in real CSS px
// with big buttons and scrolling lists, over the same forest backdrop. All the logic
// (logging in, unlocks, starting a game) stays in MenuScene.

import { audio } from '../engine/audio';
import { imageUrl } from '../engine/assets';
import { levelOrder, scenarioList } from '../game/data';
import { DIFFICULTY, saveSettings, settings, type Difficulty, type Settings } from '../game/settings';
import { accuracy, createProfile, favouriteWeapon, getProfile, levelStars, listProfiles, totalKills, type Profile } from '../game/profiles';
import { h } from '../ui/dom';
import { MENU_MUSIC, faceUrl, hallOfFame, type MenuScene, type Panel } from './menu';

const canVibrate = typeof navigator.vibrate === 'function';

export class TouchMenu {
  private root: HTMLElement;

  constructor(private menu: MenuScene) {
    // The forest from the original menu, darkened so text reads over it.
    const forest = `linear-gradient(rgba(0, 18, 0, 0.55), rgba(0, 8, 0, 0.8)), url("${imageUrl('bg', 'bforrest')}")`;
    this.root = h('div', { class: 'tm', style: { backgroundImage: forest } });
    document.body.appendChild(this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  show(panel: Panel, message?: string): void {
    const screens: Partial<Record<Panel, () => HTMLElement>> = {
      main: () => this.main(),
      login: () => this.login(),
      scenarios: () => this.scenarios(),
      levels: () => this.levels(),
      options: () => this.options(),
      stats: () => this.stats(),
      hof: () => this.hof(),
    };
    // There's no quitting a web page, so the touch menu has no Quit screen.
    const screen = (screens[panel] ?? screens.main!)();
    this.root.replaceChildren(screen);
    if (message) this.root.appendChild(this.toast(message));
  }

  // ---- screens ----

  private main(): HTMLElement {
    const start = (mode: 'adventure' | 'massacre') => () => {
      this.menu.mode = mode;
      this.menu.show('login');
    };
    return h('div', { class: 'tm-screen tm-main' }, [
      h('div', { class: 'tm-brand' }, [
        h('img', { src: imageUrl('ui', 'title'), alt: 'P&P Enterprises proudly presents', class: 'tm-title' }),
        h('img', { src: imageUrl('ui', 'menu-logo'), alt: 'Massacre of the Fairies', class: 'tm-logo' }),
      ]),
      h('div', { class: 'tm-actions' }, [
        bigButton('Fairy Adventure', 'Four scenarios of fairy carnage', start('adventure')),
        bigButton('Massacre Mode', 'Pick the fairies, weapons and scenery', start('massacre')),
        h('div', { class: 'tm-pair' }, [
          button('Options', () => this.menu.show('options')),
          button('Hall of Fame', () => this.menu.show('hof')),
        ]),
      ]),
    ]);
  }

  // Pick a player (one tap plays) or make a new one.
  private login(): HTMLElement {
    const m = this.menu;
    const last = m.nameDraft;
    const players = listProfiles().sort((a, b) => (a.name === last ? -1 : b.name === last ? 1 : a.name.localeCompare(b.name)));
    const pick = (p: Profile) => {
      m.nameDraft = p.name;
      m.go();
    };
    const cards = players.map((p) =>
      h('div', { class: 'tm-player' }, [
        h('button', { class: 'tm-player-go', onClick: () => pick(p) }, [
          h('img', { src: faceUrl(p), alt: '' }),
          h('span', { class: 'tm-player-text' }, [
            h('span', { class: 'tm-player-name', text: p.name }),
            h('span', { class: 'tm-player-sub', text: `${totalKills(p).toLocaleString()} kills · ${p.levelsCompleted} levels` }),
          ]),
        ]),
        h('button', {
          class: 'tm-btn tm-icon',
          text: 'Stats',
          'aria-label': `${p.name}'s stats`,
          onClick: () => {
            m.nameDraft = p.name;
            m.viewStats();
          },
        }),
      ]),
    );

    const input = h('input', { type: 'text', maxlength: 20, placeholder: 'Your name', autocomplete: 'off', enterkeyhint: 'go' });
    const create = () => {
      m.nameDraft = input.value;
      // An existing name just logs in; otherwise make the player and carry straight on.
      const existing = getProfile(input.value.trim());
      if (existing) return pick(existing);
      const result = createProfile(input.value);
      if (typeof result === 'string') return m.show('login', result);
      pick(result);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') create();
    });

    const empty = h('p', { class: 'tm-empty', text: 'No players yet. Make one to start.' });
    return screen(m.mode === 'adventure' ? 'Fairy Adventure' : 'Massacre Mode', "Who's playing?", () => m.show('main'), [
      h('div', { class: 'tm-split' }, [
        h('div', { class: 'tm-list' }, cards.length ? cards : [empty]),
        h('div', { class: 'tm-side' }, [h('label', { class: 'tm-label', text: 'New player' }), input, button('Create & play', create, 'tm-primary')]),
      ]),
    ]);
  }

  private scenarios(): HTMLElement {
    const m = this.menu;
    const unlocked = Math.min(m.player?.scenario ?? 0, scenarioList.length - 1);
    const cards = scenarioList.map((s, i) => {
      const locked = i > unlocked;
      return h('button', { class: `tm-scenario${locked ? ' locked' : ''}`, disabled: locked, onClick: () => void m.openLevels(s.id) }, [
        h('img', { src: imageUrl('ui', `scenario-${s.id}`), alt: '' }),
        h('span', { class: 'tm-scenario-title', text: s.title }),
        h('span', { class: 'tm-scenario-desc', text: locked ? `Locked. Beat "${scenarioList[i - 1].title}" to unlock.` : s.description }),
      ]);
    });
    return screen('Fairy Adventures', m.player?.name ?? '', () => m.show('login'), [h('div', { class: 'tm-grid' }, cards)]);
  }

  private levels(): HTMLElement {
    const m = this.menu;
    const scenario = m.levelScenario!;
    const p = m.player!;
    const rows = levelOrder(scenario).map((l, i) => {
      const open = m.levelUnlocked(scenario, l.id);
      const stars = levelStars(p, scenario.id, l.id);
      return h('button', {
        class: `tm-level${l.id === m.selectedLevel ? ' selected' : ''}`,
        disabled: !open,
        onClick: () => {
          // Tapping the chosen level again starts it.
          if (m.selectedLevel === l.id) return void m.startScenario(scenario.id);
          m.selectedLevel = l.id;
          m.show('levels');
        },
      }, [
        h('span', { class: 'tm-level-num', text: String(i + 1) }),
        h('span', { class: 'tm-level-name', text: open ? l.name : 'Locked: clear the level before' }),
        open ? h('span', { class: 'tm-stars', text: '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars) }) : null,
      ]);
    });
    const difficulty = h(
      'div',
      { class: 'tm-seg' },
      (Object.keys(DIFFICULTY) as Difficulty[]).map((d) =>
        h('button', {
          class: settings.difficulty === d ? 'on' : '',
          text: DIFFICULTY[d].label,
          onClick: () => {
            saveSettings({ difficulty: d });
            m.show('levels');
          },
        }),
      ),
    );
    const list = h('div', { class: 'tm-list' }, rows);
    const view = screen(scenario.title, 'Pick a level', () => m.show('scenarios'), [
      h('div', { class: 'tm-split' }, [
        list,
        h('div', { class: 'tm-side' }, [
          h('label', { class: 'tm-label', text: 'Difficulty' }),
          difficulty,
          h('p', { class: 'tm-hint', text: 'Stars: clear the level · 70% accuracy · harm no innocents' }),
          button('Start', () => void m.startScenario(scenario.id), 'tm-primary tm-start'),
        ]),
      ]),
    ]);
    // Keep the chosen level in view on long lists.
    requestAnimationFrame(() => list.querySelector('.selected')?.scrollIntoView({ block: 'nearest' }));
    return view;
  }

  // Changes apply as you flip them.
  private options(): HTMLElement {
    type Toggle = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];
    const toggle = (key: Toggle, label: string) => {
      const input = h('input', { type: 'checkbox', role: 'switch' });
      input.checked = settings[key];
      input.addEventListener('change', () => {
        saveSettings({ [key]: input.checked });
        // The menu music follows the new settings straight away.
        if ((key === 'sound' || key === 'music') && input.checked) audio.play(MENU_MUSIC, { channel: 'music', loop: true });
      });
      return h('label', { class: 'tm-toggle' }, [h('span', { text: label }), input]);
    };
    return screen('Options', '', () => this.menu.show('main'), [
      h('div', { class: 'tm-toggles' }, [
        toggle('sound', 'Sound'),
        toggle('music', 'Music'),
        toggle('ambient', 'Ambient sounds'),
        toggle('weather', 'Weather effects'),
        toggle('shake', 'Screen shake'),
        canVibrate && toggle('vibrate', 'Vibrate on kills'),
      ]),
    ]);
  }

  private stats(): HTMLElement {
    const p = this.menu.player!;
    const stat = (label: string, value: string) => h('div', { class: 'tm-stat' }, [h('span', { text: label }), h('b', { text: value })]);
    const kills = Object.entries(p.kills)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => h('div', { class: 'tm-kill' }, [h('b', { text: n.toLocaleString() }), h('span', { text: name })]));
    return screen(p.name, 'Player stats', () => this.menu.show('login'), [
      h('div', { class: 'tm-split' }, [
        h('div', { class: 'tm-stats' }, [
          h('img', { src: faceUrl(p), alt: '', class: 'tm-face' }),
          stat('Score', p.score.toLocaleString()),
          stat('Shots', p.shots.toLocaleString()),
          stat('Hits', p.hits.toLocaleString()),
          stat('Accuracy', `${accuracy(p)}%`),
          stat('Levels played', String(p.levelsPlayed)),
          stat('Longest streak', String(p.longStreak)),
          stat('Favourite weapon', favouriteWeapon(p)),
        ]),
        h('div', { class: 'tm-side tm-kills' }, [
          h('label', { class: 'tm-label', text: 'Kills' }),
          ...(kills.length ? kills : [h('p', { class: 'tm-empty', text: 'No fairies harmed yet.' })]),
        ]),
      ]),
    ]);
  }

  private hof(): HTMLElement {
    const rows = hallOfFame().map(([label, value]) => h('div', { class: 'tm-hof-row' }, [h('span', { text: label }), h('b', { text: value })]));
    return screen('Hall of Fame', 'Best on this device', () => this.menu.show('main'), [h('div', { class: 'tm-hof' }, rows)]);
  }

  // The original's "pop" message, as a banner that taps away.
  private toast(message: string): HTMLElement {
    const el = h('div', { class: 'tm-toast', role: 'alert', text: message });
    el.addEventListener('click', () => el.remove());
    return el;
  }
}

// A screen with a header (back button, title, subtitle) and a body.
function screen(title: string, subtitle: string, back: () => void, body: HTMLElement[]): HTMLElement {
  return h('div', { class: 'tm-screen' }, [
    h('header', { class: 'tm-head' }, [
      h('button', { class: 'tm-btn tm-back', text: '‹ Back', onClick: back }),
      h('div', { class: 'tm-heading' }, [h('h1', { text: title }), subtitle ? h('p', { text: subtitle }) : null]),
    ]),
    h('div', { class: 'tm-body' }, body),
  ]);
}

function button(text: string, onClick: () => void, cls = ''): HTMLButtonElement {
  return h('button', { class: `tm-btn ${cls}`.trim(), text, onClick });
}

function bigButton(text: string, sub: string, onClick: () => void): HTMLButtonElement {
  return h('button', { class: 'tm-btn tm-big', onClick }, [h('span', { text }), h('small', { text: sub })]);
}
