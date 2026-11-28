import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { mergeConfig } from 'vite';
import baseConfig from './vite.config.js';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));
const adminRoot = fileURLToPath(new URL('./admin/', import.meta.url));

export default ({ command }) => mergeConfig(baseConfig, {
  root: adminRoot,
  base: command === 'build' ? '/admin/' : '/',
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: resolve(repositoryRoot, 'dist', 'admin'),
    emptyOutDir: true,
  },
});
