# Massacre of the Fairies: project memory

Browser port (TypeScript + Vite + Canvas 2D + Web Audio) of a 2004 VB6/DirectX 7 game by
P&P Enterprises (the repo owner's own game). All seven port phases are done, plus a
modernization pass. **Live:** https://bapenguin.github.io/MoF/ (deployed from `main`).

- `README.md`: controls, running, deploying.
- `PLAN.md`: original port plan, the bugs found in the VB code, and a status log of
  every phase. It's the history; this file is the working guide.

## Setting up on a new computer

1. Install **Git** and **Node.js 24 LTS**. (On Windows: `winget install Git.Git OpenJS.NodeJS.LTS`.)
   **ffmpeg** is only needed to re-convert sounds (`winget install Gyan.FFmpeg`).
2. `git clone https://github.com/bapenguin/MoF.git` then `npm install`.
3. `npm run dev` → http://localhost:5173. `npm run build` → `dist/`.

**The raw original media is NOT in git** (~180 MB of BMP/WAV/AVI under `legacy/`, gitignored).
The converted, web-ready versions in `public/assets/` and `public/icons/` *are* committed, so
playing, building and deploying all work from a fresh clone. Only `npm run assets` (re-converting
art/sound, regenerating icons) needs the raw files: copy `legacy/BG`, `legacy/fg`, `legacy/Sprites`,
`legacy/sfx` and the root-level `legacy/*.bmp` over from the original machine (`D:\Development\Fairy\legacy`).
`npm run data` works without them (the scenario `.txt` files are committed).

`npm run upscale` (2x art for phones, see `MOBILE_PLAN.md`) also needs the raw files, plus the
Real-ESRGAN Windows build (`realesrgan-ncnn-vulkan-20220424-windows.zip` from the
xinntao/Real-ESRGAN GitHub releases) unzipped to `tools/bin/realesrgan/` (gitignored). Output is
staged in `upscaled/` (gitignored); review it at `/tools/upscale-review.html` on the dev server.

## Layout

| Path | What |
|---|---|
| `src/engine/` | Engine: fixed 60 Hz loop + scene manager (`engine.ts`), sprite sheets with per-pixel hit masks (`sprites.ts`), Web Audio (`audio.ts`), pointer/keys (`input.ts`), letterbox scaling (`screen.ts`), asset manifest (`assets.ts`), HUD text (`text.ts`) |
| `src/game/world.ts` | The gameplay simulation, ported from `legacy/modfairy.bas`: fairies, shooting, all 9 weapons, gore, gifts, score, streaks, shake, interpolation. `Session` = state across levels |
| `src/game/` (rest) | `data.ts` scenario types/loaders, `weapons.ts`, `weather.ts` (rain/snow/lightning), `profiles.ts` (localStorage players + stars), `settings.ts` (options + `DIFFICULTY`), `share.ts` (Massacre share links), `victory.ts` (end cards), `preload.ts` |
| `src/scenes/` | `menu.ts` (main menu, login, scenario + level select, options, stats, Hall of Fame, quit), `play.ts` (level flow, HUD, pause, summary/stars, game over/retry), `massacre.ts` (Massacre builder), `loading.ts` |
| `src/ui/dom.ts` | `h()` helper for the HTML menu overlay (`#ui`), laid out in logical 1024×768 px |
| `data/` | Generated JSON (scenarios, Massacre roster, `renames.json`). **Don't hand-edit**: change `tools/convert-data.mjs` and run `npm run data` |
| `tools/` | `upscale-assets.mjs` (defringe + Real-ESRGAN x4plus → 2x art in `upscaled/`) + `upscale-review.html`, `convert-assets.mjs` (BMP→PNG/WebP with black colour key, WAV→MP3, menu art out of `.frx` files, icons), `convert-data.mjs` (`.txt`→JSON + `RENAMES` + `PATCHES`), `sw.template.js` (service worker) |
| `public/` | Committed converted assets, icons, `manifest.webmanifest`, favicon |
| `legacy/` | Original VB6 source and data, for reference. Leave unchanged |
| `vite.config.ts` | `base: './'` (works in any folder) + plugin that generates `dist/sw.js` with the precache list |

## Conventions and decisions

- **Faithful port first.** Original behaviour is kept unless it was clearly a bug; every
  deliberate change is commented in the code ("The original…") and logged in `PLAN.md`.
- **Balance/content changes go in `tools/convert-data.mjs`**, never in `legacy/*.txt`:
  `RENAMES` (softened fairy names/ids; writes `data/renames.json`, which migrates saved
  profiles and Massacre setups) and `PATCHES` (e.g. Fairy Queen boss 1000→100 HP, the
  missing `blue` fairies in `fland`).
- **Decided, don't revisit unless asked:** the `dumbass.wav` clip and the "kick some fairy ass"
  caption baked into the quit-screen image stay as they are. Importing old `.guy` save files
  was declined.
- Timing is per fixed 60 Hz update (the original ran at vsync). `PlayScene` has its own clock
  (`this.time`) that stops while paused; use it, not `engine.now`, for gameplay timing.
- Player data, settings and Massacre setups live in the browser's `localStorage`
  (`mof.profiles`, `mof.settings`, `mof.massacre`, `mof.lastPlayer`); nothing server-side.
- Match the surrounding code's style: small modules, comments explain *why*, TypeScript strict.

## Deploying

- Push to `main` → `.github/workflows/build.yml` builds, deploys to GitHub Pages, and attaches
  the `dist/` folder as a `mof-web` artifact (for hosting elsewhere).
- Repo Settings → Pages → Source must stay **GitHub Actions**. "Deploy from a branch" serves
  the raw source and shows a blank page.
- To redeploy without changes: `git commit --allow-empty -m "Trigger GitHub Pages deploy"` and push.
- Offline play/installing (service worker) needs HTTPS. Pages has it.
- For another server: upload the contents of `dist/` (or the `mof-web` zip) to any folder.

## Testing notes (for Claude)

- Verify changes in the browser, not just `tsc`: `npm run dev`, then drive the page.
- Dev-only hooks: `window.__play` (current `PlayScene`), `window.__engine`, `window.__audio`.
  Prefer these over `import('/src/...')` in page scripts: after an edit Vite serves a fresh
  module copy, so a dynamic import can get a different instance from the running game.
- Synthetic clicks: dispatch `pointerdown`/`pointerup` on `#game` with client coords mapped
  from logical 1024×768. Useful bot: pick a live fairy, find an opaque pixel with
  `sheet.hit()`, click it.
- Each source edit triggers a full page reload in dev; re-run setup steps after editing.
- The Claude desktop preview browser **can't register service workers** and blocks clipboard
  writes. Check offline/install in real Chrome on the live site.
- Windows PowerShell 5.1 mangles double quotes inside `git commit -m` here-strings; use single
  quotes in the message (or the Bash tool).

## Possible next steps (from the modernization list, not started)

Gamepad support and a touch weapon wheel; online leaderboards and a daily seeded Massacre
(needs a small backend); a scenario editor ("Fairies In Space" add-on packs); new fairy
behaviours; AI-upscaled art; a gore toggle / reduced-flash option; separate volume sliders.
