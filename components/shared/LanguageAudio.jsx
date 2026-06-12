'use client';

import { useEffect } from 'react';
import { speak, getWorkerLang } from '@/lib/speech';

export default function LanguageAudio({ text, lang, autoPlay = true }) {
  const activeLang = lang || getWorkerLang();

  useEffect(() => {
    if (autoPlay && text) {
      speak(text, activeLang);
    }
  }, [text, activeLang, autoPlay]);

  return null;
}
