'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/shared/LogoutButton';
import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { ROLE_LABELS } from '@/lib/constants';
import {
  IconDashboard, IconOrders, IconProducts, IconWorkers, IconQC,
} from '@/components/ui/Icons';

const LINKS = [
  { href: '/admin', label: 'Dashboard', Icon: IconDashboard, short: 'Home' },
  { href: '/admin/orders', label: 'Orders', Icon: IconOrders, short: 'Orders' },
  { href: '/admin/products', label: 'Products', Icon: IconProducts, short: 'Products' },
  { href: '/admin/workers', label: 'Workers', Icon: IconWorkers, short: 'Workers' },
  { href: '/admin/qc', label: 'QC', Icon: IconQC, short: 'QC' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {});
  }, []);

  const isActive = (href) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';

  return (
    <>
      <nav className="hidden md:block bg-farm-green text-white safe-top sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/ppf-logo.png" alt={BRAND.name} width={36} height={36} className="rounded-full" />
            <div>
              <span className="text-lg font-bold tracking-tight block">{BRAND.shortName} Panel</span>
              {user && (
                <span className="text-xs text-white/70">
                  {user.full_name} · {roleLabel}
                </span>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(href) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <LogoutButton variant="admin" className="ml-2" />
          </div>
        </div>
      </nav>

      <nav className="md:hidden bg-farm-green text-white safe-top sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/ppf-logo.png" alt={BRAND.shortName} width={32} height={32} className="rounded-full" />
            <div>
              <span className="text-lg font-bold block">{BRAND.shortName}</span>
              {user && <span className="text-[10px] text-white/70">{roleLabel}</span>}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LogoutButton variant="admin" />
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="touch-target w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="px-4 pb-4 space-y-1 border-t border-white/10">
            {LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
                  isActive(href) ? 'bg-white/20 font-semibold' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-bottom safe-x shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5">
          {LINKS.map(({ href, short, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 min-h-[56px] text-[10px] gap-0.5 ${
                isActive(href) ? 'text-ppf-purple font-semibold' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {short}
            </Link>
          ))}
        </div>
      </div>

      <div className="md:hidden h-16" />
    </>
  );
}
