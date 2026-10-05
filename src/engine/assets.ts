// Loads converted assets by key, using public/assets/manifest.json
// (written by tools/convert-assets.mjs).

export type ImageGroup = 'sprites' | 'fg' | 'bg' | 'ui';

interface Manifest {
  sprites: Record<string, { file: string; w: number; h: number }>;
  fg: Record<string, { file: string; w: number; h: number }>;
  bg: Record<string, { file: string; w: number; h: number }>;
  ui: Record<string, { file: string; w: number; h: number }>;
  sfx: Record<string, { file: string }>;
}

const base = `${import.meta.env.BASE_URL}assets/`;
let manifest: Manifest | null = null;
const images = new Map<string, Promise<HTMLImageElement>>();

export async function loadManifest(): Promise<Manifest> {
  if (!manifest) manifest = (await (await fetch(`${base}manifest.json`)).json()) as Manifest;
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
