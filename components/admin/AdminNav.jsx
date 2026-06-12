'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', short: 'Home' },
  { href: '/admin/orders', label: 'Orders', icon: '📋', short: 'Orders' },
  { href: '/admin/products', label: 'Products', icon: '🏷️', short: 'Products' },
  { href: '/admin/workers', label: 'Workers', icon: '👷', short: 'Workers' },
  { href: '/admin/qc', label: 'QC', icon: '⚠️', short: 'QC' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block bg-farm-green text-white safe-top">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-bold">FarmScan Admin</Link>
          <div className="flex gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(link.href) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden bg-farm-green text-white safe-top sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="text-lg font-bold">FarmScan</Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="touch-target w-10 h-10 rounded-xl bg-white/10"
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className="px-4 pb-4 space-y-1 border-t border-white/10">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
                  isActive(link.href) ? 'bg-white/20 font-semibold' : ''
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-bottom safe-x">
        <div className="grid grid-cols-5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-2 min-h-[56px] text-[10px] ${
                isActive(link.href) ? 'text-farm-green font-semibold' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{link.icon}</span>
              {link.short}
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
}
