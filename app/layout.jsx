import './globals.css';
import { BRAND } from '@/lib/brand';

export const metadata = {
  title: BRAND.appName,
  description: `${BRAND.name} — ${BRAND.tagline}`,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND.shortName,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: BRAND.themeColor,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="safe-x">{children}</body>
    </html>
  );
}
