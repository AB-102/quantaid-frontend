// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// A tab opened before a release can ask for a lazy-loaded file (the admin dashboard) that the host no longer has.
// Reloading loads the current release. At most once a minute, so a file that's really missing can't cause a loop.
const PRELOAD_RELOAD_KEY = 'quantaid:preload-reload';
window.addEventListener('vite:preloadError', () => {
  const lastReload = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0);
  if (Date.now() - lastReload < 60_000) return;
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
