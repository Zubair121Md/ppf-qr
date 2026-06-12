import './globals.css';

export const metadata = {
  title: 'FarmScan',
  description: 'Farm packing system with QR scanning',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FarmScan',
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
  themeColor: '#1B5E20',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="safe-x">{children}</body>
    </html>
  );
}
