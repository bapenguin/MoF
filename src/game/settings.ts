// Player options (the original's defaults.mof: sound, music, ambient, weather).
// Saved per browser; the Options screen arrives in Phase 5.

import { audio } from '../engine/audio';

export interface Settings {
  sound: boolean; // master switch: off silences everything, as PlaySounds=0 did
  music: boolean;
  ambient: boolean;
  weather: boolean;
}

const KEY = 'mof.settings';
const DEFAULTS: Settings = { sound: true, music: true, ambient: true, weather: true };

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
