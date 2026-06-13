'use client';

import { useEffect, useMemo } from 'react';
import { IconVolume } from '@/components/ui/Icons';
import { speak, getMessage } from '@/lib/speech';

export default function AudioBanner({
  text,
  messageKey,
  lang = 'english',
  replacements = {},
  autoPlay = true,
  variant = 'default',
  className = '',
}) {
  const displayText = useMemo(
    () => text || (messageKey ? getMessage(messageKey, lang, replacements) : ''),
    [text, messageKey, lang, replacements]
  );

  useEffect(() => {
    if (!displayText || !autoPlay) return;
    speak(displayText, lang, 0.8);
  }, [displayText, lang, autoPlay]);

  if (!displayText) return null;

  const bg = {
    default: 'bg-farm-green/10 border-farm-green/30 text-farm-green',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    dark: 'bg-white/10 border-white/20 text-white',
  }[variant] || 'bg-farm-green/10 border-farm-green/30';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${bg} ${className}`}>
      <IconVolume className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-80" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Audio instruction</p>
        <p className="text-base font-medium leading-snug">{displayText}</p>
      </div>
      <button
        type="button"
        onClick={() => speak(displayText, lang, 0.8)}
        className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-white/60 hover:bg-white/80 border border-current/10"
      >
        Replay
      </button>
    </div>
  );
}
