import './styles/index.css';
import { initAuth } from './services/auth.service.js';
import { initMutualRealtime } from './services/mutual.service.js';
import { initRouter } from './router.js';

// Bootstrap: initialize auth (restore session) BEFORE routing begins.
// This prevents race conditions with OAuth callbacks and session guards.
async function bootstrap() {
  await initAuth();
  initMutualRealtime();
  initRouter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
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
