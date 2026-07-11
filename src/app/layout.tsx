import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyberX Finance Ledger",
  description: "Enterprise-grade financial tracker and analytics suite for the CyberX cybersecurity community.",
  icons: {
    icon: "/cyberx-logo.webp",
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
        <link rel="icon" href="/cyberx-logo.webp" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-body font-sans transition-colors duration-150">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
