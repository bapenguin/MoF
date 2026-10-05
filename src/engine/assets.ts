// Loads converted assets by key, using public/assets/manifest.json
// (written by tools/convert-assets.mjs), plus the optional 2x art in
// public/assets/hd/ (tools/upscale-assets.mjs) on screens sharp enough for it.

export type ImageGroup = 'sprites' | 'fg' | 'bg' | 'ui';

interface Manifest {
  sprites: Record<string, { file: string; w: number; h: number }>;
  fg: Record<string, { file: string; w: number; h: number }>;
  bg: Record<string, { file: string; w: number; h: number }>;
  ui: Record<string, { file: string; w: number; h: number }>;
  sfx: Record<string, { file: string }>;
}

type HdManifest = Partial<Record<ImageGroup, Record<string, { file: string }>>>;

const base = `${import.meta.env.BASE_URL}assets/`;
let manifest: Manifest | null = null;
let hdManifest: HdManifest = {};
const images = new Map<string, Promise<HTMLImageElement>>();

// HD art is worth its download when the game, shown fullscreen on this display,
// gets more than ~1.2 device pixels per logical pixel: phones and 1080p+ monitors,
// but not a 1366x768 laptop. Decided once, from the screen rather than the window,
// so resizing mid-game never swaps art. `?hd=1` / `?hd=0` force it for testing.
export const useHd: boolean = (() => {
  const forced = new URLSearchParams(location.search).get('hd');
  if (forced === '1' || forced === '0') return forced === '1';
  const long = Math.max(screen.width, screen.height);
  const short = Math.min(screen.width, screen.height);
  return Math.min(long / 1024, short / 768) * (window.devicePixelRatio || 1) > 1.2;
})();

export async function loadManifest(): Promise<Manifest> {
  if (!manifest) {
    const [main, hd] = await Promise.all([
      fetch(`${base}manifest.json`).then((r) => r.json() as Promise<Manifest>),
      // Optional: without it (or offline before it was cached) the game uses the 1x art.
      useHd
        ? fetch(`${base}hd/manifest.json`)
            .then((r) => (r.ok ? (r.json() as Promise<HdManifest>) : {}))
            .catch(() => ({}))
        : {},
    ]);
    manifest = main;
    hdManifest = hd;
  }
  return manifest;
}

export function getManifest(): Manifest {
  if (!manifest) throw new Error('manifest not loaded');
  return manifest;
}

export function loadImage(group: ImageGroup, key: string): Promise<HTMLImageElement> {
  const id = `${group}/${key}`;
  let p = images.get(id);
  if (!p) {
    const entry = getManifest()[group][key];
    if (!entry) return Promise.reject(new Error(`missing image ${id}`));
    p = new Promise((resolve, reject) => {
      const img = new Image();
      // Decode now (on the loading screen) rather than on first draw mid-game.
      img.onload = () => img.decode().catch(() => {}).then(() => resolve(img));
      img.onerror = () => reject(new Error(`failed to load ${id}`));
      img.src = base + entry.file;
    });
    images.set(id, p);
  }
  return p;
}

// The 2x version of an image, or null if there isn't one, it isn't wanted on this
// screen, or it fails to load (e.g. offline before it was ever cached).
export function loadHdImage(group: ImageGroup, key: string): Promise<HTMLImageElement | null> {
  const entry = hdManifest[group]?.[key];
  if (!entry) return Promise.resolve(null);
  const id = `hd/${group}/${key}`;
  let p = images.get(id);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => img.decode().catch(() => {}).then(() => resolve(img));
      img.onerror = () => reject(new Error(`failed to load ${id}`));
      img.src = `${base}hd/${entry.file}`;
    });
    images.set(id, p);
  }
  return p.catch(() => null);
}

export function imageUrl(group: ImageGroup, key: string): string {
  const entry = getManifest()[group][key];
  if (!entry) throw new Error(`missing image ${group}/${key}`);
  return base + entry.file;
}

export function hasImage(group: ImageGroup, key: string): boolean {
  return !!getManifest()[group][key];
}

export function soundUrl(key: string): string {
  const entry = getManifest().sfx[key];
  if (!entry) throw new Error(`missing sound ${key}`);
  return base + entry.file;
}
