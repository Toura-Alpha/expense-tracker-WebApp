'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function MarketingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="marketing-header"
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-surface/95 backdrop-blur-md border-b border-line shadow-2xs py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group rounded-lg focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
        >
          <div className="w-8 h-8 bg-forest rounded-lg flex items-center justify-center text-white font-black text-base shadow-2xs group-hover:bg-forest/90 transition-colors">
            E
          </div>
          <span className="font-bold text-sm tracking-tight text-ink">
            expense-tracker
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-7 text-xs font-medium text-ink/70"
        >
          <a
            href="#how-it-works"
            className="hover:text-forest transition-colors rounded px-1.5 py-1 focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
          >
            How it works
          </a>
          <a
            href="#features"
            className="hover:text-forest transition-colors rounded px-1.5 py-1 focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
          >
            Features
          </a>
          <a
            href="#security"
            className="hover:text-forest transition-colors rounded px-1.5 py-1 focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
          >
            Security
          </a>
        </nav>

        {/* Right: Auth Action Buttons */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/login"
            className="px-3.5 py-2 font-semibold text-ink hover:text-forest transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-forest text-white font-bold rounded-lg hover:bg-forest/90 shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
