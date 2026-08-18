// Service worker: vangt pushmeldingen op en toont ze, ook als de app dicht is.
self.addEventListener("push", (event) => {
  let data = { titel: "Ons huis", tekst: "Er staat iets open." };
  try { data = { ...data, ...event.data.json() }; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.titel, {
      body: data.tekst,
      icon: "icoon-192.png",
      badge: "icoon-192.png",
      tag: data.tag || "huis",
      data: { url: data.url || "./" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
