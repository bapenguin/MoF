# Massacre of the Fairies

A browser port of *Massacre of the Fairies* (P&P Enterprises, VB6 + DirectX 7, ~2004).
Shoot fairies with nine increasingly ridiculous weapons, from a pistol to a falling piano and a black hole.

See [PLAN.md](PLAN.md) for the port plan and status.

## Controls

| | Mouse / keyboard | Touch |
|---|---|---|
| Shoot | Click (hold for machine gun / howitzer) | Tap (hold for rapid fire) |
| Switch weapon | `1`–`9`, or click the weapon box in the top bar | Tap the weapon box in the top bar |
| Pause | `Esc` or `P`, or click the top bar | Tap the top bar |
| Quit level | `Q` (or Quit in the pause panel) | Quit in the pause panel |
| Retry after game over | `R` / `Enter`, or **Try again** | **Try again** |
| Fullscreen | `F` or the ⛶ button | ⛶ button (where the browser allows it) |
| Cheat | `F1`: 1000 ammo for every weapon (the original's) | – |

The game pauses itself when you switch tabs. On phones, play in landscape.

**Beyond the original:** consecutive hits build a streak (×1.5 at 10, ×2 at 25, ×3 at 50
points); every level is rated out of 3 stars (clear it · 70% accuracy · harm no innocents);
cleared levels can be replayed from the level select; Easy / Normal / Hard difficulty.

## Running locally

```bash
npm install
npm run dev
```

## Project layout

| Path | What |
|---|---|
| `src/` | TypeScript game (Vite, Canvas 2D, Web Audio) |
| `public/assets/` | Web-ready media generated from the originals (committed) |
| `data/` | Scenario/level/fairy JSON generated from the original `.txt` files (committed) |
| `tools/` | Conversion scripts |
| `legacy/` | Original VB6 source and data files, for reference |

## Regenerating assets and data

The raw BMP/WAV originals (~180 MB) are not in git. If you have them in `legacy/`
(`legacy/BG`, `legacy/fg`, `legacy/Sprites`, `legacy/sfx`), with `ffmpeg` on your PATH:

```bash
npm run assets   # BMP -> PNG/WebP (black keyed to transparent), WAV -> MP3, writes manifest.json
npm run data     # legacy/*.txt scenarios -> data/*.json
```

## Play online

**https://bapenguin.github.io/MoF/**, deployed from `main` by GitHub Actions. It can be installed
as an app (the Install button, or *Add to Home Screen* on iPhone/iPad) and then plays offline.

Massacre setups can be shared: build one in Massacre Mode and press **Share this massacre**
for a link like `…/#massacre?f=white:25,scruffy:2&bg=storm&wx=rain&t=60`.

## Deploying

The game is a plain static site, so any web server works (Apache, nginx, IIS, shared
hosting, an S3 bucket, ...). There is no server-side code and no special configuration.

```bash
npm run build
```

Upload the **contents** of `dist/` to any folder on the server. Paths are relative, so
it works at the site root or in a subfolder like `https://example.com/games/mof/`.
It must be served over `http(s)://`; opening `dist/index.html` straight from disk won't work.

Every push to `main` builds the site on GitHub (`.github/workflows/build.yml`) and
publishes it to GitHub Pages. Each workflow run also has a `mof-web` artifact to
download: the same `dist/` folder as a zip, for your own server.

Offline play and installing need **HTTPS** (browsers only allow service workers on
secure sites); over plain `http://` the game still works, just without those.

Player profiles, settings and Massacre setups are saved in each visitor's browser
(`localStorage`), so nothing needs to be stored on the server.
