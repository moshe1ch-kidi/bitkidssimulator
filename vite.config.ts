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
        // הפתרון המודרני לבעיית ה-Locale: מכריחים את כל הייבואים להשתמש באותו קובץ
        'blockly/core': 'blockly',
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          // מבטיח שכל חלקי Blockly יאוגדו יחד ולא ייווצרו כפילויות
          manualChunks: {
            blockly: ['blockly', '@blockly/field-bitmap', '@blockly/field-colour', '@blockly/field-slider'],
          },
        },
      },
    },

    optimizeDeps: {
      // גורם ל-Vite להכין את החבילות האלו מראש ולמנוע שגיאות ייבוא
      include: ['blockly', '@blockly/field-bitmap', '@blockly/field-colour', '@blockly/field-slider'],
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      host: true,
    },
  };
});
