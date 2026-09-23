import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Zap,
  Film,
  HeartPulse,
  Briefcase,
  TrendingUp,
  Coins,
  Tag,
  Coffee,
  Smartphone,
  Plane,
  Gift,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Zap,
  Film,
  HeartPulse,
  Briefcase,
  TrendingUp,
  Coins,
  Tag,
  Coffee,
  Smartphone,
  Plane,
  Gift,
};

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Tag;
  return ICON_MAP[iconName] || Tag;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF ',
};

export function getCurrencySymbol(currency = 'USD'): string {
  return CURRENCY_SYMBOLS[currency] || '$';
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  showPlusSign = false
): string {
  const symbol = getCurrencySymbol(currency);
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isNegative) {
    return `-${symbol}${formatted}`;
  }
  if (showPlusSign && amount > 0) {
    return `+${symbol}${formatted}`;
  }
  return `${symbol}${formatted}`;
}

export function formatDayLabel(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();

  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isSameDay) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
