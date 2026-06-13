'use client';

import { usePathname } from 'next/navigation';
import WorkerNav from '@/components/worker/WorkerNav';

function shouldHideNav(pathname) {
  if (pathname === '/worker/login') return true;
  if (pathname.startsWith('/worker/pack/')) return true;
  if (pathname.startsWith('/worker/scan')) return true;
  return false;
}

export default function WorkerNavWrapper() {
  const pathname = usePathname();
  if (shouldHideNav(pathname)) return null;
  return <WorkerNav />;
}
