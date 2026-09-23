'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  UtensilsCrossed,
  Check,
  RotateCcw,
  Sparkles,
  Database,
  ArrowDown,
} from 'lucide-react';

const FULL_TEXT = 'Spent $24.50 on tacos yesterday';

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function HeroMock() {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const [cycle, setCycle] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [stage, setStage] = useState<'typing' | 'parsing' | 'resolved'>('typing');

  // Derive effective values if reduced motion is requested
  const currentText = reducedMotion ? FULL_TEXT : displayText;
  const currentStage = reducedMotion ? 'resolved' : stage;

  useEffect(() => {
    if (reducedMotion) return;

    let currentIdx = 0;
    let typingInterval: NodeJS.Timeout | null = null;
    const timeouts: NodeJS.Timeout[] = [];

    // Schedule initial typing state asynchronously to avoid synchronous effect renders
    const startTimeout = setTimeout(() => {
      setDisplayText('');
      setStage('typing');

      typingInterval = setInterval(() => {
        currentIdx++;
        setDisplayText(FULL_TEXT.slice(0, currentIdx));

        if (currentIdx >= FULL_TEXT.length) {
          if (typingInterval) clearInterval(typingInterval);

          // Frame 3: Pause briefly and show entity parsing
          const t1 = setTimeout(() => {
            setStage('parsing');

            // Frame 4: Resolve into structured transaction row
            const t2 = setTimeout(() => {
              setStage('resolved');

              // Frame 5 & 6: Hold on resolved state before starting next cycle
              const t3 = setTimeout(() => {
                setCycle((prev) => prev + 1);
              }, 4200);
              timeouts.push(t3);
            }, 700);
            timeouts.push(t2);
          }, 450);
          timeouts.push(t1);
        }
      }, 55);
    }, 20);
    timeouts.push(startTimeout);

    return () => {
      if (typingInterval) clearInterval(typingInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [cycle, reducedMotion]);

  return (
    <div
      id="hero-demo"
      className="w-full max-w-xl mx-auto bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xs text-left"
    >
      {/* Top Demo Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-line mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
          <span className="font-semibold text-ink/70">Interactive Input Engine</span>
        </div>
        <button
          type="button"
          onClick={() => setCycle((c) => c + 1)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-ink/50 hover:text-forest transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none rounded px-1.5 py-0.5"
          title="Replay sequence"
          aria-label="Replay typing demonstration"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Replay</span>
        </button>
      </div>

      {/* Input Box: Natural Language */}
      <div className="space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/40">
          Natural Language Prompt
        </label>
        <div className="relative flex items-center min-h-[52px] px-4 py-3 bg-paper border border-line rounded-xl text-ink font-mono text-sm sm:text-base">
          {currentStage === 'parsing' ? (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm">
              <span className="text-ink/60">Spent</span>
              <span className="px-1.5 py-0.5 rounded bg-rust/10 text-rust font-bold">
                $24.50
              </span>
              <span className="text-ink/60">on</span>
              <span className="px-1.5 py-0.5 rounded bg-forest/10 text-forest font-bold">
                tacos
              </span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-ink/80 font-bold">
                yesterday
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <span>{currentText}</span>
              {currentStage === 'typing' && !reducedMotion && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-forest animate-pulse" />
              )}
            </div>
          )}

          {currentStage === 'parsing' && (
            <div className="absolute right-3 flex items-center gap-1.5 text-xs text-forest font-sans font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">Parsing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Processing Connector arrow */}
      <div className="my-3 flex items-center justify-center text-ink/30">
        <div className="h-px bg-line flex-1" />
        <span className="px-3 text-[11px] font-mono text-ink/40 flex items-center gap-1">
          <ArrowDown className="w-3 h-3 text-forest" />
          <span>structured resolution</span>
        </span>
        <div className="h-px bg-line flex-1" />
      </div>

      {/* Structured Ledger Row Output */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/40">
          Committed Ledger Entry
        </label>

        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            currentStage === 'resolved'
              ? 'bg-paper/80 border-forest/40 shadow-2xs opacity-100 translate-y-0'
              : 'bg-paper/40 border-line/60 opacity-40 translate-y-1'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left: Icon & Merchant / Category */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  currentStage === 'resolved'
                    ? 'bg-rust/10 text-rust'
                    : 'bg-zinc-100 text-ink/30'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-ink truncate">
                    Taqueria El Sol
                  </p>
                  {currentStage === 'resolved' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-forest/10 text-forest shrink-0">
                      <Check className="w-2.5 h-2.5" />
                      Saved
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50 truncate">
                  Dining & Food • Yesterday, 7:30 PM
                </p>
              </div>
            </div>

            {/* Right: Amount & Local write latency */}
            <div className="text-right shrink-0">
              <p
                className={`text-base sm:text-lg font-black tabular transition-colors ${
                  currentStage === 'resolved' ? 'text-rust' : 'text-ink/40'
                }`}
              >
                -$24.50
              </p>
              <p className="text-[10px] text-ink/40 font-mono mt-0.5 flex items-center justify-end gap-1">
                <Database className="w-2.5 h-2.5 text-forest/70" />
                <span>IndexedDB 2ms</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-footnote indicating offline capability */}
      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-ink/50">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest" />
          Processed locally on device
        </span>
        <span className="font-mono text-[10px]">Zero server roundtrips required</span>
      </div>
    </div>
  );
}
