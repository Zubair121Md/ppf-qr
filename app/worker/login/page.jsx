'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_LABELS, getMessage, setWorkerLang, getWorkerLang, syncWorkerLangFromProfile } from '@/lib/speech';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PPFLogo from '@/components/shared/PPFLogo';
import { fetchWithRetry } from '@/lib/fetch-retry';

const LANGS = ['tamil', 'malayalam', 'hindi', 'english'];

export default function WorkerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('english');

  useEffect(() => {
    setLang(getWorkerLang());
  }, []);

  function selectLang(selected) {
    setLang(selected);
    setWorkerLang(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchWithRetry('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      if (data.role === 'admin') {
        router.push('/admin');
      } else {
        if (data.preferred_lang) {
          syncWorkerLangFromProfile(data.preferred_lang);
        }
        router.push('/worker/orders');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface safe-top safe-bottom safe-x">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <PPFLogo size={96} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username / l1"
              autoComplete="username"
              autoCapitalize="none"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm touch-target min-h-0 h-8 w-8"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? 'Please wait...' : getMessage('login', lang)}
            </Button>
          </form>
        </div>
      </div>

      <div className="px-5 pb-6">
        <p className="text-center text-xs text-gray-400 mb-3">Select language</p>
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => selectLang(l)}
              className={`h-12 text-sm font-semibold rounded-2xl border-2 card-press transition-colors ${
                lang === l
                  ? 'border-ppf-purple bg-ppf-purple text-white'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {LANG_LABELS[l].button}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
