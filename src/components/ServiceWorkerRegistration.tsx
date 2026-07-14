'use client';

import { useEffect, useRef } from 'react';

interface UpdateToastProps {
  onUpdateAvailable: (registration: ServiceWorkerRegistration) => void;
}

// Convert urlSafeBase64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Uses the browser-native `navigator.serviceWorker.ready` promise which resolves
 * only once a SW with "activated" status is controlling the scope.
 * This is the correct, race-condition-free way to wait for SW activation.
 */
async function waitUntilSWReady(timeoutMs = 15000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('[Push SW] Timed out waiting for SW to become ready.')), timeoutMs)
    ),
  ]);
}

async function subscribeUserToPush() {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('[Push SW] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined.');
      return;
    }

    // Check permission — only proceed if granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[Push SW] Permission not granted.');
        return;
      }
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    // ── Wait for an active SW via the browser-native ready promise ────────
    console.log('[Push SW] Waiting for SW to be ready...');
    const registration = await waitUntilSWReady();
    console.log('[Push SW] SW is ready. Subscribing to push...');

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // Check if already subscribed — avoid re-subscribing on every page load
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.log('[Push SW] Already subscribed, syncing with server...');
      // Sync with server in case it was lost from DB
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', subscription: existingSub }),
      }).catch(() => {});
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('[Push SW] New subscription created:', subscription.endpoint.slice(0, 60));

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription }),
    });

    if (res.ok) {
      console.log('[Push SW] Subscription saved to server.');
    } else {
      console.error('[Push SW] Failed to save subscription:', await res.text());
    }
  } catch (error) {
    console.error('[Push SW] Error:', error);
  }
}

export function ServiceWorkerRegistration({ onUpdateAvailable }: UpdateToastProps) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) return;

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log('[SW] Unregistered active service worker in development to bypass caching');
              window.location.reload();
            }
          });
        }
      });
      return;
    }

    const register = async () => {
      try {
        // Register (or get existing) the service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        registrationRef.current = registration;

        // Auto-subscribe to push if permission already granted
        // Uses navigator.serviceWorker.ready internally — no race condition
        if ('pushManager' in registration && typeof Notification !== 'undefined') {
          if (Notification.permission === 'granted') {
            subscribeUserToPush();
          }
        }

        // Check for updates every time the page gains focus
        const checkForUpdate = () => registration.update().catch(() => {});
        window.addEventListener('focus', checkForUpdate);

        // Detect a new service worker waiting to activate
        const handleUpdateFound = () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              onUpdateAvailable(registration);
            }
          });
        };

        registration.addEventListener('updatefound', handleUpdateFound);

        // Handle case where SW is already waiting when page loads
        if (registration.waiting && navigator.serviceWorker.controller) {
          onUpdateAvailable(registration);
        }

        return () => {
          window.removeEventListener('focus', checkForUpdate);
          registration.removeEventListener('updatefound', handleUpdateFound);
        };
      } catch (error) {
        console.warn('[SW] Registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, [onUpdateAvailable]);

  return null;
}
