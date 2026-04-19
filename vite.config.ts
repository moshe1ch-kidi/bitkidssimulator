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
      // פלאגין "הזרקה אגרסיבית" - זה הפתרון הסופי לשגיאת ה-setLocale
      {
        name: 'force-blockly-shim',
        enforce: 'pre', // גורם לזה לרוץ לפני הכל
        transform(code, id) {
          // אם אנחנו בתוך חבילה של בלוקלי או ה-bitmap
          if (id.includes('blockly') || id.includes('field-bitmap')) {
            // מזריק הזרקה גלובלית לתוך הקוד עצמו
            return {
              code: `
                if (typeof window !== 'undefined') {
                  window.Blockly = window.Blockly || {};
                  window.Blockly.setLocale = window.Blockly.setLocale || function() {};
                }
                ${code}
              `,
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
        'blockly/core': 'blockly', // איחוד מודולים
      },
    },
    build: {
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
