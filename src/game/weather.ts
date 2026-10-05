// Rain and snow (fmod.bas initweather / dorain / dosnow), plus the thunder
// and lightning the original wrote for rain but left commented out.

import { audio } from '../engine/audio';
import { SCREEN_W, SCREEN_H } from '../engine/screen';

interface Drop {
  x: number;
  y: number;
  vx: number; // rain: px/s
  vy: number; // rain: px/s; snow: px per update
  // snow only
  size: number;
  phase: number; // sway position (radians)
  swaySpeed: number;
  swayAmp: number; // px per update
}

const RAIN_DROPS = 501;
const SNOW_FLAKES = 351;
// dorain drew each drop as a line from its old to its new position, so streak
// length was one frame's travel. At 60 Hz that's ~6 px; stretched a little so
// the dark streaks read at today's resolutions.
const RAIN_STREAK_S = 1 / 40;

// Lightning: the original had a 10-in-3000 chance per frame (one every ~5 s at
// 60 fps) of a full white frame plus thunder. Here strikes are a little rarer,
// never back to back, and the flash is softer and fades instead of blanking the
// screen for a frame.
const STRIKE_MIN_GAP = 6; // s
const STRIKE_AVG_EXTRA = 8; // s, on average, after the gap
const FLASH_FADE = 0.35; // s
const FLASH_ALPHA = 0.55;

export class Weather {
  private drops: Drop[] = [];
  private sinceStrike = 0;
  private flash = 0; // 1 at a strike, fading to 0
  private thunderIn = -1; // s until the thunder clap, or -1

  constructor(readonly kind: 'rain' | 'snow') {
    const count = kind === 'rain' ? RAIN_DROPS : SNOW_FLAKES;
    for (let i = 0; i < count; i++) {
      // Snow: small flakes fall slower than big ones, for a bit of depth.
      const size = Math.random() < 0.5 ? 2 : 3;
      this.drops.push({
        x: Math.floor(Math.random() * SCREEN_W) + 1,
        y: Math.floor(Math.random() * SCREEN_H) + 1,
        vx: kind === 'rain' ? Math.floor(Math.random() * 15) + 30 : 0,
        vy: kind === 'rain' ? Math.floor(Math.random() * 30) + 360 : size === 2 ? 1 + Math.random() : 2 + Math.random() * 1.5,
        size,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
        swayAmp: 0.3 + Math.random() * 0.7,
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
      this.updateLightning(dt);
      return;
    }
    // Snow, as dosnow intended (the original never moved or drew its flakes),
    // but gentler: the original's 5-9 px per frame fall looked like a blizzard.
    for (const d of this.drops) {
      d.phase += d.swaySpeed;
      d.x += Math.sin(d.phase) * d.swayAmp;
      d.y += d.vy;
      if (d.x >= SCREEN_W) d.x = 0;
      if (d.x < 0) d.x = SCREEN_W;
      if (d.y > SCREEN_H) d.y = 0;
    }
  }

  private updateLightning(dt: number): void {
    this.sinceStrike += dt;
    this.flash = Math.max(0, this.flash - dt / FLASH_FADE);
    if (this.thunderIn >= 0) {
      this.thunderIn -= dt;
      if (this.thunderIn < 0) audio.play('thunder', { channel: 'ambient' });
    }
    if (this.sinceStrike > STRIKE_MIN_GAP && Math.random() < dt / STRIKE_AVG_EXTRA) this.strike();
  }

  // A lightning flash, with the thunder clap following a moment later.
  strike(): void {
    this.sinceStrike = 0;
    this.flash = 1;
    this.thunderIn = 0.2 + Math.random() * 0.8;
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
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${(FLASH_ALPHA * this.flash).toFixed(3)})`;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
      return;
    }
    // The original's 3x3 flakes were grey RGB(200,200,200), which reads as dust
    // against bright skies. White with a faint outline shows on sky and snow alike.
    ctx.fillStyle = 'rgba(60,70,90,0.35)';
    for (const d of this.drops) ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 1, d.size + 2, d.size + 2);
    ctx.fillStyle = '#fff';
    for (const d of this.drops) ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
  }
}
