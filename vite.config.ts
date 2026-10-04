import { defineConfig } from 'vite';

// GitHub Pages serves the site from /MoF/, so asset URLs need that prefix in production.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/MoF/' : '/',
  build: { target: 'es2022' },
}));
