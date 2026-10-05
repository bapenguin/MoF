# Massacre of the Fairies: Browser Port Plan

The original is a VB6 + DirectX 7 game (P&P Enterprises, v0.9.6, "2004"): a fullscreen 1024×768 shooting gallery. Fairies fly around, you click to shoot them, and you have 9 weapons, data-driven levels, weather, and per-user stats.

## 1. What's in the original

| File | Role | Port target |
|---|---|---|
| `modfairy.bas` (~1,800 lines) | All gameplay: fairies, weapons, scoring, splats, gifts, level loader, game loop, user profiles | `src/game/*`: the core of the port |
| `fmod.bas` | DirectDraw wrapper: sprite registry, `putpic` blits, color-key transparency, per-pixel hit test, background/foreground/top bar, rain/snow, text | `src/engine/renderer.ts`, `sprites.ts`, `weather.ts` |
| `DSound.bas` | DirectSound wrapper: load/play/loop/stop, stereo pan by x | `src/engine/audio.ts` (Web Audio) |
| `frmmain.frm` (`gamemain`) | Fullscreen game window: mouse down/up/move, keys 1–9, Q quit, **F1 cheat (all ammo = 1000)** | `src/engine/input.ts` |
| `test.frm` (`Form2`, startup) | Main menu, login/new user, stats viewer, Hall of Fame, options, adventure select (4 scenarios, unlocked progressively) | HTML/CSS overlay screens |
| `mmode.frm` | Massacre Mode builder: pick weapons + ammo, fairies + counts, background, foreground, music, weather, time; "Random Massacre" | HTML form → builds level config in memory |
| `wild.txt`, `des.txt`, `snow.txt`, `fland.txt` | 4 adventure scenarios (5–9 levels each) plus fairy definitions | `data/scenarios/*.json` |
| `mmode.txt` | Master fairy roster for Massacre mode (15 types) | `data/fairies.json` |
| `*.guy`, `defaults.mof` | User save files (weakly "hashed" password + stats), sound options | `localStorage` |
| `mmenu.Frm`, `hscore.Frm`, `joe.frm`, `main.frm` | Older VB4 leftovers, **not in `mof.vbp`** | Ignore |

**Assets:** 30 backgrounds (1024×768), 7 foregrounds (1024×150), about 90 sprite sheets, and 50 WAVs (7 music tracks). All images are 24-bit BMP with **black (0,0,0) as the transparency key**. Sprite sheets are horizontal strips (`fpic` defaults to 8 frames, set by `fcount`). "Innocent" walkers and flyers (class 1 and 3) have 2 rows, one per facing direction. That's what `makeinnocent` does.

### Gameplay rules to port faithfully
- **Fairy classes:** 0 = fairy (bounces, randomly re-steers based on `intel`), 1 = walker (ground, innocent), 2 = sitter (static, e.g. Screech Owl), 3 = flyer (horizontal, innocent). Killing innocents plays "dumbass.wav" and usually costs points (negative `worth`).
- **States:** ALIVE → ACTING (alt-anim `apic` for 1s, chance `rprob`/1000 per tick) → DYING (falls with gravity through the `dpic` frames) → DEAD. In Massacre mode, dead fairies respawn.
- **Weapons:** 1 Pistol (infinite, pixel-accurate), 2 Shotgun (blast r=70, 1.5s), 3 Machine Gun (hold to fire, pixel), 4 Howitzer (hold to fire, blast r=100), 5 Fairy Mines (chain-reacting proximity mines with knockback), 6 Death Bus (drives across the bottom), 7 Ion o' Death (vertical beam), 8 Piano Man (falls and splats), 9 Black Hole (gravity well, 8–13s).
- **Hit test:** pistol and machine gun do a per-pixel check against the current frame (non-black pixel = hit). Blast weapons use a radius and apply knockback.
- **Gifts:** killed fairies with `gift=N` drop ammo crates that fall. Shooting a crate collects it.
- **Scoring:** floating score sprites (25/50/100/200/500/1000/0), a rolling score counter, accuracy, rank = damage × accuracy%, and kill streaks.
- **Flow:** each level is timed. Clear all class-0 fairies to see a round summary (`roundinfo.bmp`), then load `next`. When time runs out you see a game-over screen. Finishing a scenario unlocks the next one (`worth` → `guy.scenario`).

## 2. Bugs and quirks found (fix or preserve?)

1. **`des.txt` uses `foreground=`** but the parser reads `fground`, so the desert foregrounds never drew. Fix in the JSON conversion.
2. **Gift pickup has no lower-bound check** (`x - loc.x < size` only), so any click above or left of a falling crate collects it. Fix.
3. **Stereo panning is broken.** `pan > 512 And pan < 0` can never be true, so sounds never pan right. Fix with a proper `StereoPannerNode`.
4. **Snow is invisible.** `dosnow` never moves flakes down, and its draw call is commented out. Implement it properly.
5. **Stats screen mislabels weapons 3 and 4** (calls #3 Howitzer, but #3 is the Machine Gun). Fix.
6. **Frame-rate-dependent physics.** Velocity damping `*0.9`, splat movement, mine/piano animation and other per-loop logic all ran in an uncapped busy loop. Port with a **fixed 60 Hz sim step** and tune to feel right.
7. The `size=` key in fairy data is ignored, because size comes from the sprite height. Keep that behavior.
8. Profile "password hash" is a trivial character shift. Drop passwords and use local profiles (see §4).
9. **`fland.txt` stairway level spawns `blue`**, but that scenario never defines `blue`, so those fairies never appeared. **Fixed:** `tools/convert-data.mjs` (`PATCHES`) adds the `blue` definition from `wild.txt`.
10. **The Wilderness boss was unbeatable** (Afrocan Queen: 1000 HP, 40 s, pistol only). **Rebalanced to 100 HP** in `PATCHES`: simulated players kill her in ~17 s (frantic), ~29 s (steady), ~40 s (casual); a real-time bot test at 5 shots/s took 29.3 s. The Massacre roster keeps 1000 HP, since you choose your own weapons there.

## 3. Tech approach

- **TypeScript + Vite**, plain **Canvas 2D** (no engine). The game is simple blits, and a 1:1 port of `putpic`/`BltFast` stays closest to the original. Phaser would be overkill and would fight the original's structure.
- **Fixed 1024×768 logical canvas**, CSS-scaled to fit the window (letterboxed). Pointer coordinates are mapped back to logical space. Fullscreen button via the Fullscreen API.
- **Game loop:** `requestAnimationFrame` with a fixed-timestep accumulator. The VB code's blocking waits (`waitforclick`, `ScoreAndWait`, `DoEvents` loops) become an explicit **state machine**: `Menu → Profile → ScenarioSelect | MassacreSetup → Playing → RoundSummary → … → Victory | GameOver`.
- **Audio:** Web Audio API, all SFX decoded up front per level, music and ambient loops, pan from x. Audio unlocks on the first user click (browser autoplay rules).
- **Hit masks:** at load, read each sprite sheet's alpha into a `Uint8Array` so per-pixel hit tests stay cheap.
- **UI screens** (menus, Massacre builder, stats) are HTML/CSS overlays styled after the original art (`bforrest.bmp` backdrop, `woodback.bmp`, `mofhof.bmp`, and so on). The in-game HUD is drawn on the canvas at the original `DoText` positions.

## 4. Data and saves

- **Asset pipeline script** (`tools/convert-assets.mjs`, using `sharp` plus `ffmpeg`). Every file gets a lowercase, URL-safe key (`SPLAT!.wav` → `splat`, `city number 2.bmp` → `city-number-2`), and the data converter uses the same keys:
  - (`sharp` can't read BMP, so `tools/lib/bmp.mjs` decodes them.) Sprite and foreground BMPs → PNG with black keyed to alpha (exact `#000000` only, matching DirectDraw color-key behavior).
  - Background BMPs → WebP/JPEG. That's about 70 MB → about 3 MB.
  - WAV → MP3 (one format every browser decodes). All 51 sounds come to about 6 MB. MP3 adds a tiny gap on loops, so music/rain loops may need trimming later.
  - `intro.avi` (38 MB) → optional MP4 intro, or drop it.
  - Scenario `.txt` → JSON (one-time conversion script that reuses the original `<tag>` / `key=value` grammar).
- **Profiles:** `localStorage` keyed by name, same fields as `userinfo` (score, shots, hits, streak, levels, scenario unlocked, weapon usage, kills per fairy type). Hall of Fame scans all local profiles, as `GetHigh` did. Optional: a one-time importer for the old `.guy` files.
- **Later / optional:** an online leaderboard (Cloudflare Worker / Supabase). It's not needed for v1.

## 5. Proposed repo layout

```
/legacy/              original VB source + data files (read-only reference)
/tools/               asset + data conversion scripts
/public/assets/       converted PNG/WebP/OGG (committed, small)
/src/engine/          loop, renderer, sprites, audio, input, weather
/src/game/            fairies, weapons, level, scoring, gifts, splats, profiles
/src/ui/              menu, profile, scenario select, massacre builder, stats, HoF, options
/data/                scenarios/*.json, fairies.json, weapons.json
```

`.gitignore`: `MoF.exe`, `MoF.pdb`, `crash.log` (566 KB), `*.guy` (personal stats + password hashes), `pspbrwse.jbf`, `win32.tlb`, `*.lnk`, `node_modules`, `dist`.
The raw BMP/WAV/AVI originals total about 180 MB. Either keep them out of git (convert locally) or put them under **Git LFS** in `/legacy/raw`.

## 6. Phases

| # | Milestone | Done when |
|---|---|---|
| 0 | Repo scaffold, Vite + TS, asset + data conversion scripts | `npm run assets` produces PNG/WebP/MP3 + JSON. CI build via Actions |
| 1 | Engine: scaled canvas, sprite sheets, loader, input, audio, fixed-step loop | A background + one animated fairy + click sound |
| 2 | Core gameplay: all 4 fairy classes, states, pistol/shotgun/MG/howitzer, splats/gore, score popups, HUD/top bar, timer, level → next | `wild.txt` fully playable start to finish |
| 3 | Special weapons: mines (chain), bus, ion, piano, black hole, and gifts/ammo drops | All 9 weapons + F1 cheat work |
| 4 | Atmosphere: foregrounds, rain, (fixed) snow, ambient sounds, music per level | All 4 scenarios look and sound right |
| 5 | Screens: main menu, profiles, scenario select w/ unlocks, round summary, win/lose, stats, Hall of Fame, options | Full adventure loop with persistence |
| 6 | Massacre Mode builder incl. Random Massacre | Custom games launch and respawn correctly |
| 7 | Polish: pause/Esc, fullscreen, loading screen, touch support (tap = shoot, weapon bar), performance pass | Plays well on desktop + tablet |

Phases 0–2 are the bulk of the risk. Everything after that is additive.

### Hosting
GitHub Pages isn't available on this account, so the game is built as a static site with relative paths (`base: './'`) for upload to any web server, in any folder. The CI workflow builds on every push and publishes the `dist/` folder as a downloadable `mof-web` artifact.

### Status
- **Phase 7: done.** Pause (Esc/P, tapping the HUD bar, or automatically when the tab is hidden) freezes a per-game clock and suspends audio; pause panel with Resume / Quit. Touch play without a keyboard: tapping the HUD weapon box cycles weapons with ammo, tapping elsewhere on the bar pauses (fairies never go above the bar, so no shots are lost). Audio unlocks inside the first tap/click/key for iOS. Fullscreen via F or a corner button; rotate-your-phone prompt in portrait; no pinch-zoom or long-press menus. Performance: images pre-decoded and fairy hit masks built during loading; a 200-fairy snowstorm massacre with every special weapon active costs ~0.4 ms update + ~1 ms draw per frame.
- **Phase 6: done.** `src/scenes/massacre.ts` rebuilds mmode.frm with its original layout and captions: arsenal checkboxes and ammo boxes (typing ammo ticks the weapon), fairy roster from `data/fairies.json`, "Fairies Ready to Die" (15 types / 200 fairies max), locale, foreground, music, weather, time limit, GO, Random Massacre, Reset All, QUIT. GO builds the custom scenario in memory (the original wrote `massacre.mof`). Fairies respawn; the game ends on time with the `win.bmp` card and returns to the builder with settings kept (also saved in `localStorage`). Massacre games add weapon/fairy/streak stats to the profile but not score/levels, as in the original. Changes: fairies listed by name rather than data id; repeated batches of the same fairy merge; Random Massacre starts from a clean slate; ticking a weapon with no ammo typed gives it 50; GO needs at least one fairy.
- **Phase 5: done.** `src/scenes/menu.ts` rebuilds the original front end (test.frm) as HTML panels over the canvas, using art extracted from `test.frx` by `npm run assets`: main menu, login, "Fairy Adventures" scenario select (with progressive unlocks), Options, User Stats card, MoF HoF and the quit screen; menu music. `src/game/profiles.ts` stores players in `localStorage` (no passwords); the play scene records stats per level as the original's `userstats`/`writeguy` did, without its double-counted score. Changes: locked scenarios are shown dimmed with a hint (the original hid them); the HoF fills all five categories (the original left two blank) and Best Shot needs 50+ shots; players named Nick, Dave or Bozo get the developers' face photos, as in the original.
- **Phase 4: done.** `src/game/weather.ts`: rain (501 dark-blue streaks with the looping rain sound) and snow that actually works (the original never moved or drew its flakes; this uses its intended 3×3 flakes, 5–9 px/update fall and side-to-side sway, drawn white with a soft outline so they show against snowy backgrounds). `src/game/settings.ts`: sound/music/ambient/weather options saved in `localStorage` (UI in Phase 5). Swept all 30 levels in all four scenarios: every asset loads, every level builds, simulates and draws. Desert levels `desertplain`/`Airport1` now show the foregrounds the original never drew.
- **Phase 3: done.** All five specials ported into `world.ts`: Fairy Mines (proximity trigger, 500 px knockback, 300 px kill radius, chain reactions), Death Bus, Ion o' Death, Piano Man, Black Hole (8–13 s gravity well). Gift types 4/5 (mine and bus ammo) now useful. Deliberate changes: firing a bus/ion/piano while one is already active no longer wastes ammo; the ion beam and piano are centred on the cursor (the original put their left edge there). Special-weapon animations run per update as in the original, so mine explosions (~0.13 s) and the piano wreck (~0.07 s) are brief; easy to slow down if they feel too quick.
- **Phase 2: done.** `src/game/world.ts` ports the fairy simulation (all 4 classes, act/dying states, intel turning, knockback damping, Massacre respawn), `Shot`/`KillFairy` for pistol, shotgun, machine gun and howitzer, gore splats, score pop-ups, ammo-crate gifts (pulled forward from Phase 3), level music/ambient/beach ocean loop and foregrounds. `src/scenes/play.ts` is the level flow: timer, HUD, round-summary card, victory (`win2`), game over (`endgame`), Q to quit, F1 cheat. A temporary `devmenu.ts` lists all 4 scenarios until the real menus. Bot-played through all of `des` and `wild` (incl. the boss with F1 + machine gun). Deliberate changes: hit test uses the visible frame and width; streaks count for every weapon; summary shows the next level's name instead of its id; gift pickup bounds fixed.
- **Notes from playtesting:** the Wilderness boss was unbeatable with the pistol (since rebalanced, see §2 item 10). The original also shows the same "Scenario 1 Complete" card (`win2.bmp`) after every scenario.
- **Phase 1: done.** `src/engine/`: `Engine` (fixed 60 Hz step + scene manager, sim clock replaces `GetTickCount`), `SpriteSheet` (frame grid, `putpic`-style draw, lazy per-pixel hit masks using the *current* frame, which fixes the VB frame-0 bug), `audio` (Web Audio, one voice per key like DirectSound buffers, working stereo pan, music/sfx/ambient channels, preload before unlock), `Input` (pointer + keys in logical coords, queued per step), `drawText`/`str` (HUD text à la `DoText`/`Str$`). `src/scenes/`: loading screen (progress + click-to-start audio unlock) and an engine sandbox with all four fairy classes.
- **Phase 0: done.** Scaffold, `npm run assets` (181 files, ~180 MB → 16.5 MB), `npm run data` (4 scenarios + Massacre roster → `data/`), CI workflow, smoke-test page (scaled canvas, background, keyed animated sprite, panned shot sound).

## 7. Before publishing publicly

- Make sure you have rights to the **music and SFX** (`music1–7.wav`, sound clips). Swap in CC0 audio if unsure.
- Some fairy names and internal IDs are crude. Decide whether to keep them as-is for a public repo.
- About a dozen assets look unused (e.g. `BIGfart.wav`, `hmmfart.wav`, `hell.wav`, `fairy5.bmp`, `minime.bmp`, `usstats.bmp`). The conversion script can report and skip unreferenced files.
