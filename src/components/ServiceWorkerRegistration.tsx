'use client';

import { useEffect, useRef } from 'react';

interface UpdateToastProps {
  onUpdateAvailable: (registration: ServiceWorkerRegistration) => void;
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
