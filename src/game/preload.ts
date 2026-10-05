// Load tasks for a whole scenario, so level transitions don't stall (the
// original reloaded every sprite between levels behind a "Loading sprite" message).

import { loadSheet } from '../engine/sprites';
import { audio } from '../engine/audio';
import type { ScenarioDef } from './data';
import { GIFTS, WEAPONS } from './weapons';
import { scenarioSprites } from './world';

type Task = () => Promise<unknown>;

const COMMON_SPRITES: Array<[string, number, number]> = [
  ['topbar', 1, 1],
  ['roundinfo', 1, 1],
  ['endgame', 1, 1],
  ['win', 1, 1],
  ['win2', 1, 1],
  ['splat', 4, 1],
  ['gore', 16, 1],
  ['fmine', 8, 1],
  ['fmined1', 8, 1],
  ['bhole', 4, 1],
  ['ion', 9, 1],
  ['piano', 2, 1],
  ['p1d1', 4, 1],
  ['busanim', 2, 1],
  ...['0', '25', '50', '100', '200', '500', '1000'].map((k): [string, number, number] => [k, 8, 1]),
  ...WEAPONS.map((w): [string, number, number] => [w.icon, 1, 1]),
  ...Object.values(GIFTS).map((g): [string, number, number] => [g.sprite, 1, 1]),
];

const COMMON_SOUNDS = [
  'switch',
  'dumbass',
  'yoink',
  'win',
  'die',
  'ocean',
  'rain',
  'thunder',
  'arm',
  'boom',
  'bus',
  'splat',
  'ionzap',
  'pfall',
  'pianobang',
  ...WEAPONS.flatMap((w) => (w.sound ? [w.sound] : []))];

export function scenarioTasks(scenario: ScenarioDef): Task[] {
  const sprites = new Map<string, [number, number]>();
  for (const [key, fx, fy] of [...COMMON_SPRITES, ...scenarioSprites(scenario)]) {
    if (!sprites.has(key)) sprites.set(key, [fx, fy]);
  }

  const sounds = new Set(COMMON_SOUNDS);
  const backgrounds = new Set<string>();
  const foregrounds = new Set<string>();
  for (const f of Object.values(scenario.fairies)) f.dieSounds.forEach((s) => sounds.add(s));
  for (const l of Object.values(scenario.levels)) {
    backgrounds.add(l.bg);
    if (l.foreground) foregrounds.add(l.foreground);
    if (l.music) sounds.add(l.music);
    if (l.ambient) sounds.add(l.ambient);
  }

  // Sprites that get pixel-tested when shot: build their hit masks while loading.
  const shootable = new Set(Object.values(scenario.fairies).flatMap((f) => [f.sprite, f.actSprite ?? '']));

  return [
    ...[...sprites].map(([key, [fx, fy]]) => () =>
      loadSheet(key, fx, fy).then((s) => (shootable.has(key) ? s.warmMask() : s)),
    ),
    () => loadSheet('wood', 1, 1, 'ui'), // victory card background
    ...[...backgrounds].map((key) => () => loadSheet(key, 1, 1, 'bg')),
    ...[...foregrounds].map((key) => () => loadSheet(key, 1, 1, 'fg')),
    ...[...sounds].map((key) => () => audio.load(key)),
  ];
}
