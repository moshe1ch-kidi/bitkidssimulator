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
      // פלאגין קטן שמתקן את השגיאה של החבילה הבעייתית בזמן אמת
      {
        name: 'fix-blockly-bitmap-import',
        transform(code, id) {
          if (id.includes('@blockly/field-bitmap')) {
            // משנה את הייבוא הבעייתי לייבוא שתואם ל-Blockly 12
            return code.replace(
              "import Blockly from 'blockly/core';",
              "import * as Blockly from 'blockly';"
            );
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
        'blockly/core': 'blockly',
      },
    },

    build: {
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      host: true,
    },
  };
});
