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

export const metadata: Metadata = {
  title: {
    default: AppConfig.name,
    template: `%s | ${AppConfig.name}`,
  },
  description: AppConfig.description,
  applicationName: AppConfig.name,
  authors: [{ name: `${AppConfig.name} Team` }],
  keywords: [AppConfig.prefix, 'community', 'finance', 'ledger', 'members', 'events', 'security'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: AppConfig.name,
    startupImage: AppConfig.iconUrl,
  },
  icons: {
    icon: [
      { url: AppConfig.faviconUrl },
      { url: AppConfig.iconUrl, sizes: '192x192', type: 'image/png' },
      { url: AppConfig.iconUrl, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: AppConfig.iconUrl, sizes: '180x180', type: 'image/png' },
    ],
    shortcut: AppConfig.faviconUrl,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: AppConfig.name,
    title: AppConfig.name,
    description: AppConfig.description,
    images: [{ url: AppConfig.iconUrl }],
  },
};

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
        {/* Canonical icon references */}
        <link rel="icon" href={AppConfig.faviconUrl} />
        <link rel="apple-touch-icon" href={AppConfig.iconUrl} />

        {/* Splash-screen / standalone theming */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={AppConfig.name} />

        {/* MS Tile (Edge PWA on Windows) */}
        <meta name="msapplication-TileColor" content="#080808" />
        <meta name="msapplication-TileImage" content={AppConfig.iconUrl} />
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
