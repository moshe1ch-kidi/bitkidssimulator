import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

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
          // בודק אם הקוד מכיל setLocale וקשור לבלוקלי
          if (code.includes('setLocale') && (id.includes('blockly') || id.includes('node_modules'))) {
            // הזרקה אופציונלית של setLocale לכל קריאה
            // אנחנו מחליפים .setLocale( ב- .setLocale?.(
            // וגם setLocale( ב- (typeof setLocale !== 'undefined' ? setLocale : () => {})?.(
            return {
              code: code
                .replace(/\.setLocale\s*\(/g, '.setLocale?.(')
                .replace(/\bsetLocale\s*\(/g, '(typeof setLocale !== "undefined" ? setLocale : () => {})?.('),
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
      dedupe: ['blockly'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        'blockly/core': path.resolve(__dirname, 'node_modules/blockly/blockly_compressed.js'),
        'blockly/blocks': path.resolve(__dirname, 'node_modules/blockly/blocks_compressed.js'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
