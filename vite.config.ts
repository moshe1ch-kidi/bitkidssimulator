import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/bitkidssimulator/', 

    plugins: [
      react(),
      tailwindcss(),
    ],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // התיקון הקריטי: אנחנו מפנים את blockly/core לחבילה הראשית
        'blockly/core': 'blockly',
      },
    },

    // הגדרות נוספות כדי לעזור ל-Vite להתמודד עם ספריות ישנות (Legacy)
    optimizeDeps: {
      include: ['blockly', '@blockly/field-bitmap'],
    },

    build: {
      outDir: 'dist',
      commonjsOptions: {
        // מאפשר לערבב שיטות ייבוא שונות (ESM ו-CommonJS)
        transformMixedEsModules: true,
      },
      rollupOptions: {
        // כאן אנחנו מגדירים ל-Rollup איך להתייחס ל-Blockly
        output: {
          manualChunks: {
            blockly: ['blockly'],
          },
        },
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      host: true,
    },
  };
});
