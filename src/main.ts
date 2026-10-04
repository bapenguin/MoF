import { Engine } from './engine/engine';
import { loadManifest } from './engine/assets';
import { applySettings } from './game/settings';
import { LoadingScene } from './scenes/loading';
import { MenuScene, MENU_ASSETS } from './scenes/menu';

const engine = new Engine(document.getElementById('game') as HTMLCanvasElement, document.getElementById('ui')!);
await loadManifest();
applySettings();
engine.canvas.style.cursor = `url(${import.meta.env.BASE_URL}assets/ui/cursor.cur), crosshair`;
engine.setScene(new LoadingScene('Massacre of the Fairies', MENU_ASSETS, () => new MenuScene()));
engine.start();
