// Web Audio replacement for DSound.bas / fmod.bas sndPlaySound.
//
// Matches the original's behaviour: each sound key is one "buffer", so replaying
// a sound that's still playing restarts it (machine-gun fire retriggers rather
// than stacking). Looped sounds (music, rain, ocean) keep playing if re-requested.
// Panning follows the screen x position; the VB version only ever panned left.

import { soundUrl } from './assets';
import { SCREEN_W } from './screen';

export type Channel = 'sfx' | 'music' | 'ambient';

interface PlayOptions {
  x?: number; // screen x (0..1024) to pan from; centred if omitted
  channel?: Channel;
  loop?: boolean;
}

const CHANNEL_GAIN: Record<Channel, number> = { sfx: 1, music: 0.7, ambient: 0.8 };

interface Voice {
  src: AudioBufferSourceNode;
  loop: boolean;
}

class AudioEngine {
  readonly ctx = new AudioContext();
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private decoded = new Map<string, AudioBuffer>();
  private voices = new Map<string, Voice>();
  private channels: Record<Channel, GainNode>;
  private enabled: Record<Channel, boolean> = { sfx: true, music: true, ambient: true };

  constructor() {
    const master = this.ctx.createGain();
    master.connect(this.ctx.destination);
    const mk = (channel: Channel) => {
      const g = this.ctx.createGain();
      g.gain.value = CHANNEL_GAIN[channel];
      g.connect(master);
      return g;
    };
    this.channels = { sfx: mk('sfx'), music: mk('music'), ambient: mk('ambient') };
  }

  // Browsers keep the context suspended until a user gesture.
  get unlocked(): boolean {
    return this.ctx.state === 'running';
  }

  unlock(): Promise<void> {
    return this.ctx.resume();
  }

  // Decoding works while suspended, so sounds can be preloaded on the loading screen.
  load(key: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(key);
    if (!p) {
      p = fetch(soundUrl(key))
        .then((r) => r.arrayBuffer())
        .then((data) => this.ctx.decodeAudioData(data))
        .then((buf) => {
          this.decoded.set(key, buf);
          return buf;
        })
        .catch((err) => {
          console.warn(`sound ${key} failed to load`, err);
          return null;
        });
      this.buffers.set(key, p);
    }
    return p;
  }

  play(key: string | undefined, opts: PlayOptions = {}): void {
    if (!key) return;
    const channel = opts.channel ?? 'sfx';
    if (!this.enabled[channel]) return;
    const buf = this.decoded.get(key);
    if (!buf) {
      // Not preloaded: fetch now and play once ready (late, but better than silence).
      void this.load(key).then((b) => b && this.play(key, opts));
      return;
    }

    const existing = this.voices.get(key);
    if (existing) {
      if (existing.loop) return;
      this.stop(key);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !!opts.loop;
    let node: AudioNode = src;
    if (opts.x !== undefined) {
      const pan = this.ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, (opts.x / SCREEN_W) * 2 - 1)) * 0.8;
      node = node.connect(pan);
    }
    node.connect(this.channels[channel]);
    const voice = { src, loop: !!opts.loop };
    src.onended = () => {
      if (this.voices.get(key) === voice) this.voices.delete(key);
    };
    this.voices.set(key, voice);
    src.start();
  }

  stop(key: string | undefined): void {
    if (!key) return;
    const v = this.voices.get(key);
    if (!v) return;
    this.voices.delete(key);
    v.src.onended = null;
    v.src.stop();
  }

  stopAll(): void {
    for (const key of [...this.voices.keys()]) this.stop(key);
  }

  setEnabled(channel: Channel, on: boolean): void {
    this.enabled[channel] = on;
    this.channels[channel].gain.value = on ? CHANNEL_GAIN[channel] : 0;
  }
}

export const audio = new AudioEngine();
