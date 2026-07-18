self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const origin = self.location.origin;
      const iconUrl = data.icon ? (data.icon.startsWith('http') ? data.icon : origin + data.icon) : origin + '/icon-192.png';
      const badgeUrl = data.badge ? (data.badge.startsWith('http') ? data.badge : origin + data.badge) : origin + '/icon-192.png';

      const options = {
        body: data.body,
        icon: iconUrl,
        badge: badgeUrl,
        data: data.data || { url: '/' },
        vibrate: [100, 50, 100],
      };
      event.waitUntil(
        self.registration.showNotification(data.title || 'CyberX System', options)
      );
    } catch (e) {
      console.error('Error parsing push data', e);
      const origin = self.location.origin;
      event.waitUntil(
        self.registration.showNotification('CyberX Alert', {
          body: event.data.text(),
          icon: origin + '/icon-192.png',
          badge: origin + '/icon-192.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
