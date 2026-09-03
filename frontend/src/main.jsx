import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// Safeguard: Intercept any native browser dialogs to keep all dialogs in-app
if (typeof window !== 'undefined') {
  window.confirm = (msg) => {
    console.warn(
      '[AetherChat Safeguard] Native window.confirm() was called and blocked. Use useConfirm() instead:',
      msg
    );
    return false;
  };
  window.alert = (msg) => {
    console.warn(
      '[AetherChat Safeguard] Native window.alert() was called and blocked. Use useToast() instead:',
      msg
    );
  };
  window.prompt = (msg, defaultVal) => {
    console.warn(
      '[AetherChat Safeguard] Native window.prompt() was called and blocked:',
      msg
    );
    return defaultVal || null;
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
