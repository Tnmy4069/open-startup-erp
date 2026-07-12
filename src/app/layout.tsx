import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWAProviders } from '@/components/PWAProviders';

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
    { media: '(prefers-color-scheme: dark)', color: '#FFD54A' },
    { media: '(prefers-color-scheme: light)', color: '#FFD54A' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'CyberX',
    template: '%s | CyberX',
  },
  description: 'CyberX Community Operating System — enterprise-grade financial tracker, member management, events, and analytics.',
  applicationName: 'CyberX',
  authors: [{ name: 'CyberX Team' }],
  keywords: ['cyberx', 'community', 'finance', 'ledger', 'members', 'events', 'security'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CyberX',
    startupImage: '/icon-512.png',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon-192.png',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'CyberX',
    title: 'CyberX',
    description: 'CyberX Community Operating System',
    images: [{ url: '/icon-512.png' }],
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
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Canonical icon references */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180.png" />

        {/* Splash-screen / standalone theming */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CyberX" />

        {/* MS Tile (Edge PWA on Windows) */}
        <meta name="msapplication-TileColor" content="#080808" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-navbutton-color" content="#FFD54A" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-body font-sans transition-colors duration-150">
        <Providers>
          {children}
          <PWAProviders />
        </Providers>
      </body>
    </html>
  );
}
