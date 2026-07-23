import type { MetadataRoute } from 'next';
import { AppConfig } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppConfig.pwa.name,
    short_name: AppConfig.pwa.shortName,
    description: AppConfig.pwa.description,
    start_url: AppConfig.pwa.startUrl,
    scope: '/',
    display: AppConfig.pwa.display,
    orientation: AppConfig.pwa.orientation,
    theme_color: AppConfig.themeColor,
    background_color: AppConfig.pwa.backgroundColor,
    lang: 'en',
    categories: ['education', 'productivity', 'security', 'community', 'developer'],
    icons: [
      {
        src: AppConfig.pwa.icons.icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: AppConfig.pwa.icons.icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: AppConfig.pwa.icons.maskable192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: AppConfig.pwa.icons.maskable512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: AppConfig.pwa.icons.appleTouch,
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
        icons: [{ src: AppConfig.pwa.icons.icon192, sizes: '192x192' }],
      },
      {
        name: 'Ledger',
        short_name: 'Ledger',
        description: 'Open Financial Ledger',
        url: '/ledger',
        icons: [{ src: AppConfig.pwa.icons.icon192, sizes: '192x192' }],
      },
      {
        name: 'Members',
        short_name: 'Members',
        description: 'View Members',
        url: '/members',
        icons: [{ src: AppConfig.pwa.icons.icon192, sizes: '192x192' }],
      },
      {
        name: 'Events',
        short_name: 'Events',
        description: 'View Events',
        url: '/events',
        icons: [{ src: AppConfig.pwa.icons.icon192, sizes: '192x192' }],
      },
      {
        name: 'Tasks',
        short_name: 'Tasks',
        description: 'View Tasks',
        url: '/tasks',
        icons: [{ src: AppConfig.pwa.icons.icon192, sizes: '192x192' }],
      },
      {
        name: 'Documents',
        short_name: 'Docs',
        description: 'Open Document Repository',
        url: '/documents',
        icons: [{ src: AppConfig.pwa.icons.icon192, sizes: '192x192' }],
      },
    ],
    screenshots: [],
  };
}
