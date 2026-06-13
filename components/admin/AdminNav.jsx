'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/shared/LogoutButton';
import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { ROLE_LABELS } from '@/lib/constants';
import {
  IconDashboard, IconOrders, IconProducts, IconWorkers, IconQC, IconStats,
} from '@/components/ui/Icons';

const PRIMARY_LINKS = [
  { href: '/admin', label: 'Home', Icon: IconDashboard },
  { href: '/admin/orders', label: 'Orders', Icon: IconOrders },
  { href: '/admin/workers', label: 'Workers', Icon: IconWorkers },
];

const MORE_LINKS = [
  { href: '/admin/performance', label: 'Stats & Payroll', Icon: IconStats, desc: 'Points, earnings, payments' },
  { href: '/admin/qc', label: 'QC Errors', Icon: IconQC, desc: 'Quality control log' },
  { href: '/admin/products', label: 'Products', Icon: IconProducts, desc: 'QR codes & catalog' },
];

function IconMore({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const isActive = (href) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const isMoreActive = MORE_LINKS.some((l) => isActive(l.href));

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:block bg-farm-green text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <Image src="/ppf-logo.png" alt={BRAND.name} width={32} height={32} className="rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight block leading-tight">{BRAND.shortName} Manager</span>
              {user && (
                <span className="text-[11px] text-white/70 truncate block">
                  {user.full_name} · {roleLabel}
                </span>
              )}
            </div>
          </Link>

          <nav className="flex items-center gap-0.5">
            {PRIMARY_LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                  isActive(href) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10 text-white/90'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                  isMoreActive || moreOpen ? 'bg-white/20 font-semibold' : 'hover:bg-white/10 text-white/90'
                }`}
              >
                <IconMore className="w-4 h-4" />
                More
              </button>
              {moreOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} aria-label="Close menu" />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 text-gray-800">
                    {MORE_LINKS.map(({ href, label, Icon, desc }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${isActive(href) ? 'bg-ppf-purple/5' : ''}`}
                      >
                        <Icon className={`w-5 h-5 mt-0.5 ${isActive(href) ? 'text-ppf-purple' : 'text-gray-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isActive(href) ? 'text-ppf-purple' : ''}`}>{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <LogoutButton variant="admin" className="ml-2" />
          </nav>
        </div>
      </header>

      {/* Mobile top bar — compact */}
      <header className="md:hidden bg-farm-green text-white sticky top-0 z-40 shadow-sm">
        <div className="px-4 h-12 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <Image src="/ppf-logo.png" alt={BRAND.shortName} width={28} height={28} className="rounded-full" />
            <div className="min-w-0">
              <span className="text-sm font-bold block leading-tight truncate">{BRAND.shortName}</span>
              {user && <span className="text-[10px] text-white/70 truncate block">{roleLabel}</span>}
            </div>
          </Link>
          <LogoutButton variant="admin" />
        </div>
      </header>

      {/* Mobile bottom nav — 4 tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-bottom">
        <div className="grid grid-cols-4 h-14">
          {PRIMARY_LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                isActive(href) ? 'text-ppf-purple font-semibold' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              isMoreActive ? 'text-ppf-purple font-semibold' : 'text-gray-500'
            }`}
          >
            <IconMore className="w-5 h-5" />
            More
          </button>
        </div>
      </nav>

      {/* Mobile More sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} aria-label="Close" />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl safe-bottom animate-in slide-in-from-bottom">
            <div className="px-5 pt-4 pb-2 border-b">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">More</h3>
              <p className="text-xs text-gray-500">Stats, QC, and product management</p>
            </div>
            <div className="p-3 space-y-1">
              {MORE_LINKS.map(({ href, label, Icon, desc }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    isActive(href) ? 'bg-ppf-purple/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive(href) ? 'bg-ppf-purple text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isActive(href) ? 'text-ppf-purple' : 'text-gray-900'}`}>{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="h-3" />
          </div>
        </div>
      )}
    </>
  );
}
