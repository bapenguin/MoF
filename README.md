# Massacre of the Fairies

A browser port of *Massacre of the Fairies* (P&P Enterprises, VB6 + DirectX 7, ~2004).
Shoot fairies with nine increasingly ridiculous weapons, from a pistol to a falling piano and a black hole.

See [PLAN.md](PLAN.md) for the port plan and status.

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

## Deploying

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
Enable it once under **Settings → Pages → Source: GitHub Actions**.
