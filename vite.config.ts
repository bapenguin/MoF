import { defineConfig } from 'vite';

// Relative asset paths, so the built site works from any folder on any web
// server (e.g. https://example.com/games/mof/) without reconfiguring.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
