import './styles/index.css';
import { initRouter } from './router.js';

// Initialize the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initRouter();
  });
} else {
  initRouter();
}

// Unregister all service workers and wipe caches to force new UI version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      reg.unregister();
      console.log('Unregistered stale service worker');
    });
  });
  
  if ('caches' in window) {
    caches.keys().then(keys => {
      Promise.all(keys.map(key => caches.delete(key))).then(() => {
        console.log('Cleared all caches');
      });
    });
  }
}
