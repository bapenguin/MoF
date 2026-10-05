// Player options (the original's defaults.mof: sound, music, ambient, weather).
// Saved per browser; the Options screen arrives in Phase 5.

import { audio } from '../engine/audio';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Settings {
  sound: boolean; // master switch: off silences everything, as PlaySounds=0 did
  music: boolean;
  ambient: boolean;
  weather: boolean;
  shake: boolean; // screen shake on big hits (new)
  difficulty: Difficulty; // adventure difficulty (new)
  vibrate: boolean; // a buzz on kills, on phones that support it (new)
}

const KEY = 'mof.settings';
const DEFAULTS: Settings = { sound: true, music: true, ambient: true, weather: true, shake: true, difficulty: 'normal', vibrate: true };

// Adventure difficulty: fairy hit points, fairy speed and the level clock.
// Normal is the original game (with the boss rebalance).
export const DIFFICULTY: Record<Difficulty, { label: string; hp: number; speed: number; time: number }> = {
  easy: { label: 'Easy', hp: 0.6, speed: 0.85, time: 1.5 },
  normal: { label: 'Normal', hp: 1, speed: 1, time: 1 },
  hard: { label: 'Hard', hp: 1.4, speed: 1.15, time: 0.85 },
};

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings: Settings = load();

export function applySettings(): void {
  audio.setEnabled('sfx', settings.sound);
  audio.setEnabled('music', settings.sound && settings.music);
  audio.setEnabled('ambient', settings.sound && settings.ambient);
}

export function saveSettings(changes: Partial<Settings>): void {
  Object.assign(settings, changes);
  applySettings();
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable (private mode etc.): settings just won't persist
  }
}
