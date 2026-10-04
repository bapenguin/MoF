// fmod.bas DoText: DirectDraw DrawText in the surface's default (GDI system) font,
// yellow RGB(240,242,86), positioned by top-left corner.

export const TEXT_YELLOW = 'rgb(240,242,86)';
export const HUD_FONT = 'bold 16px "MS Sans Serif", Tahoma, Arial, sans-serif';

interface TextOptions {
  color?: string;
  font?: string;
  align?: CanvasTextAlign;
}

export function drawText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, opts: TextOptions = {}): void {
  ctx.font = opts.font ?? HUD_FONT;
  ctx.textBaseline = 'top';
  ctx.textAlign = opts.align ?? 'left';
  ctx.fillStyle = opts.color ?? TEXT_YELLOW;
  ctx.fillText(text, x, y);
}

// VB's Str$() prefixes non-negative numbers with a space; the HUD positions assume it.
export function str(n: number): string {
  return n >= 0 ? ` ${n}` : `${n}`;
}
