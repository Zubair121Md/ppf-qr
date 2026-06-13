'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconOrders, IconTrophy } from '@/components/ui/Icons';

const TABS = [
  { href: '/worker/orders', label: 'Orders', Icon: IconOrders },
  { href: '/worker/stats', label: 'My Stats', Icon: IconTrophy },
];

export default function WorkerNav() {
  const pathname = usePathname();

  const isActive = (href) =>
    href === '/worker/orders'
      ? pathname === '/worker/orders' || pathname.startsWith('/worker/pack/')
      : pathname.startsWith(href);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-bottom safe-x shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-2">
          {TABS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 min-h-[56px] text-xs gap-0.5 ${
                isActive(href) ? 'text-ppf-purple font-semibold' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16" aria-hidden />
    </>
  );
}
