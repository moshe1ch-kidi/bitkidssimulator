import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure window.Blockly exists for legacy components
import * as Blockly from 'blockly';
(window as any).Blockly = Blockly;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
