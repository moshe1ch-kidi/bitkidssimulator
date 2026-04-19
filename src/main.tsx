import * as Blockly from 'blockly';

/** * תיקון קריטי למסך לבן ב-Build: 
 * חבילות חיצוניות של Blockly (כמו bitmap) מצפות לפונקציה setLocale.
 * אנחנו מזריקים אותה כאן בראש האפליקציה כדי למנוע את ה-TypeError.
 */
if (!(Blockly as any).setLocale) {
  (Blockly as any).setLocale = () => {
    console.log('Blockly setLocale shim initialized');
  };
}

// שאר ה-Imports הרגילים
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
