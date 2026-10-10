// Permet l'installation de l'application. Ne garde rien en mémoire :
// la boutique est toujours à jour.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});