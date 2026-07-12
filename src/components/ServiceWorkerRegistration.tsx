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
 * Wait until the service worker registration has an active worker.
 * Returns the registration once the SW is in "activated" state.
 * Timeout after 10s to avoid hanging forever.
 */
function waitForActiveServiceWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs = 10000
): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    // Already active — resolve immediately
    if (registration.active) {
      resolve(registration);
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('[Push SW] Timed out waiting for Service Worker to activate.'));
    }, timeoutMs);

    // The SW that is installing or waiting will eventually become active
    const trackWorker = (worker: ServiceWorker) => {
      if (worker.state === 'activated') {
        clearTimeout(timer);
        resolve(registration);
        return;
      }
      worker.addEventListener('statechange', function onStateChange() {
        if (worker.state === 'activated') {
          worker.removeEventListener('statechange', onStateChange);
          clearTimeout(timer);
          resolve(registration);
        }
      });
    };

    // Track whichever worker is in progress right now
    if (registration.installing) {
      trackWorker(registration.installing);
    } else if (registration.waiting) {
      trackWorker(registration.waiting);
    } else {
      // No worker in-progress yet — watch for one to appear
      registration.addEventListener('updatefound', function onUpdateFound() {
        registration.removeEventListener('updatefound', onUpdateFound);
        if (registration.installing) trackWorker(registration.installing);
      });
    }
  });
}

async function subscribeUserToPush(registration: ServiceWorkerRegistration) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('[Push SW] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined.');
      return;
    }

    // Check permission
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

    // ── Wait for SW to be fully activated before subscribing ──────────────
    console.log('[Push SW] Waiting for Service Worker to activate...');
    const activeReg = await waitForActiveServiceWorker(registration);
    console.log('[Push SW] Service Worker is active. Subscribing to push...');

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    const subscription = await activeReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('[Push SW] Subscribed:', subscription.endpoint.slice(0, 60));

    // Save/update subscription on server
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        subscription,
      }),
    });

    if (res.ok) {
      console.log('[Push SW] Subscription saved to server.');
    } else {
      console.error('[Push SW] Failed to save subscription:', await res.text());
    }
  } catch (error) {
    console.error('[Push SW] Error subscribing user:', error);
  }
}

export function ServiceWorkerRegistration({ onUpdateAvailable }: UpdateToastProps) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check navigator support
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) return;

    const register = async () => {
      try {
        // Check if there is already a registered service worker for scope
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (existing) {
          registrationRef.current = existing;
          if ('pushManager' in existing && typeof Notification !== 'undefined') {
            // Quietly sync subscription if already granted — still wait for active
            if (Notification.permission === 'granted') {
              subscribeUserToPush(existing);
            }
          }
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        registrationRef.current = registration;

        // Auto subscribe user to push — waitForActiveServiceWorker is called inside
        if ('pushManager' in registration && typeof Notification !== 'undefined') {
          subscribeUserToPush(registration);
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
              // A new version is ready — notify parent
              onUpdateAvailable(registration);
            }
          });
        };

        registration.addEventListener('updatefound', handleUpdateFound);

        // Handle case where SW is already waiting when page loads
        if (
          registration.waiting &&
          navigator.serviceWorker.controller
        ) {
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
