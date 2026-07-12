import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow the service worker to control the entire origin scope
  async headers() {
    return [
      {
        // Service worker must be served without cache and with correct scope header
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        // PWA manifest
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Icons — allow long caching (content-addressed names used in manifest)
        source: '/(icon-:size*.png|apple-icon-:size*.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Offline page — no caching at CDN level; SW handles it
        source: '/offline',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
