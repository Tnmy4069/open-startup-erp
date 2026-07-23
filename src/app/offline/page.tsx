'use client';

import { AppConfig } from '@/lib/config';

export default function OfflinePage() {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>Offline | {AppConfig.name}</title>
        <meta name="description" content="You are currently offline." />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: AppConfig.pwa.backgroundColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#FFFFFF',
          userSelect: 'none',
        }}
      >
        {/* Logo */}
        <img
          src={AppConfig.logoUrl}
          alt={AppConfig.name}
          style={{
            height: '72px',
            width: 'auto',
            marginBottom: '32px',
            opacity: 0.9,
            filter: 'drop-shadow(0 0 20px rgba(255,213,74,0.3))',
          }}
        />

        {/* Status icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '1px solid #2B2B2B',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary-color)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          You are offline
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: '#888888',
            margin: '0 0 32px 0',
            maxWidth: '320px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Check your network connection. Pages you have already visited remain accessible.
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-color)',
            color: '#000000',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Retry Connection
        </button>

        {/* Version tag */}
        <p
          style={{
            position: 'fixed',
            bottom: '24px',
            fontSize: '11px',
            color: '#2B2B2B',
            margin: 0,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}
        >
          {AppConfig.pwa.name.toUpperCase()} · OFFLINE MODE
        </p>
      </body>
    </html>
  );
}
