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
        name: 'blockly-set-locale-fix',
        enforce: 'post', // רץ אחרי שכל המודולים נטענו
        transform(code, id) {
          // אנחנו מחפשים את הקובץ של השדה הבעייתי
          if (id.includes('@blockly/field-bitmap')) {
            // התיקון: אנחנו מחליפים את הקריאה ל-setLocale בבדיקה בטוחה
            // במקום r.setLocale(n) זה יהפוך למשהו שלא קורס
            return {
              code: code.replace(
                /\.setLocale\(/g, 
                '?.setLocale?.('
              ),
              map: null
            };
          }
          return null;
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
      rollupOptions: {
        output: {
          manualChunks: {
            blockly_vendor: ['blockly', '@blockly/field-bitmap']
          }
        }
      }
    }
  };
});
