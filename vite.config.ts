/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_PARTYKIT_HOST': JSON.stringify(env.PARTYKIT_HOST || 'localhost:1999')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts', 'src/**/*.tsx', 'party/**/*.ts'],
        exclude: ['**/*.test.*', '**/index.ts', 'src/test/**'],
      },
    },
  };
});
