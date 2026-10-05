// Shareable Massacre setups (new). A setup fits in a readable link:
//
//   https://example.com/mof/#massacre?f=white:25,scruffy:2&w=2:50,3:300&bg=storm&fg=fore1&mu=music3&wx=rain&t=20
//
//   f   fairies, id:count          w   extra weapons, number:ammo (the pistol always comes)
//   bg  locale    fg  foreground   mu  music    wx  weather (rain/snow)    t  seconds
//
// Opening a link loads the setup into the Massacre builder. Everything is
// checked against the real roster and assets, so a mangled link can't break anything.

import { getManifest } from '../engine/assets';
import type { FairyDef } from './data';
import roster from '../../data/fairies.json';
import renames from '../../data/renames.json';

export type Weather = 'none' | 'rain' | 'snow';

export interface MassacreSetup {
  ammo: Record<number, number | null>; // weapon 2-9 -> ammo, null = not selected
  fairies: Array<{ id: string; count: number }>;
  bg: string;
  fg: string; // '' = none
  music: string;
  weather: Weather;
  time: number;
}

export const FAIRIES = roster as Record<string, FairyDef>;
export const MAX_TYPES = 15; // MAXFTYPES
export const MAX_FAIRIES = 200; // MAXFAIRIES
export const MAX_AMMO = 9999;
export const MAX_TIME = 999;
const PREFIX = '#massacre?';

export function blankSetup(): MassacreSetup {
  return { ammo: {}, fairies: [], bg: '', fg: '', music: '', weather: 'none', time: 30 };
}

export function setupLink(s: MassacreSetup): string {
  const params = new URLSearchParams();
  params.set('f', s.fairies.map((f) => `${f.id}:${f.count}`).join(','));
  const weapons = Object.entries(s.ammo).filter(([, n]) => n);
  if (weapons.length) params.set('w', weapons.map(([num, n]) => `${num}:${n}`).join(','));
  if (s.bg) params.set('bg', s.bg);
  if (s.fg) params.set('fg', s.fg);
  if (s.music) params.set('mu', s.music);
  if (s.weather !== 'none') params.set('wx', s.weather);
  params.set('t', String(s.time));
  // Commas and colons read better unescaped, and are safe in a URL fragment.
  const query = params.toString().replace(/%2C/g, ',').replace(/%3A/g, ':');
  return `${location.origin}${location.pathname}${PREFIX}${query}`;
}

export function isSetupHash(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

// Reads a setup from the current URL (if there is one) and removes it from the
// address bar, so a reload doesn't load it again.
export function takeSharedSetup(): MassacreSetup | null {
  if (!isSetupHash(location.hash)) return null;
  const setup = parseSetup(location.hash.slice(PREFIX.length));
  history.replaceState(null, '', location.pathname + location.search);
  return setup;
}

export function parseSetup(query: string): MassacreSetup | null {
  const params = new URLSearchParams(query);
  const m = getManifest();
  const ids = renames.ids as Record<string, string>;
  const s = blankSetup();
  const int = (v: string | undefined, min: number, max: number) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= min ? Math.min(n, max) : null;
  };

  let total = 0;
  for (const pair of (params.get('f') ?? '').split(',')) {
    const [rawId, rawCount] = pair.split(':');
    const id = ids[rawId] ?? rawId;
    const count = int(rawCount, 1, MAX_FAIRIES);
    if (!FAIRIES[id] || !count) continue;
    const n = Math.min(count, MAX_FAIRIES - total);
    if (n <= 0) break;
    const existing = s.fairies.find((f) => f.id === id);
    if (existing) existing.count += n;
    else if (s.fairies.length < MAX_TYPES) s.fairies.push({ id, count: n });
    else continue;
    total += n;
  }
  if (!s.fairies.length) return null;

  for (const pair of (params.get('w') ?? '').split(',')) {
    const [rawNum, rawAmmo] = pair.split(':');
    const num = Number(rawNum);
    const ammo = int(rawAmmo, 1, MAX_AMMO);
    // Weapons 2-9 only (the pistol always comes); anything else is ignored, not clamped.
    if (Number.isInteger(num) && num >= 2 && num <= 9 && ammo) s.ammo[num] = ammo;
  }

  const bg = params.get('bg') ?? '';
  const fg = params.get('fg') ?? '';
  const music = params.get('mu') ?? '';
  const weather = params.get('wx');
  if (m.bg[bg]) s.bg = bg;
  if (m.fg[fg]) s.fg = fg;
  if (/^music\d+$/.test(music) && m.sfx[music]) s.music = music;
  if (weather === 'rain' || weather === 'snow') s.weather = weather;
  s.time = int(params.get('t') ?? undefined, 1, MAX_TIME) ?? 30;
  return s;
}
