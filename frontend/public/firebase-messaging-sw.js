// ========================================
// Service Worker para Firebase Cloud Messaging
// Recebe notificações quando a aba está fechada/em background
// ========================================

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Config preenchida dinamicamente pelo client via postMessage
let firebaseApp = null;

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG" && event.data.config && !firebaseApp) {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || "Ẹgbẹ́ Fátọ́ún";
      const options = {
        body: payload.notification?.body || payload.data?.message || "",
        icon: "/logo.png",
        badge: "/logo.png",
        data: { link: payload.data?.link || "/dashboard/notificacoes" },
      };
      self.registration.showNotification(title, options);
    });

    firebaseApp = true;
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || "/dashboard/notificacoes";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const client of cs) {
        if (client.url.includes(link) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
