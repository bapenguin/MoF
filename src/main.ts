import { Engine } from './engine/engine';
import { loadManifest } from './engine/assets';
import { LoadingScene } from './scenes/loading';
import { DevMenuScene, MENU_ASSETS } from './scenes/devmenu';

const engine = new Engine(document.getElementById('game') as HTMLCanvasElement);
await loadManifest();
engine.canvas.style.cursor = `url(${import.meta.env.BASE_URL}assets/ui/cursor.cur), crosshair`;
engine.setScene(new LoadingScene('Massacre of the Fairies', MENU_ASSETS, () => new DevMenuScene()));
engine.start();
