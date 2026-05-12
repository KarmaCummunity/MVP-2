// Service Worker — Karma Community PWA
// Purpose: enables Chrome/Android to install the app as a proper WebAPK so
// that tapping the home-screen icon activates the existing running instance
// instead of opening a new browser tab.  Intentionally minimal: no caching,
// no offline strategy — just the lifecycle hooks required for PWA installation.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
