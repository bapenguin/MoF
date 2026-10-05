import { Engine } from './engine/engine';
import { loadManifest } from './engine/assets';
import { applySettings } from './game/settings';
import { isSetupHash, takeSharedSetup } from './game/share';
import { LoadingScene } from './scenes/loading';
import { MenuScene, MENU_ASSETS } from './scenes/menu';

const engine = new Engine(document.getElementById('game') as HTMLCanvasElement, document.getElementById('ui')!);
await loadManifest();
applySettings();
engine.canvas.style.cursor = `url(${import.meta.env.BASE_URL}assets/ui/cursor.cur), crosshair`;
setupFullscreen();
setupOffline();
if (import.meta.env.DEV) Object.assign(window, { __engine: engine, __audio: (await import('./engine/audio')).audio });

// Opened from a shared Massacre link? (Pasting one into an open tab only
// changes the hash, so reload to pick it up.)
const shared = takeSharedSetup();
window.addEventListener('hashchange', () => {
  if (isSetupHash(location.hash)) location.reload();
});

engine.setScene(new LoadingScene('Massacre of the Fairies', MENU_ASSETS, () => new MenuScene({ shared })));
engine.start();

// Installable, offline-capable web app (production builds only). Browsers
// only allow this over HTTPS (or on localhost).
function setupOffline(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('offline mode unavailable', err));

  // Chrome / Edge / Android announce when the game can be installed; offer a
  // button for it. (Safari users use Share → Add to Home Screen instead.)
  const button = document.getElementById('install') as HTMLButtonElement;
  let prompt: (Event & { prompt(): Promise<void> }) | null = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e as typeof prompt;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    button.hidden = true;
    await prompt?.prompt();
    prompt = null;
  });
  window.addEventListener('appinstalled', () => (button.hidden = true));
}

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
