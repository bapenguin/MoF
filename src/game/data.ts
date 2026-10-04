// Types and loaders for the JSON produced by tools/convert-data.mjs.

export enum FairyClass {
  Fairy = 0, // the targets: bounce around, count towards clearing the level
  Walker = 1, // innocent, walks along the ground
  Sitter = 2, // innocent, sits still on the left edge (Screech Owl)
  Flyer = 3, // innocent, flies horizontally
}

export interface FairyDef {
  id: string;
  name: string;
  class: FairyClass;
  sprite: string;
  deathSprite: string;
  actSprite?: string;
  actSound?: string;
  actChance?: number; // rprob: chance per update, out of 1000, to start acting
  frames: number;
  hp: number;
  speed: number;
  intel: number; // chance per update, out of 100, to pick a new random direction
  worth: number;
  gift: number;
  dieSounds: string[];
}

export interface LevelDef {
  id: string;
  name: string;
  bg: string;
  music: string;
  timeLimit: number;
  next: string; // level id, or "end"
  ambient?: string;
  weather?: string;
  foreground?: string;
  spawns: Array<{ type: string; count: number }>;
}

export interface ScenarioDef {
  id: string;
  title: string;
  description: string;
  worth: number;
  start: string;
  ammo: Record<string, number>; // weapon number -> starting ammo
  levels: Record<string, LevelDef>;
  fairies: Record<string, FairyDef>;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  description: string;
  worth: number;
}

export { default as scenarioList } from '../../data/scenarios.json';

const scenarioFiles = import.meta.glob<ScenarioDef>('../../data/scenarios/*.json', { import: 'default' });

export function loadScenario(id: string): Promise<ScenarioDef> {
  const load = scenarioFiles[`../../data/scenarios/${id}.json`];
  if (!load) return Promise.reject(new Error(`unknown scenario ${id}`));
  return load();
}

// Innocent walkers/flyers have a second sprite row for facing left (makeinnocent).
export function spriteRows(f: FairyDef): number {
  return f.class === FairyClass.Walker || f.class === FairyClass.Flyer ? 2 : 1;
}
