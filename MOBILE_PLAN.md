# Mobile version: plan

Goal: make Massacre of the Fairies play properly on phones and tablets (touch-first UI, crisp
high-res art) without forking the game.

**Status (2026-10-05):** M1 and M3 done, M4 done except the Massacre builder, M2 mostly done
(baked-text art still to redraw). Owner tried M1+M3 on their phone: sharper and good-looking, but
the original menus were too hard to tap (→ M4), and asked to drop the HUD bar for a bigger view.

- **M4 menus:** on the touch layout `MenuScene.show()` hands each screen to
  `src/scenes/menu-touch.ts`: a full-screen layer in real CSS px over the forest backdrop. Main
  menu (logo + two big buttons + Options/Hall of Fame; no Quit, a web page can't quit), player
  cards (one tap plays, Stats button, "Create & play"), scenario picture cards, level list with
  stars + difficulty + big Start (tapping the selected level again also starts), switch-style
  options that apply immediately, stats and Hall of Fame. Logic stays in `menu.ts` (some members
  made non-private for it; `hallOfFame()` / `faceUrl()` shared). Desktop menus unchanged.
  **Still to do:** the Massacre builder (`massacre.ts`) on touch.
- **HUD bar dropped on touch:** during play `screen.ts` `viewTop` crops the 83 px HUD strip off
  the top (fairies never go there), so the playfield shows 1024x685 and gets ~12% bigger; the left
  rail gained the level name and Rank. Input, the overlay and the canvas transform all account for
  it. Game-over buttons are finger-sized on touch.

- **M3 play layout:** `screen.ts` computes a touch layout on coarse-pointer devices (`?touch=1` /
  `?touch=0` override): the game sits inside the safe area with rails of at least 76 CSS px either
  side (on wide phones it keeps its full height; on 4:3 tablets it shrinks a little).
  `src/ui/rails.ts`: left rail = pause, Time/Score/Kills, fullscreen; right rail = all nine
  weapons with icons and ammo (two columns when the rail is ≥128 px), one tap to switch, reload
  sweep on the selected one. Touch shots with pistol/MG snap to the nearest fairy or crate pixel
  within 16 CSS px (`World.shoot` `slack`; mouse shots stay exact); this also makes the 70%
  accuracy star easier on touch. Kills buzz on Android (`settings.vibrate`, toggle in the pause
  panel, which gets bigger buttons on touch). Tested in the preview at 844x390 and 1024x768:
  layout, weapon taps, pause/resume, aim slack (12/12 near-misses hit with touch, 0/12 with mouse,
  0/8 far shots).

- **M2 art:** tested Lanczos vs Real-ESRGAN `x4plus` vs `x4plus-anime` and **chose ESRGAN x4plus**
  for sprites, foregrounds and backgrounds. `npm run upscale` (`tools/upscale-assets.mjs`) builds
  107 images (the 69 sprite sheets the game uses, 7 foregrounds, 31 backgrounds; ~11.7 MB) into
  `public/assets/hd/` in ~70 s on an RTX 4080; review at `/tools/upscale-review.html`. Defringe is
  conservative after review: exact-black key, only the outer 1px fades, render pinholes filled,
  UI art key-only. Still muddy: tiny baked text (e.g. `howieammo`), to be redrawn (M3/M4).
- **M1 rendering:** the canvas backing store follows device pixels (up to 2x the logical
  1024x768; `screen.ts` `renderScale`, applied as a transform by `Engine`). `SpriteSheet` draws
  from the HD image when there is one but sizes, positions and hit masks still come from the 1x
  art, so gameplay is unchanged (bot-tested: same hit behaviour with `?hd=1` and `?hd=0`). HD loads
  only where it helps (`useHd` in `assets.ts`: fullscreen scale × DPR > 1.2; `?hd=1`/`?hd=0`
  override). The service worker leaves `assets/hd/` out of the precache and caches it on use.

## 1. Where the current build falls short on a phone

Measured from the code, not yet from a device (see M0).

| Problem | Cause | Effect on a typical phone (2340×1080, DPR 2.6, landscape) |
|---|---|---|
| Blurry everything | `<canvas width=1024 height=768>` is stretched by CSS; no `devicePixelRatio` handling (`src/engine/screen.ts`) | A 1024×768 image is blown up ~1.4× in CSS px and ~3.7× in device px |
| Wasted screen | Fixed 4:3 letterbox on a ~19.5:9 screen | ~450 device px of black bar on each side, ~30% of the screen |
| Tiny targets | Fairy frames are 75 px logical (`fairy1` = 600×75, 8 frames) | A fairy is ~35 CSS px (≈9 mm), and the pistol hit test is per-pixel |
| Weapon switching | Touch has only "tap the weapon box to cycle" | Getting from pistol to black hole takes up to 8 taps mid-fight |
| Unreadable menus | `#ui` is laid out in 1024×768 px and scaled down; fonts are 13–15 px | Menu text ends up ~7 CSS px; buttons ~12 CSS px tall (minimum touch target is 44) |
| Hover-only affordances | `menuLink` turns white on `mouseenter` | No feedback on touch |
| iOS gaps | No Fullscreen API on iPhone; no `orientation` in the manifest | Safari chrome eats space unless the game is installed to the home screen |
| Fringed sprites | The original's black colour key: anti-aliased edges were rendered against black, so `applyBlackColorKey` (exact #000 only) leaves a dark halo | Very visible once art is upscaled or drawn on bright backgrounds |

## 2. Approach

**One codebase, one deploy, two layouts.** Choose the layout at runtime (`matchMedia('(pointer: coarse)')`,
plus aspect ratio). Desktop keeps the current faithful layout. Phones and tablets get the mobile layout. This
keeps the existing GitHub Pages / PWA / share-link setup and avoids two diverging games.

**Keep the playfield at 1024×768 logical.** All of `world.ts`'s physics, spawn bounds, `SCREENTOP` and balance
assume it. Changing the playfield size would mean re-tuning every level. Instead, use the side bars a wide
phone screen leaves anyway for touch controls.

```
 ┌────────┬──────────────────────────────┬────────┐
 │ score  │                              │ weapon │
 │ kills  │     1024×768 playfield       │  rail  │
 │ time   │     (unchanged logic)        │ 1..9 + │
 │ ‖ pause│                              │ ammo   │
 └────────┴──────────────────────────────┴────────┘
   left rail (HUD)                       right rail (thumb-reachable)
```

## 3. Phases

| # | Milestone | Done when |
|---|---|---|
| M0 | **Device testing setup.** `vite --host` on the LAN, Chrome remote debugging (Android) / Safari Web Inspector (iOS). Play the current build on a real phone and record issues. | Problem list in §1 confirmed or corrected on real hardware |
| M1 | **Sharp rendering, no art changes.** DPR-aware canvas backing store (`ctx.setTransform(scale…)`), capped at ~2× for memory. `SpriteSheet` gets a `scale` field: draws at logical size from a higher-res image, and still hit-tests against the **original 1× mask** so gameplay is identical. HUD text renders at native resolution. | Text and edges are crisp on a phone; bot playthrough gives the same results as before |
| M2 | **Art cleanup and upscaling** (see §4) | 2× sprites/backgrounds/foregrounds reviewed side by side and shipped; desktop can opt in |
| M3 | **Mobile play layout.** Side rails using the bar space: HUD on the left, a weapon rail with ammo counts on the right (one tap per weapon), a big pause button. Touch aim tolerance for pistol/MG (accept a hit within ~8 logical px of an opaque pixel; touch only). Safe-area insets (`env(safe-area-inset-*)`), haptics on Android (`navigator.vibrate`). Keep tap-the-top-bar to pause. | A full Wilderness run on a phone without frustration; first-tap accuracy measured with the dev bot |
| M4 | **Mobile menus.** Rebuild each `menu.ts` panel as responsive CSS (real px, ≥44 px targets, ≥16 px inputs so iOS doesn't zoom) and keep the original art as backdrops. Redesign the Massacre builder as steps (Weapons → Fairies → Scene → Go) because its dense VB form can't be made thumb-friendly. Handle the on-screen keyboard in login. | Every screen is usable one-handed in landscape; the desktop layout is unchanged |
| M5 | **Platform polish.** Manifest `orientation: landscape`, "Add to Home Screen" guidance on iOS, a memory budget (load per scenario, release sheets between scenarios), a service worker that precaches 1× and caches 2× on demand. Optional: wrap with Capacitor for app stores. | Installed PWA runs fullscreen on iOS + Android; a cold start on cellular is acceptable |

M1 is the foundation and is cheap. M2 and M3 can run in parallel after it.

## 4. Sprite cleanup and upscaling

The art is **pre-rendered 3D (Poser/Bryce-style), not pixel art**, so pixel-art scalers (xBR, hqx) are the wrong
tool. A photo-style AI upscaler is the right one.

Pipeline (new `tools/upscale-assets.mjs`; reads `legacy/` like `convert-assets.mjs`):

1. **Defringe.** Build alpha from a near-black threshold rather than exact #000. Then *un-blend* edge pixels: they
   were anti-aliased against black, so `rgb_true ≈ rgb / alpha`. Remove isolated stray pixels. This alone fixes
   the halos, even at 1×.
2. **Slice into frames.** Upscale each frame separately with a few px of transparent padding, so neighbouring
   frames can't bleed into each other across sheet boundaries. Then reassemble the sheet on an exact 2× grid.
3. **Upscale RGB** with Real-ESRGAN (`realesrgan-ncnn-vulkan`, a standalone Windows exe that uses the GPU and
   doesn't need Python). Try `realesrgan-x4plus` vs `x4plus-anime` on a few sheets and pick per category. Run
   at 4× and downsample to 2× with Lanczos for cleaner results.
4. **Upscale alpha separately** (Lanczos + slight threshold/feather). AI upscalers handle alpha poorly.
5. **Check animation consistency.** AI upscaling can make details "swim" between frames. Review sheets as
   animations, not stills.
6. **Output** `sprites/<key>@2x.webp` (lossy WebP with alpha, ~q85), keeping the 1× PNGs. The manifest gets a
   `scale` entry per asset. The engine picks 2× when DPR × canvas scale warrants it.

Categories:

| Assets | Count | Treatment |
|---|---|---|
| Fairy/innocent sheets, gore, weapons | ~90 sheets | Full pipeline (steps 1–6) |
| Backgrounds (1024×768) | 30 | Upscale only (no alpha) → 2048×1536 WebP |
| Foregrounds (1024×150, keyed) | 7 | Full pipeline |
| Score pop-ups (`25`, `50`…), `topbar`, round cards, UI panels with baked-in text | ~20 | Upscaled text tends to look mushy: redraw in vector/CSS (M3/M4 replaces most of these anyway) |

Budget: 2× = 4× the pixels. Sprites are 7.2 MB now and would be ~20–30 MB as PNG, so WebP is required.
**Decoded** memory matters more on iOS. One 2× `boydog` sheet is 2048×512×4 = 4 MB in RAM, so load per
scenario and measure in M0/M1.

Review process: a dev-only comparison page (1× vs 2× side by side, animated, on a light and a dark
background). You approve each category before it's committed. Keep `PLAN.md`'s rule: the original art stays the reference.

## 5. Open questions

1. **Distribution:** PWA only (current), or also app stores via Capacitor? Stores need a developer account
   ($99/yr Apple, $25 once Google) plus content review, and the theme is cartoon-violent.
2. **Portrait:** stay landscape-only (recommended: the playfield is 4:3), or also design a portrait mode?
3. **Art fidelity:** a faithful 2× cleanup of the existing renders, or a freer AI "remaster" that adds detail?
   The first is safer. The second could clash with the rest of the art.
4. **Desktop:** should desktop also get the 2× art and side rails, or stay exactly as it is?

## 6. Setup notes for this machine

- Node 24.19 installed; `npm install` and `npm run build` pass.
- `legacy/BG`, `fg`, `Sprites`, `sfx` are present. **Missing:** the root-level `legacy/*.bmp` files
  (e.g. `mofsplash.bmp`, `full.bmp`, `demo.bmp`, `joe.bmp`). `npm run assets` skips them silently, but
  `mofsplash.bmp` is needed to regenerate icons.
- Real-ESRGAN is in `tools/bin/realesrgan/`. Not installed: `ffmpeg` (only needed for sounds).
