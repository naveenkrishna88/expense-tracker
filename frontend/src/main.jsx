import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for Chrome PWA Installability & Offline Caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] ServiceWorker successfully registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] ServiceWorker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register to facilitate testing if requested
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA Dev] ServiceWorker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA Dev] SW registration note:', error.message);
      });
  });
}
