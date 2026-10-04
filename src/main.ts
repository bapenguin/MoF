import { Engine } from './engine/engine';
import { loadManifest } from './engine/assets';
import { LoadingScene } from './scenes/loading';
import { SandboxScene, sandboxAssets } from './scenes/sandbox';

const engine = new Engine(document.getElementById('game') as HTMLCanvasElement);
await loadManifest();
engine.setScene(new LoadingScene('Massacre of the Fairies', sandboxAssets(), () => new SandboxScene()));
engine.start();
