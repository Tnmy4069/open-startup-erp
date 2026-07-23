import type { MetadataRoute } from 'next';
import { AppConfig } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppConfig.name,
    short_name: AppConfig.shortName,
    description: AppConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: AppConfig.themeColor,
    background_color: '#080808',
    lang: 'en',
    categories: ['education', 'productivity', 'security', 'community', 'developer'],
    icons: [
      {
        src: AppConfig.iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: AppConfig.iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: AppConfig.iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: AppConfig.iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: AppConfig.iconUrl,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Go to Dashboard',
        url: '/dashboard',
        icons: [{ src: AppConfig.iconUrl, sizes: '192x192' }],
      },
      {
        name: 'Ledger',
        short_name: 'Ledger',
        description: 'Open Financial Ledger',
        url: '/ledger',
        icons: [{ src: AppConfig.iconUrl, sizes: '192x192' }],
      },
      {
        name: 'Members',
        short_name: 'Members',
        description: 'View Members',
        url: '/members',
        icons: [{ src: AppConfig.iconUrl, sizes: '192x192' }],
      },
      {
        name: 'Events',
        short_name: 'Events',
        description: 'View Events',
        url: '/events',
        icons: [{ src: AppConfig.iconUrl, sizes: '192x192' }],
      },
      {
        name: 'Tasks',
        short_name: 'Tasks',
        description: 'View Tasks',
        url: '/tasks',
        icons: [{ src: AppConfig.iconUrl, sizes: '192x192' }],
      },
      {
        name: 'Documents',
        short_name: 'Docs',
        description: 'Open Document Repository',
        url: '/documents',
        icons: [{ src: AppConfig.iconUrl, sizes: '192x192' }],
      },
    ],
    screenshots: [],
  };
}
