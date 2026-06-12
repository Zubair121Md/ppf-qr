'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getMessage } from '@/lib/speech';

export default function ManualProductEntry({ expectedProductId, lang, onSubmit }) {
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center text-sm text-white/70 underline py-2"
      >
        {getMessage('manual_entry_hint', lang)}
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20">
      <p className="text-sm text-white/80 mb-3 font-medium">Manual product code entry</p>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={expectedProductId || 'STR-001'}
        inputClassName="bg-white text-gray-900 font-mono uppercase"
        autoCapitalize="characters"
        autoComplete="off"
      />
      <div className="flex gap-2 mt-3">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          className="bg-white/20 text-white border-white/30"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button size="sm" fullWidth onClick={() => code.trim() && onSubmit(code.trim())}>
          Confirm code
        </Button>
      </div>
    </div>
  );
}
