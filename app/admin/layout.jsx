import { BRAND } from '@/lib/brand';

export const metadata = {
  title: `${BRAND.shortName} Admin`,
};

export default function AdminLayout({ children }) {
  return children;
}
