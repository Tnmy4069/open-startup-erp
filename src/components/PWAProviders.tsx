'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { AppConfig } from '@/lib/config';
import { useApp } from '@/context/AppContext';

export function PWAProviders() {
  const { logoUrl } = useApp();
  const [updateRegistration, setUpdateRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if already running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Capture the install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      if (Date.now() - dismissedAt > thirtyDays) {
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      }
    };

    // Detect when the app gets installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    // Detect when display mode changes to standalone (installed + opened)
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleUpdateAvailable = useCallback(
    (registration: ServiceWorkerRegistration) => {
      setUpdateRegistration(registration);
      setShowUpdateToast(true);
    },
    []
  );

  const handleRefresh = () => {
    if (updateRegistration?.waiting) {
      updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => window.location.reload(),
        { once: true }
      );
    } else {
      window.location.reload();
    }
    setShowUpdateToast(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowInstallBanner(false);
  };

  return (
    <>
      <ServiceWorkerRegistration onUpdateAvailable={handleUpdateAvailable} />

      {/* ── Update Toast ─────────────────────────────────────────────────────── */}
      {showUpdateToast && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: '#1A1A1A',
            border: '1px solid #2B2B2B',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            animation: 'pwa-slide-up 0.3s ease',
          }}
        >
          <RefreshCw size={16} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
          <span style={{ color: '#D6D6D6' }}>New version available</span>
          <button
            onClick={handleRefresh}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary-color)',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => setShowUpdateToast(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Dismiss update notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Install Banner ──────────────────────────────────────────────────── */}
      {showInstallBanner && !isInstalled && (
        <div
          role="complementary"
          aria-label={`Install ${AppConfig.name}`}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: '#0F0F0F',
            borderTop: '1px solid #2B2B2B',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            fontFamily: 'system-ui, sans-serif',
            gap: '12px',
            // Safe area inset for iPhone home bar
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Logo + Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img
              src={logoUrl || AppConfig.logoUrl}
              alt={AppConfig.name}
              style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, objectFit: 'contain' }}
            />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>
                {AppConfig.pwa.installTitle}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                {AppConfig.pwa.installDesc}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={handleDismissInstall}
              style={{
                background: 'none',
                border: '1px solid #2B2B2B',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              style={{
                backgroundColor: 'var(--primary-color)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                color: '#000000',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              Install
            </button>
          </div>

          {/* Close */}
          <button
            onClick={handleDismissInstall}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            aria-label="Close install banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
