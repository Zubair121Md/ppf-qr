import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { BRAND } from '@/lib/brand';

export const metadata = {
  title: `${BRAND.shortName} Worker`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: BRAND.shortName,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function WorkerLayout({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
