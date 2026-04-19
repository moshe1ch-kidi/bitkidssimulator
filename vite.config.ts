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
      {
        name: 'blockly-v12-compatibility-patch',
        transform(code, id) {
          // בודק אם הקוד שייך לאחד השדות הבעייתיים
          if (id.includes('@blockly/field-bitmap') || id.includes('@blockly/field-colour') || id.includes('@blockly/field-slider')) {
            // אנחנו מזריקים בדיקה בטוחה: אם הפונקציה חסרה, אל תקרוס.
            // בגרסה 12, Blockly עבר לשימוש ב-Namespaces בצורה שונה.
            return {
              code: code.replace(/\.setLocale\(/g, '?.setLocale?.('),
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
        // איחוד מוחלט של כל הייבואים לגרסה 12 המרכזית
        'blockly/core': 'blockly',
      },
    },
    build: {
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    }
  };
});
