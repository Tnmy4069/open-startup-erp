export const AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'CyberX',
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'CyberX',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'CyberX Community Operating System',
  logoUrl: process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp',
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || '#FFD54A',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'tanmay@cyberx.org.in',
  orgDomain: process.env.NEXT_PUBLIC_ORGANIZATION_DOMAIN || 'cyberx.org.in',
  prefix: (process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'CyberX').toLowerCase().replace(/[^a-z0-9]/g, ''),
};
