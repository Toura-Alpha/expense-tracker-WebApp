'use client';

import React, { useState } from 'react';
import { Sparkles, Plus, Loader2, Check } from 'lucide-react';
import { SyncStatus } from './SyncStatus';
import { ConflictToast } from './ConflictToast';
import { useData } from '@/lib/db/useRxData';

interface HeaderProps {
  onNewEntry?: () => void;
}

export function Header({ onNewEntry }: HeaderProps) {
  const { openAddModal, categories } = useData();
  const [nlpInput, setNlpInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedToast, setParsedToast] = useState<string | null>(null);

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim() || isParsing) return;

    try {
      setIsParsing(true);
      const res = await fetch('/api/parse-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: nlpInput }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const item = json.data;
          setParsedToast(`Parsed: ${item.description || 'Item'} ($${item.amount})`);
          setNlpInput('');
          setTimeout(() => setParsedToast(null), 5000);

          // Match category
          let matchedCatId = undefined;
          if (item.category) {
            const match = categories.find((c) =>
              c.name.toLowerCase().includes(String(item.category).toLowerCase())
            );
            if (match) matchedCatId = match.id;
          }

          // Open modal with parsed values for final review/edit
          openAddModal({
            merchant_name: item.description,
            amount: item.type === 'expense' ? -Math.abs(Number(item.amount)) : Math.abs(Number(item.amount)),
            category_id: matchedCatId,
            date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('NLP parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleNewEntry = () => {
    if (onNewEntry) {
      onNewEntry();
    } else {
      openAddModal();
    }
  };

  return (
    <header className="h-16 lg:h-20 border-b border-line bg-surface flex items-center px-4 lg:px-8 justify-between shrink-0 sticky top-0 z-20">
      {/* Brand title on mobile */}
      <div className="flex items-center gap-2 lg:hidden mr-2">
        <div className="w-8 h-8 bg-forest rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs">
          E
        </div>
        <span className="font-bold text-sm text-ink tracking-tight">expense-tracker</span>
      </div>

      {/* Desktop Quick NLP search bar */}
      <div className="hidden sm:block flex-1 max-w-xl">
        <form onSubmit={handleNlpSubmit} className="relative">
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            placeholder='Describe transaction: "Spent $42 on lunch at Taco Bell"'
            className="w-full pl-10 pr-12 py-2 bg-paper border border-line rounded-xl text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
          />
          <Sparkles className="absolute left-3.5 top-2.5 w-4 h-4 text-forest opacity-80" />
          {isParsing ? (
            <Loader2 className="absolute right-3.5 top-2.5 w-4 h-4 text-forest animate-spin" />
          ) : parsedToast ? (
            <Check className="absolute right-3.5 top-2.5 w-4 h-4 text-forest" />
          ) : null}
        </form>
        {parsedToast && (
          <div className="absolute top-16 bg-surface border border-forest/30 text-forest text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium z-30">
            {parsedToast}
          </div>
        )}
      </div>

      {/* Action controls & Persistent SyncStatus */}
      <div className="flex items-center gap-3 lg:gap-4 ml-auto">
        <SyncStatus />

        <button
          onClick={handleNewEntry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 lg:px-4 lg:py-2 bg-forest text-white rounded-lg text-xs lg:text-sm font-bold shadow-xs hover:bg-forest/90 focus-visible:ring-2 focus-visible:ring-forest transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Entry</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
      <ConflictToast />
    </header>
  );
}

