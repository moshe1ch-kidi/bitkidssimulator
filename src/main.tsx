 import * as Blockly from 'blockly';
(window as any).Blockly = Blockly;
if (!(Blockly as any).setLocale) {
  (Blockly as any).setLocale = () => {};
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
