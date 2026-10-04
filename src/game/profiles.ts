// Player profiles: the original's per-user .guy files (modfairy.bas userinfo,
// NewGuy/LoadGuy/writeguy), kept in localStorage. The original's passwords were
// a trivial character shift, so profiles here are just names.

import { WEAPONS } from './weapons';

export interface Profile {
  name: string;
  score: number;
  shots: number;
  hits: number;
  longStreak: number;
  levelsPlayed: number;
  levelsCompleted: number; // new: the original's HoF had this category but never filled it
  scenario: number; // highest scenario "worth" beaten: unlocks scenario index 0..scenario
  weaponShots: number[]; // index = weapon number (1-9)
  kills: Record<string, number>; // per fairy name
}

const KEY = 'mof.profiles';
const LAST_KEY = 'mof.lastPlayer';
const MAX_NAME = 20;

function readAll(): Record<string, Profile> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Profile>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage unavailable: progress just won't persist
  }
}

const keyOf = (name: string) => name.trim().toLowerCase();

export function listProfiles(): Profile[] {
  return Object.values(readAll()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getProfile(name: string): Profile | null {
  const p = readAll()[keyOf(name)];
  return p ? { ...blank(p.name), ...p } : null;
}

function blank(name: string): Profile {
  return {
    name,
    score: 0,
    shots: 0,
    hits: 0,
    longStreak: 0,
    levelsPlayed: 0,
    levelsCompleted: 0,
    scenario: 0,
    weaponShots: new Array(WEAPONS.length + 1).fill(0),
    kills: {},
  };
}

// NewGuy: returns the new profile, or the message the original showed.
export function createProfile(rawName: string): Profile | string {
  const name = rawName.trim();
  if (!name) return 'Please enter the name you would like to use.';
  if (name.length > MAX_NAME) return `Names can be up to ${MAX_NAME} characters.`;
  const all = readAll();
  if (all[keyOf(name)]) return 'That guy already exists.';
  const p = blank(name);
  all[keyOf(name)] = p;
  writeAll(all);
  return p;
}

export function saveProfile(p: Profile): void {
  const all = readAll();
  all[keyOf(p.name)] = p;
  writeAll(all);
}

export function lastPlayer(): string {
  try {
    return localStorage.getItem(LAST_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setLastPlayer(name: string): void {
  try {
    localStorage.setItem(LAST_KEY, name);
  } catch {
    // ignore
  }
}

export function totalKills(p: Profile): number {
  return Object.values(p.kills).reduce((a, b) => a + b, 0);
}

export function favouriteWeapon(p: Profile): string {
  let best = 0;
  for (let n = 1; n < p.weaponShots.length; n++) if (p.weaponShots[n] > (p.weaponShots[best] ?? 0)) best = n;
  return best ? WEAPONS[best - 1].name : 'No Favorite';
}

export function accuracy(p: Profile): number {
  return p.shots ? Math.floor((100 * p.hits) / p.shots) : 0;
}
