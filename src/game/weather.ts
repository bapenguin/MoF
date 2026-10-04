// Rain and snow (fmod.bas initweather / dorain / dosnow).

import { SCREEN_W, SCREEN_H } from '../engine/screen';

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // snow only
  sway: number; // max sideways drift per update
  swing: number; // current drift, oscillates between -sway and +sway
  swingBack: boolean;
}

const RAIN_DROPS = 501;
const SNOW_FLAKES = 351;
// dorain drew each drop as a line from its old to its new position, so streak
// length was one frame's travel. At 60 Hz that's ~6 px; stretched a little so
// the dark streaks read at today's resolutions.
const RAIN_STREAK_S = 1 / 40;

export class Weather {
  private drops: Drop[] = [];

  constructor(readonly kind: 'rain' | 'snow') {
    const count = kind === 'rain' ? RAIN_DROPS : SNOW_FLAKES;
    for (let i = 0; i < count; i++) {
      this.drops.push({
        x: Math.floor(Math.random() * SCREEN_W) + 1,
        y: Math.floor(Math.random() * SCREEN_H) + 1,
        // Rain in px/s; snow fall speed in px per update (the original's unused "dz").
        vx: kind === 'rain' ? Math.floor(Math.random() * 15) + 30 : 0,
        vy: kind === 'rain' ? Math.floor(Math.random() * 30) + 360 : Math.floor(Math.random() * 5) + 5,
        sway: Math.floor(Math.random() * 5) + 1,
        swing: 0,
        swingBack: false,
      });
    }
  }

  update(dt: number): void {
    if (this.kind === 'rain') {
      for (const d of this.drops) {
        d.x += dt * d.vx;
        d.y += dt * d.vy;
        if (d.y >= SCREEN_H) d.y = 0;
        if (d.x >= SCREEN_W) d.x = 0;
      }
      return;
    }
    // Snow, as dosnow intended: drift side to side, and actually fall (the
    // original never moved flakes down and had its drawing commented out).
    for (const d of this.drops) {
      d.swing += d.swingBack ? -1 : 1;
      d.x += d.swing;
      if (d.swing > d.sway) d.swingBack = true;
      if (d.swing < -d.sway) d.swingBack = false;
      d.y += d.vy;
      if (d.x >= SCREEN_W) d.x = 0;
      if (d.x < 0) d.x = SCREEN_W;
      if (d.y > SCREEN_H) d.y = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.kind === 'rain') {
      ctx.strokeStyle = 'rgb(0,0,105)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.vx * RAIN_STREAK_S, d.y - d.vy * RAIN_STREAK_S);
      }
      ctx.stroke();
      return;
    }
    // The original's 3x3 flakes were grey RGB(200,200,200), which reads as dust
    // against bright skies. White with a faint outline shows on sky and snow alike.
    ctx.fillStyle = 'rgba(60,70,90,0.35)';
    for (const d of this.drops) ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 3, 5, 5);
    ctx.fillStyle = '#fff';
    for (const d of this.drops) ctx.fillRect(Math.round(d.x), Math.round(d.y) - 2, 3, 3);
  }
}
