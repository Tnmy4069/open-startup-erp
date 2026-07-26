import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWAProviders } from '@/components/PWAProviders';
import { AppConfig } from '@/lib/config';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: AppConfig.themeColor },
    { media: '(prefers-color-scheme: light)', color: AppConfig.themeColor },
  ],
};

import { prisma } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  let dbSetting: any = null;
  try {
    dbSetting = await prisma.setting.findUnique({ where: { id: 'global_config' } });
  } catch (e) {
    // Ignore DB errors
  }

  const appName = (dbSetting?.communityName && dbSetting.communityName.trim() !== '')
    ? dbSetting.communityName.trim()
    : AppConfig.name;

  const faviconUrl = (dbSetting?.faviconUrl && dbSetting.faviconUrl.trim() !== '')
    ? dbSetting.faviconUrl.trim()
    : AppConfig.faviconUrl;

  const iconUrl = (dbSetting?.iconUrl && dbSetting.iconUrl.trim() !== '')
    ? dbSetting.iconUrl.trim()
    : AppConfig.pwa.icons.icon192;

  const logoUrl = (dbSetting?.logoUrl && dbSetting.logoUrl.trim() !== '')
    ? dbSetting.logoUrl.trim()
    : AppConfig.logoUrl;

  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: AppConfig.description,
    applicationName: appName,
    authors: [{ name: `${appName} Team` }],
    keywords: [AppConfig.prefix, 'community', 'finance', 'ledger', 'members', 'events', 'security'],
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: appName,
      startupImage: iconUrl,
    },
    icons: {
      icon: [
        { url: faviconUrl },
        { url: iconUrl, sizes: '192x192', type: 'image/png' },
        { url: iconUrl, sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: iconUrl, sizes: '180x180', type: 'image/png' },
      ],
      shortcut: faviconUrl,
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: 'website',
      siteName: appName,
      title: appName,
      description: AppConfig.description,
      images: [{ url: logoUrl || iconUrl }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      style={{
        '--primary-color': AppConfig.themeColor,
        '--link-color': AppConfig.themeColor,
      } as React.CSSProperties}
    >
      <head>
        {/* Splash-screen / standalone theming */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={AppConfig.pwa.shortName} />

        {/* MS Tile (Edge PWA on Windows) */}
        <meta name="msapplication-TileColor" content={AppConfig.pwa.backgroundColor} />
        <meta name="msapplication-TileImage" content={AppConfig.pwa.icons.icon192} />
        <meta name="msapplication-navbutton-color" content={AppConfig.themeColor} />
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `:root, html, body, .dark { --primary-color: ${AppConfig.themeColor} !important; }`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-bg-primary text-text-body font-sans transition-colors duration-150"
        style={{
          '--primary-color': AppConfig.themeColor,
          '--link-color': AppConfig.themeColor,
        } as React.CSSProperties}
      >
        <Providers>
          {children}
          <PWAProviders />
        </Providers>
      </body>
    </html>
  );
}
