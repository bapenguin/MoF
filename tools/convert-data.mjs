// Converts the original scenario text files (legacy/*.txt) into JSON under data/.
//
// The original format is a loose tag/key-value file:
//   <scenario> weapon1=999 start=beach worth=2 </scenario>
//   <levels> <beach> name=... bgpic=... white=9 next=volcano </beach> </levels>
//   <fairies> <white> name=Snow White fpic=fairy1.bmp ... </white> </fairies>
// Inside a level, any key that isn't a known level property is a fairy type id
// with a spawn count (that's how LoadLevel in modfairy.bas reads it).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetKey } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = path.join(root, 'legacy');
const outDir = path.join(root, 'data');

// Adventure scenarios in menu order (levpic index 0..3 in test.frm). Titles and
// blurbs come from the level-select captions stored in test.frx.
const SCENARIOS = [
  {
    id: 'wild',
    file: 'wild.txt',
    title: 'Into The Wilderness',
    description:
      'While lying in bed next to your beautiful girlfriend Boof, you suddenly are awakened by a loud buzzing sound. Boof is gone, and Fairies are everywhere, you set out and follow her screams.',
  },
  {
    id: 'des',
    file: 'des.txt',
    title: 'The Desert after Dinner',
    description:
      "After the storm you find yourself stranded on a beach. Ahead you see a volcanic Island. You decide to see what's ahead, but wait, the fairies have followed you here too...",
  },
  {
    id: 'snow',
    file: 'snow.txt',
    title: 'Barren BURR!',
    description:
      'After your crash landing you find yourself against a frozen tundra. It seems to go on forever, nothing seems to live. But wait, the fairies followed you here too....DIE FAIRIES!',
  },
  {
    id: 'fland',
    file: 'fland.txt',
    title: 'Da Fairy Kingdom',
    description:
      "You find yourself climbing a stairway into the clouds, ascending further and further, finally you realize you are heading right into the heart of the fairy kingdom. GO GET EM'",
  },
];

const LEVEL_KEYS = new Set(['name', 'bgpic', 'timelimit', 'fground', 'foreground', 'sngname', 'ambient', 'weather', 'next']);

// Splits a file into nested sections keyed by tag name. Each section keeps its
// key=value lines and its child sections, in order.
function parseSections(text) {
  const rootNode = { tag: '#root', props: [], children: [] };
  const stack = [rootNode];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const tag = line.match(/^<(\/?)([^>]+)>$/);
    if (tag) {
      const [, closing, name] = tag;
      if (closing) {
        while (stack.length > 1 && stack.pop().tag !== name);
      } else {
        const node = { tag: name, props: [], children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      }
      continue;
    }
    const eq = line.indexOf('=');
    if (eq > 0) stack[stack.length - 1].props.push([line.slice(0, eq).trim(), line.slice(eq + 1).trim()]);
  }
  return rootNode;
}

const child = (node, tag) => node.children.find((c) => c.tag === tag);
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const sound = (v) => (v ? assetKey(v) : undefined);

function convertScenarioBlock(node) {
  const out = { start: '', worth: 0, ammo: {} };
  for (const [k, v] of node?.props ?? []) {
    if (k === 'start') out.start = v;
    else if (k === 'worth') out.worth = num(v);
    else if (/^weapon\d$/.test(k)) out.ammo[k.slice(6)] = num(v);
  }
  return out;
}

function convertLevel(node) {
  const level = { id: node.tag, name: '', bg: '', music: '', timeLimit: 0, next: 'end', spawns: [] };
  for (const [k, v] of node.props) {
    switch (k) {
      case 'name': level.name = v; break;
      case 'bgpic': level.bg = assetKey(v); break;
      case 'sngname': level.music = assetKey(v); break;
      case 'timelimit': level.timeLimit = num(v); break;
      case 'ambient': level.ambient = sound(v); break;
      case 'weather': level.weather = v; break;
      case 'next': level.next = v; break;
      // des.txt wrote "foreground=" but the VB loader only understood "fground",
      // so those foregrounds never drew. Accept both.
      case 'fground':
      case 'foreground':
        level.foreground = assetKey(v);
        break;
      default:
        if (!LEVEL_KEYS.has(k)) level.spawns.push({ type: k, count: num(v) });
    }
  }
  return level;
}

function convertFairy(node) {
  const f = {
    id: node.tag,
    name: '',
    class: 0,
    sprite: '',
    deathSprite: '',
    frames: 8,
    hp: 1,
    speed: 0,
    intel: 0,
    worth: 0,
    gift: 0,
    dieSounds: [],
  };
  let die1, die2;
  for (const [k, v] of node.props) {
    switch (k) {
      case 'name': f.name = v; break;
      case 'class': f.class = num(v); break;
      case 'fpic': f.sprite = assetKey(v); break;
      case 'dpic': f.deathSprite = assetKey(v); break;
      case 'apic': f.actSprite = assetKey(v); break;
      case 'asound': f.actSound = sound(v); break;
      case 'rprob': f.actChance = num(v); break;
      case 'fcount': f.frames = num(v); break;
      // No hp key meant maxhp = 0 in VB, which dies to any hit; 1 behaves the same.
      case 'hp': f.hp = Math.max(1, num(v)); break;
      case 'speed': f.speed = num(v); break;
      case 'intel': f.intel = num(v); break;
      case 'worth': f.worth = num(v); break;
      case 'gift': f.gift = num(v); break;
      case 'fdie1': die1 = sound(v); break;
      case 'fdie2': die2 = sound(v); break;
      // "size" was present in the data but ignored by the game (size came from
      // the sprite height), so it's intentionally dropped here.
    }
  }
  f.dieSounds = [die1, die2].filter(Boolean);
  return f;
}

function convertFile(file) {
  const tree = parseSections(fs.readFileSync(path.join(legacy, file), 'latin1'));
  const levels = (child(tree, 'levels')?.children ?? []).map(convertLevel);
  const fairies = (child(tree, 'fairies')?.children ?? []).map(convertFairy);
  return { scenario: convertScenarioBlock(child(tree, 'scenario')), levels, fairies };
}

// Softened names for a modern audience. Keyed by the original fairy id; `id`
// renames the internal id too (used in level spawns and Massacre setups).
// data/renames.json records old -> new so saved profiles and setups migrate.
const RENAMES = {
  blue: { name: "'Lil Rascal" }, // was 'Lil Bastard
  blue2: { name: "'Lil Brat" }, // was 'Lil Bitch
  afrofairy: { id: 'queen', name: 'The Fairy Queen' }, // was The Afrocan Queen
  fatboy: { id: 'jimmy', name: 'Jimmy and his Dog' }, // was Fat Jimmy and his Dog
  gimp: { id: 'scruffy', name: 'Scruffy the Cat' }, // was The Gimp Cat
  bikini: { name: 'Bikini Fairy' }, // was Bikini Babe
  cavebitch: { id: 'uglet' }, // name was already "Uglet"
};
const renamedIds = {};
const renamedNames = {};

function applyRenames(fairies, levels = []) {
  const out = {};
  for (const f of Object.values(fairies)) {
    const r = RENAMES[f.id];
    if (r?.id) renamedIds[f.id] = r.id;
    if (r?.name && r.name !== f.name) renamedNames[f.name] = r.name;
    const id = r?.id ?? f.id;
    out[id] = { ...f, id, name: r?.name ?? f.name };
  }
  for (const l of levels) for (const s of l.spawns) s.type = RENAMES[s.type]?.id ?? s.type;
  return out;
}

// Balance and bug-fix patches applied on top of the original data. The legacy
// .txt files stay as they were; everything that differs from them is here.
const PATCHES = {
  wild(json) {
    // The Fairy Queen had 1000 HP with 40 s on the clock, and this scenario
    // only gives you the pistol (1 damage a shot): effectively unbeatable.
    // Simulated players at 100 HP: ~17 s frantic, ~29 s steady, ~40 s casual.
    json.fairies.queen.hp = 100;
  },
  fland(json, converted) {
    // The "stairway" level spawns two "blue" fairies, but fland.txt never
    // defined them, so the original silently skipped them. Use the definition
    // from the Wilderness ('Lil Rascal: fast, worth 1000).
    json.fairies.blue ??= structuredClone(converted.wild.fairies.blue);
  },
};

function check(label, json) {
  const fairyIds = new Set(Object.keys(json.fairies));
  const levelIds = new Set(Object.keys(json.levels));
  for (const l of Object.values(json.levels)) {
    for (const s of l.spawns) if (!fairyIds.has(s.type)) console.warn(`  ${label}/${l.id}: unknown fairy "${s.type}"`);
    if (l.next !== 'end' && !levelIds.has(l.next)) console.warn(`  ${label}/${l.id}: next level "${l.next}" missing`);
  }
}

fs.mkdirSync(path.join(outDir, 'scenarios'), { recursive: true });

const index = [];
const converted = {};
for (const meta of SCENARIOS) {
  const { scenario, levels, fairies } = convertFile(meta.file);
  const json = {
    id: meta.id,
    title: meta.title,
    description: meta.description,
    worth: scenario.worth,
    start: scenario.start,
    ammo: scenario.ammo,
    levels: Object.fromEntries(levels.map((l) => [l.id, l])),
    fairies: applyRenames(fairies, levels),
  };
  PATCHES[meta.id]?.(json, converted);
  check(meta.id, json);
  converted[meta.id] = json;
  fs.writeFileSync(path.join(outDir, 'scenarios', `${meta.id}.json`), JSON.stringify(json, null, 2) + '\n');
  index.push({ id: meta.id, title: meta.title, description: meta.description, worth: scenario.worth });
  console.log(`scenario ${meta.id}: ${levels.length} levels, ${fairies.length} fairy types`);
}
fs.writeFileSync(path.join(outDir, 'scenarios.json'), JSON.stringify(index, null, 2) + '\n');

// Massacre Mode roster (mmode.txt only has a <fairies> block).
const roster = applyRenames(convertFile('mmode.txt').fairies);
fs.writeFileSync(path.join(outDir, 'fairies.json'), JSON.stringify(roster, null, 2) + '\n');
console.log(`massacre roster: ${Object.keys(roster).length} fairy types`);

fs.writeFileSync(
  path.join(outDir, 'renames.json'),
  JSON.stringify({ ids: renamedIds, names: renamedNames }, null, 2) + '\n',
);
