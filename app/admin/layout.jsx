import { BRAND } from '@/lib/brand';

export const metadata = {
  title: `${BRAND.shortName} Manager`,
  description: `${BRAND.name} management panel`,
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function AdminLayout({ children }) {
  return children;
}
