'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconLogout } from '@/components/ui/Icons';

export default function LogoutButton({ variant = 'worker', className = '' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/worker/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const styles = variant === 'worker'
    ? 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20'
    : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 md:bg-transparent md:hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`touch-target flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${styles} ${className}`}
      aria-label="Logout"
    >
      <IconLogout className="w-4 h-4" />
      <span className="hidden sm:inline">{loading ? '...' : 'Logout'}</span>
    </button>
  );
}
