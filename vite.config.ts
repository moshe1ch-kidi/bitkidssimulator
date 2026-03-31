import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // טעינת משתני סביבה לפי המצב (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // הגדרה קריטית לפריסה ב-GitHub Pages
    // מחליף את '/' בנתיב של המאגר שלך
    base: '/moshe1ch-kidi/',

    plugins: [
      react(),
      tailwindcss(),
    ],

    define: {
      // חשיפת המפתח לאפליקציה בזמן ה-Build
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        // הגדרת קיצור דרך לתיקיית השורש/src
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      // הגדרות עבור סביבות פיתוח מבוססות ענן/AI
      hmr: process.env.DISABLE_HMR !== 'true',
      host: true,
    },

    build: {
      // תיקיית הפלט הסטנדרטית עבור GitHub Actions
      outDir: 'dist',
    },
  };
});
