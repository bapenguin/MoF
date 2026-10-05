// Sprite sheets: the browser equivalent of fmod.bas RegisterSprite/putpic/CheckForHit.
//
// Sheets are grids of equal-size frames: framesX across, framesY down. Fairies are
// 8x1 strips; "innocent" walkers/flyers are 8x2, row 0 facing right, row 1 facing left.
//
// On high-DPI screens a sheet may also have a 2x "HD" image (public/assets/hd/). It's
// only used for drawing: sizes, positions and hit masks all come from the original
// 1x image, so gameplay is identical either way.

import { loadHdImage, loadImage, type ImageGroup } from './assets';

export class SpriteSheet {
  readonly frameW: number;
  readonly frameH: number;
  private mask: Uint8Array | null = null;
  // The image frames are drawn from, and its scale relative to `image`.
  private readonly src: HTMLImageElement;
  private readonly srcScale: number;

  constructor(
    readonly key: string,
    readonly image: HTMLImageElement,
    readonly framesX: number,
    readonly framesY: number,
    hd: HTMLImageElement | null = null,
  ) {
    this.frameW = Math.floor(image.width / framesX);
    this.frameH = Math.floor(image.height / framesY);
    // Stale HD art (not exactly 2x the current original) is ignored rather than misdrawn.
    const usable = hd && hd.width === image.width * 2 && hd.height === image.height * 2;
    this.src = usable ? hd : image;
    this.srcScale = usable ? 2 : 1;
  }

  hasFrame(fx: number, fy = 0): boolean {
    return fx >= 0 && fx < this.framesX && fy >= 0 && fy < this.framesY;
  }

  // Like putpic: an out-of-range frame draws nothing. Canvas handles edge clipping.
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, fx = 0, fy = 0): void {
    this.drawScaled(ctx, Math.round(x), Math.round(y), this.frameW, this.frameH, fx, fy);
  }

  // A frame stretched to (w, h) logical pixels.
  drawScaled(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fx = 0, fy = 0): void {
    if (!this.hasFrame(fx, fy)) return;
    const s = this.srcScale;
    const fw = this.frameW * s;
    const fh = this.frameH * s;
    ctx.drawImage(this.src, fx * fw, fy * fh, fw, fh, x, y, w, h);
  }

  // A region of the sheet, in 1x pixels, stretched to (dx, dy, dw, dh).
  drawRegion(ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
    const s = this.srcScale;
    ctx.drawImage(this.src, sx * s, sy * s, sw * s, sh * s, dx, dy, dw, dh);
  }

  // Per-pixel hit test at (lx, ly) relative to the frame's top-left: true on any
  // non-transparent pixel. (The VB version always sampled frame 0 by mistake;
  // this checks the frame actually on screen.)
  hit(lx: number, ly: number, fx = 0, fy = 0): boolean {
    lx = Math.floor(lx);
    ly = Math.floor(ly);
    if (!this.hasFrame(fx, fy) || lx < 0 || ly < 0 || lx >= this.frameW || ly >= this.frameH) return false;
    const mask = this.getMask();
    return mask[(fy * this.frameH + ly) * this.image.width + fx * this.frameW + lx] !== 0;
  }

  // Builds the hit mask ahead of time (during loading) so the first shot at a
  // new fairy type doesn't stall a frame.
  warmMask(): this {
    this.getMask();
    return this;
  }

  // Built on first use, since most sheets (backgrounds, UI art) are never hit-tested.
  private getMask(): Uint8Array {
    if (!this.mask) {
      const { width, height } = this.image;
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const cx = c.getContext('2d', { willReadFrequently: true })!;
      cx.drawImage(this.image, 0, 0);
      const px = cx.getImageData(0, 0, width, height).data;
      const mask = new Uint8Array(width * height);
      for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] > 0 ? 1 : 0;
      this.mask = mask;
    }
    return this.mask;
  }
}

const sheets = new Map<string, Promise<SpriteSheet>>();
const ready = new Map<string, SpriteSheet>();

// Loads (once) and caches a sheet. As with RegisterSprite, the frame layout
// from the first request for a key wins.
export function loadSheet(key: string, framesX = 1, framesY = 1, group: ImageGroup = 'sprites'): Promise<SpriteSheet> {
  const id = `${group}/${key}`;
  let p = sheets.get(id);
  if (!p) {
    p = Promise.all([loadImage(group, key), loadHdImage(group, key)]).then(([img, hd]) => {
      const s = new SpriteSheet(key, img, framesX, framesY, hd);
      ready.set(id, s);
      return s;
    });
    sheets.set(id, p);
  }
  return p;
}

// Synchronous access to a sheet that has already finished loading.
export function getSheet(key: string, group: ImageGroup = 'sprites'): SpriteSheet {
  const s = ready.get(`${group}/${key}`);
  if (!s) throw new Error(`sprite ${group}/${key} not loaded`);
  return s;
}
