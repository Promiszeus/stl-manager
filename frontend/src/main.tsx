import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Purge legacy Service Worker caches to ensure users never get stuck with outdated HTML/assets
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.update();
      }
    });
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(k => {
          if (k !== 'stl-manager-pwa-v4') {
            caches.delete(k);
          }
        });
      });
    }
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('PWA ServiceWorker registration failed: ', err);
      });
    }
  });
}
