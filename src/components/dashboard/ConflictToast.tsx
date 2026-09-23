'use client';

import React, { useState, useEffect } from 'react';
import { syncEventBus, type ConflictEvent } from '@/lib/db/events';
import { Info, X } from 'lucide-react';

export function ConflictToast() {
  const [activeToast, setActiveToast] = useState<ConflictEvent | null>(null);

  useEffect(() => {
    const unsubscribe = syncEventBus.onConflict((event) => {
      setActiveToast(event);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeToast) return;

    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface border border-line shadow-lg px-4 py-3 rounded-xl text-ink text-sm animate-fade-in"
    >
      <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center shrink-0 text-forest">
        <Info className="w-4 h-4" />
      </div>
      <div className="flex-1 pr-2">
        <p className="font-medium text-xs text-ink">{activeToast.message}</p>
        <p className="text-[11px] text-ink/50 mt-0.5">
          Server version was newer and kept via last-write-wins.
        </p>
      </div>
      <button
        onClick={() => setActiveToast(null)}
        className="text-ink/40 hover:text-ink transition-colors p-1 rounded-md"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
