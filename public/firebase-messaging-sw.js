importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBzpqAb-wysxMypgpuRHmFJik-szxtghlM',
  authDomain: 'emirates-app-d80c5.firebaseapp.com',
  projectId: 'emirates-app-d80c5',
  storageBucket: 'emirates-app-d80c5.firebasestorage.app',
  messagingSenderId: '969149026907',
  appId: '1:969149026907:web:04aa02e33c8e987178257e',
  measurementId: 'G-49060R5J9M'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.image || '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    tag: payload.messageId,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.actionUrl || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
