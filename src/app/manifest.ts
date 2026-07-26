import type { MetadataRoute } from 'next';
import { AppConfig } from '@/lib/config';
import { prisma } from '@/lib/db';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let dbSetting: any = null;
  try {
    dbSetting = await prisma.setting.findUnique({ where: { id: 'global_config' } });
  } catch (e) {
    // Ignore DB errors during manifest generation
  }

  const activeIcon = (dbSetting?.iconUrl && dbSetting.iconUrl.trim() !== '') 
    ? dbSetting.iconUrl.trim() 
    : AppConfig.pwa.icons.icon192;

  const activeName = (dbSetting?.communityName && dbSetting.communityName.trim() !== '')
    ? dbSetting.communityName.trim()
    : AppConfig.pwa.name;

  return {
    name: activeName,
    short_name: activeName,
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
        src: activeIcon,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: activeIcon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: activeIcon,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: activeIcon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: activeIcon,
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
        icons: [{ src: activeIcon, sizes: '192x192' }],
      },
      {
        name: 'Ledger',
        short_name: 'Ledger',
        description: 'Open Financial Ledger',
        url: '/ledger',
        icons: [{ src: activeIcon, sizes: '192x192' }],
      },
      {
        name: 'Members',
        short_name: 'Members',
        description: 'View Members',
        url: '/members',
        icons: [{ src: activeIcon, sizes: '192x192' }],
      },
      {
        name: 'Events',
        short_name: 'Events',
        description: 'View Events',
        url: '/events',
        icons: [{ src: activeIcon, sizes: '192x192' }],
      },
      {
        name: 'Tasks',
        short_name: 'Tasks',
        description: 'View Tasks',
        url: '/tasks',
        icons: [{ src: activeIcon, sizes: '192x192' }],
      },
      {
        name: 'Documents',
        short_name: 'Docs',
        description: 'Open Document Repository',
        url: '/documents',
        icons: [{ src: activeIcon, sizes: '192x192' }],
      },
    ],
    screenshots: [],
  };
}
