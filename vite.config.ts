import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { astryxStylex } from '@astryxdesign/build/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// rolldown 对 css exports 的 types 条件解析有误，直接指向 dist 实际文件
const cssAlias = (spec: string) => fileURLToPath(new URL(`./node_modules/${spec}`, import.meta.url));

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
  resolve: {
    alias: {
      '@astryxdesign/core/astryx.css': cssAlias('@astryxdesign/core/dist/astryx.css'),
      '@astryxdesign/theme-neutral/theme.css': cssAlias('@astryxdesign/theme-neutral/dist/theme.css'),
    },
  },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    astryxStylex(),
  ],
});
