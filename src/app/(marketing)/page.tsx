import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plane,
  WifiOff,
  ArrowRight,
  Database,
  Check,
  SlidersHorizontal,
  Lock,
  Tag,
  Receipt,
  ServerOff,
} from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { HeroMock } from '@/components/marketing/hero-mock';

export const metadata = {
  title: 'Expense Tracker — Offline-First Personal Ledger',
  description:
    'Track spending in plain language. Works completely offline, parses amounts and categories automatically, and syncs when you reconnect.',
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-forest/15 selection:text-forest">
      {/* 1. Sticky Navigation Header */}
      <MarketingHeader />

      {/* 2. Hero Section */}
      <section
        id="hero"
        aria-label="Introduction"
        className="pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 max-w-6xl mx-auto text-center"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-[1.15]">
            Record what you spend in ordinary sentences.
          </h1>

          <p className="text-base sm:text-lg text-ink/65 max-w-2xl mx-auto leading-relaxed">
            Type or speak naturally, let the parser sort the amount, merchant, and category, and keep your entire ledger on your device even without cell service.
          </p>

          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-forest text-white rounded-xl text-base font-bold shadow-xs hover:bg-forest/90 transition-all focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Core Interaction Mock */}
        <div className="mt-12 sm:mt-16">
          <HeroMock />
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section
        id="how-it-works"
        aria-label="How it works"
        className="py-20 border-t border-line bg-surface/50 px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Three steps from thought to balanced ledger.
            </h2>
            <p className="text-sm text-ink/60 mt-2">
              No manual category dropdowns, no date pickers, and no waiting for an API response before saving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between shadow-2xs space-y-6">
              <div>
                <span className="text-sm font-black font-mono text-forest/80">01</span>
                <h3 className="text-lg font-bold text-ink mt-2">
                  Enter naturally
                </h3>
                <p className="text-xs text-ink/60 mt-1.5 leading-relaxed">
                  Type a sentence like &ldquo;Lunch with Sarah at Cava $18.40&rdquo; or snap a receipt note. No form fields or manual date dials.
                </p>
              </div>

              {/* Supporting visual for Step 1 */}
              <div className="p-3.5 bg-paper rounded-xl border border-line space-y-2">
                <div className="text-[11px] font-mono text-ink/50 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-forest" />
                  <span>raw-input.txt</span>
                </div>
                <div className="text-xs font-mono text-ink bg-surface px-2.5 py-1.5 rounded-lg border border-line/60">
                  &ldquo;Coffee with Alex $5.40&rdquo;
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between shadow-2xs space-y-6">
              <div>
                <span className="text-sm font-black font-mono text-forest/80">02</span>
                <h3 className="text-lg font-bold text-ink mt-2">
                  Automatic structure
                </h3>
                <p className="text-xs text-ink/60 mt-1.5 leading-relaxed">
                  The parser extracts the amount, maps the merchant name, assigns a clean spending bucket, and normalizes the timestamp.
                </p>
              </div>

              {/* Supporting visual for Step 2 */}
              <div className="p-3.5 bg-paper rounded-xl border border-line space-y-2">
                <div className="text-[11px] font-mono text-ink/50 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-forest" />
                  <span>resolved-tokens</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="px-2 py-0.5 bg-rust/10 text-rust font-bold rounded">
                    -$5.40
                  </span>
                  <span className="px-2 py-0.5 bg-forest/10 text-forest font-bold rounded">
                    Coffee
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-200 text-ink/70 rounded font-medium">
                    Alex
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between shadow-2xs space-y-6">
              <div>
                <span className="text-sm font-black font-mono text-forest/80">03</span>
                <h3 className="text-lg font-bold text-ink mt-2">
                  Stored on device, synced anywhere
                </h3>
                <p className="text-xs text-ink/60 mt-1.5 leading-relaxed">
                  Written to your device&apos;s encrypted database in 2 milliseconds. Synchronizes smoothly with your cloud account when you reconnect.
                </p>
              </div>

              {/* Supporting visual for Step 3 */}
              <div className="p-3.5 bg-paper rounded-xl border border-line space-y-2">
                <div className="text-[11px] font-mono text-ink/50 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-forest" />
                  <span>local-storage</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-surface px-2.5 py-1.5 rounded-lg border border-line/60">
                  <span className="text-[11px] text-ink/70">Device Commit</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest">
                    <Check className="w-3 h-3" />
                    2ms latency
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Differentiated Features Section */}
      <section
        id="features"
        aria-label="Features"
        className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-8"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Built for reliability in everyday situations.
          </h2>
          <p className="text-sm text-ink/60 mt-2">
            Most finance apps freeze the moment you lose cell reception. This one was engineered from day one around the assumption that your network will fail.
          </p>
        </div>

        {/* Asymmetrical Grid: Large Offline Showcase + 2 Supporting Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Showcase: Offline-First Flight Mode (7 Cols) */}
          <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper border border-line text-xs font-semibold text-ink/70">
                <Plane className="w-3.5 h-3.5 text-forest" />
                <span>The 35,000 ft Guarantee</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Works on a plane, a subway, or a remote road trip.
              </h3>

              <p className="text-sm text-ink/65 leading-relaxed">
                When you buy an in-flight sandwich or pay for a cab in a dead zone, you don&apos;t have to wait until you reach hotel Wi-Fi to write it down. The entire app—recording, searching, categorized summaries—runs directly against your device&apos;s local storage.
              </p>
            </div>

            {/* Visual: Simulated Offline State Machine */}
            <div className="p-4 bg-paper rounded-xl border border-line space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-rust" />
                  <span className="font-bold text-rust">No Internet Connection</span>
                </div>
                <span className="text-[11px] font-mono text-ink/40">Airplane Mode Active</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-line/60">
                  <span className="text-ink/80 font-medium">Add new transaction</span>
                  <span className="text-forest font-bold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Available (0ms)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-line/60">
                  <span className="text-ink/80 font-medium">Browse past transactions</span>
                  <span className="text-forest font-bold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Full History Loaded
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-line/60">
                  <span className="text-ink/80 font-medium">Pending cloud sync queue</span>
                  <span className="font-mono text-ink/60 text-[11px]">
                    2 records ready for reconnection
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Supporting Blocks (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Supporting Block 1: Context-Aware Categorizer */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-2xs flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  Contextual categorization
                </h3>
                <p className="text-xs text-ink/60 mt-1 leading-relaxed">
                  Understands messy vendor names, recurring bills, and informal shorthand without requiring manual rules.
                </p>
              </div>

              <div className="p-3 bg-paper rounded-xl border border-line space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-ink/70">
                  <span>&ldquo;Trader Joe&apos;s $42.10&rdquo;</span>
                  <span className="font-semibold text-forest">Groceries</span>
                </div>
                <div className="flex justify-between items-center text-ink/70">
                  <span>&ldquo;Subway transit pass $34&rdquo;</span>
                  <span className="font-semibold text-forest">Transport</span>
                </div>
              </div>
            </div>

            {/* Supporting Block 2: Pace & Budget Discipline */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-2xs flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  Spending pace, not panic alerts
                </h3>
                <p className="text-xs text-ink/60 mt-1 leading-relaxed">
                  See how your daily spending pace compares with the elapsed days in the month, without stressful red alarms.
                </p>
              </div>

              <div className="p-3 bg-paper rounded-xl border border-line space-y-2">
                <div className="flex justify-between text-xs text-ink/70">
                  <span className="font-medium">Monthly Discretionary</span>
                  <span className="tabular font-bold text-ink">$420 / $1,000</span>
                </div>
                <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                  <div className="bg-forest h-2 rounded-full w-[42%]" />
                </div>
                <div className="flex justify-between text-[10px] text-ink/40 font-mono">
                  <span>Day 14 of 30</span>
                  <span>On track</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trust & Security Note */}
      <section
        id="security"
        aria-label="Security and Privacy"
        className="py-16 border-t border-line bg-surface/40 px-4 sm:px-6"
      >
        <div className="max-w-4xl mx-auto bg-surface border border-line rounded-2xl p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-ink tracking-tight">
                Your finances stay private and under your control.
              </h2>
              <p className="text-xs sm:text-sm text-ink/65 leading-relaxed">
                Every transaction you save is guarded by PostgreSQL Row-Level Security policies tied to your cryptographic authentication key. No other user—and no third-party advertiser—can query your ledger. Because your database runs primarily on your own machine, your records never depend on an external company&apos;s uptime.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-ink/70">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-forest" />
                  <span>Row-Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <ServerOff className="w-3.5 h-3.5 text-forest" />
                  <span>No server dependency</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest" />
                  <span>Zero advertising tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Final Call to Action */}
      <section
        id="cta"
        aria-label="Call to action"
        className="py-20 px-4 sm:px-6 text-center max-w-4xl mx-auto"
      >
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
            A personal ledger that respects your time, works anywhere on earth, and gets out of your way.
          </h2>

          <div>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-forest text-white rounded-xl text-base font-bold shadow-xs hover:bg-forest/90 transition-all focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Minimal Footer */}
      <footer className="border-t border-line py-10 px-4 sm:px-6 text-xs text-ink/50 bg-paper">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-forest rounded-md flex items-center justify-center text-white font-bold text-xs">
              E
            </div>
            <span className="font-bold text-ink text-sm">expense-tracker</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-forest transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-forest transition-colors">
              Features
            </a>
            <a href="#security" className="hover:text-forest transition-colors">
              Security
            </a>
            <Link href="/login" className="hover:text-forest transition-colors">
              Log in
            </Link>
            <Link href="/register" className="hover:text-forest transition-colors">
              Register
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-ink/40">
            &copy; 2026 expense-tracker. Offline-first financial software.
          </p>
        </div>
      </footer>
    </div>
  );
}
