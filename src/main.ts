import { Engine } from './engine/engine';
import { loadManifest } from './engine/assets';
import { applySettings } from './game/settings';
import { LoadingScene } from './scenes/loading';
import { MenuScene, MENU_ASSETS } from './scenes/menu';

const engine = new Engine(document.getElementById('game') as HTMLCanvasElement, document.getElementById('ui')!);
await loadManifest();
applySettings();
engine.canvas.style.cursor = `url(${import.meta.env.BASE_URL}assets/ui/cursor.cur), crosshair`;
setupFullscreen();
if (import.meta.env.DEV) Object.assign(window, { __engine: engine, __audio: (await import('./engine/audio')).audio });
engine.setScene(new LoadingScene('Massacre of the Fairies', MENU_ASSETS, () => new MenuScene()));
engine.start();

// The original ran fullscreen; the browser version can too (F or the corner button).
function setupFullscreen(): void {
  const button = document.getElementById('fullscreen')!;
  const supported = document.fullscreenEnabled;
  if (!supported) {
    button.remove(); // e.g. iPhone Safari, which has no fullscreen API for pages
    return;
  }
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };
  button.addEventListener('click', (e) => {
    toggle();
    (e.currentTarget as HTMLElement).blur(); // so Space/Enter don't re-trigger it
  });
  window.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;
    if (e.code === 'KeyF' && !typing && !e.repeat) toggle();
  });
  document.addEventListener('fullscreenchange', () => {
    button.textContent = document.fullscreenElement ? '✕' : '⛶';
  });
}
