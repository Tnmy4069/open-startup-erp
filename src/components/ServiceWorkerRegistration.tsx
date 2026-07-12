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

async function subscribeUserToPush(registration: ServiceWorkerRegistration) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('[Push SW] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined.');
      return;
    }

    // Check if permission is default, ask for it
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

    // Retrieve or create push subscription
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('[Push SW] Active subscription:', subscription);

    // Save/update subscription on server
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        subscription,
      }),
    });

    if (!res.ok) {
      console.error('[Push SW] Failed to save subscription:', await res.text());
    }
  } catch (error) {
    console.error('[Push SW] Error subscribing user:', error);
  }
}

export function ServiceWorkerRegistration({ onUpdateAvailable }: UpdateToastProps) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only register in production — Turbopack dev server cannot serve sw.js
    // correctly and throws InvalidStateError if attempted in development.
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        registrationRef.current = registration;

        // Auto subscribe user to push if permission is granted/default
        if ('pushManager' in registration && typeof Notification !== 'undefined') {
          subscribeUserToPush(registration);
        }

        // Check for updates every time the page gains focus
        const checkForUpdate = () => registration.update();
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

