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
      // הפלאגין הזה "מתלבש" על הקובץ של בלוקלי ומתקן אותו מבפנים
      {
        name: 'fix-blockly-core-issue',
        transform(code, id) {
          if (id.includes('blockly/core') || id.endsWith('blockly/index.js')) {
            return {
              code: code + `\nif (!exports.setLocale) { exports.setLocale = function() {}; }\nif (typeof window !== 'undefined') { window.Blockly = exports; }`,
              map: null
            };
          }
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // הכרחי: כל ייבוא של ליבת בלוקלי יופנה לאותו מקום
        'blockly/core': 'blockly',
      },
    },
    build: {
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true, // קריטי לטיפול בספריות ישנות כמו bitmap
      },
      rollupOptions: {
        output: {
          // מונע מ-Vite לפצל את בלוקלי ליותר מדי קבצים קטנים
          manualChunks: {
            blockly_vendor: ['blockly', '@blockly/field-bitmap']
          }
        }
      }
    }
  };
});
