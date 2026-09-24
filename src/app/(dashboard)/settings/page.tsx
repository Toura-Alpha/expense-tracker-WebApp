'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Cloud,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  DollarSign,
  Layers,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  Sparkles,
  Loader2,
  Search,
} from 'lucide-react';
import { useData } from '@/lib/db/useRxData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncEngine } from '@/lib/db/sync';
import { formatCurrency, getCategoryIcon } from '@/lib/formatters';
import type { CategoryDocType } from '@/lib/db/schemas';

const AVAILABLE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'BRL', name: 'Brazilian Real (R$)' },
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
  { code: 'HKD', name: 'Hong Kong Dollar (HK$)' },
  { code: 'NZD', name: 'New Zealand Dollar (NZ$)' },
  { code: 'SEK', name: 'Swedish Krona (kr)' },
  { code: 'NOK', name: 'Norwegian Krone (kr)' },
  { code: 'MXN', name: 'Mexican Peso (Mex$)' },
  { code: 'ZAR', name: 'South African Rand (R)' },
  { code: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)' },
];

const PALETTE_COLORS = [
  '#2F5D50', // Forest
  '#B4472C', // Rust
  '#D97706', // Amber
  '#2563EB', // Blue
  '#4B5563', // Slate
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#059669', // Emerald
  '#DC2626', // Red
  '#0891B2', // Cyan
];

const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'Food & Dining' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'Car', label: 'Transport' },
  { name: 'Home', label: 'Housing' },
  { name: 'Zap', label: 'Utilities' },
  { name: 'Film', label: 'Entertainment' },
  { name: 'HeartPulse', label: 'Healthcare' },
  { name: 'Briefcase', label: 'Work/Income' },
  { name: 'TrendingUp', label: 'Investments' },
  { name: 'Coins', label: 'Finance' },
  { name: 'Tag', label: 'General' },
  { name: 'Coffee', label: 'Drinks & Cafes' },
  { name: 'Smartphone', label: 'Electronics' },
  { name: 'Plane', label: 'Travel' },
  { name: 'Gift', label: 'Gifts & Charity' },
];

export default function SettingsPage() {
  const {
    categories,
    budgets,
    currency,
    setCurrency,
    isLoading,
    error,
    addCategory,
    updateCategory,
    archiveCategory,
    setCategoryBudget,
    transactions,
  } = useData();

  const isOnline = useNetworkStatus();

  // Currency search state
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  // Filter currencies
  const filteredCurrencies = AVAILABLE_CURRENCIES.filter((curr) => {
    if (!currencySearchQuery.trim()) return true;
    const q = currencySearchQuery.toLowerCase();
    return curr.code.toLowerCase().includes(q) || curr.name.toLowerCase().includes(q);
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    const status = syncEngine.getStatus();
    return status.lastSyncedAt
      ? new Date(status.lastSyncedAt).toLocaleTimeString()
      : null;
  });
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Category Add/Edit form states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIsIncome, setCatIsIncome] = useState(false);
  const [catColor, setCatColor] = useState(PALETTE_COLORS[0]);
  const [catIcon, setCatIcon] = useState<string>(AVAILABLE_ICONS[0].name);
  const [catError, setCatError] = useState<string | null>(null);

  // Budget editing state
  const [budgetOverrides, setBudgetOverrides] = useState<Record<string, string>>({});
  const [savingBudgetId, setSavingBudgetId] = useState<string | null>(null);

  const getBudgetValue = (catId: string) => {
    if (budgetOverrides[catId] !== undefined) {
      return budgetOverrides[catId];
    }
    const found = budgets.find((b) => b.category_id === catId);
    return found ? found.monthly_limit.toString() : '';
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      await syncEngine.triggerSync();
      const status = syncEngine.getStatus();
      const time = status.lastSyncedAt
        ? new Date(status.lastSyncedAt).toLocaleTimeString()
        : new Date().toLocaleTimeString();
      setLastSyncTime(time);
      setSyncMessage(`Replication complete at ${time}`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError('Category name is required');
      return;
    }

    try {
      setCatError(null);
      if (editingCatId) {
        await updateCategory(editingCatId, {
          name: catName.trim(),
          color: catColor,
          icon: catIcon,
          is_income: catIsIncome,
        });
        setEditingCatId(null);
      } else {
        await addCategory({
          name: catName.trim(),
          color: catColor,
          icon: catIcon,
          is_income: catIsIncome,
        });
        setIsAddingCategory(false);
      }
      setCatName('');
    } catch (err: any) {
      setCatError(err.message || 'Failed to save category');
    }
  };

  const startEditCategory = (cat: CategoryDocType) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatColor(cat.color || PALETTE_COLORS[0]);
    setCatIcon(cat.icon || AVAILABLE_ICONS[0].name);
    setCatIsIncome(cat.is_income);
    setIsAddingCategory(false);
  };

  const cancelCategoryEdit = () => {
    setEditingCatId(null);
    setIsAddingCategory(false);
    setCatName('');
    setCatError(null);
  };

  const handleArchiveCategory = (cat: CategoryDocType) => {
    const linkedCount = transactions.filter((t) => t.category_id === cat.id).length;
    if (linkedCount > 0) {
      const confirmed = window.confirm(
        `Category "${cat.name}" is linked to ${linkedCount} transaction(s). Archiving it will leave those transactions uncategorized. Are you sure?`
      );
      if (!confirmed) return;
    }
    archiveCategory(cat.id);
  };

  const handleSaveBudget = async (categoryId: string) => {
    const val = parseFloat(getBudgetValue(categoryId) || '0');
    if (isNaN(val) || val < 0) return;

    try {
      setSavingBudgetId(categoryId);
      await setCategoryBudget(categoryId, val);
    } catch (err) {
      console.error('Failed to save budget:', err);
    } finally {
      setSavingBudgetId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-surface border border-line rounded w-48" />
        <div className="h-40 bg-surface border border-line rounded-2xl" />
        <div className="h-40 bg-surface border border-line rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-surface border border-rust/30 rounded-2xl space-y-3 text-center">
          <AlertCircle className="w-8 h-8 text-rust mx-auto" />
          <h2 className="text-base font-bold text-ink">Failed to load settings</h2>
          <p className="text-xs text-ink/70">{error.message}</p>
        </div>
      </div>
    );
  }

  const expenseCategories = categories.filter((c) => !c.is_income);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Settings & Ledger Rules</h1>
        <p className="text-xs text-ink/50">
          Manage currency, category hierarchies, monthly budgets, and RxDB replication
        </p>
      </div>

      {/* 1. Default Currency Select */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink tracking-tight">Default Currency</h2>
          <p className="text-xs text-ink/50">
            Selected currency symbol and tabular denomination across the entire application
          </p>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink/40 pointer-events-none" />
          <input
            type="text"
            value={currencySearchQuery}
            onChange={(e) => setCurrencySearchQuery(e.target.value)}
            placeholder="Search currency..."
            className="w-full pl-8 pr-3 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
          {filteredCurrencies.map((curr) => {
            const isSelected = currency === curr.code;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => setCurrency(curr.code)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-forest/10 border-forest text-forest shadow-2xs'
                    : 'bg-paper border-line text-ink/70 hover:border-ink/30 hover:text-ink'
                }`}
              >
                <span className="truncate">{curr.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-forest" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Manage Categories (Add / Edit / Archive) */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight">Categories</h2>
            <p className="text-xs text-ink/50">
              Customize spending and income classification with colors and icons
            </p>
          </div>

          {!isAddingCategory && !editingCatId && (
            <button
              onClick={() => {
                setIsAddingCategory(true);
                setCatName('');
                setCatColor(PALETTE_COLORS[0]);
                setCatIcon(AVAILABLE_ICONS[0].name);
                setCatIsIncome(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
        </div>

        {/* Inline Add / Edit Category Form */}
        {(isAddingCategory || editingCatId) && (
          <form
            onSubmit={handleSaveCategory}
            className="p-4 bg-paper border border-line rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                {editingCatId ? 'Edit Category' : 'New Category'}
              </h3>
              <button
                type="button"
                onClick={cancelCategoryEdit}
                aria-label="Cancel editing"
                className="text-ink/40 hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Subscriptions, Pet Care"
                  className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Classification
                </label>
                <div className="flex border border-line rounded-lg p-0.5 bg-surface">
                  <button
                    type="button"
                    onClick={() => setCatIsIncome(false)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                      !catIsIncome ? 'bg-rust text-white shadow-2xs' : 'text-ink/60'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatIsIncome(true)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                      catIsIncome ? 'bg-forest text-white shadow-2xs' : 'text-ink/60'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>
            </div>

            {/* Color Palette Picker */}
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">
                Badge Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      catColor === c ? 'scale-125 ring-2 ring-forest ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((iconItem) => {
                  const IconComp = getCategoryIcon(iconItem.name);
                  const isSelected = catIcon === iconItem.name;
                  return (
                    <button
                      key={iconItem.name}
                      type="button"
                      title={iconItem.label}
                      aria-label={iconItem.label}
                      onClick={() => setCatIcon(iconItem.name)}
                      className={`p-2 rounded-lg border text-ink/70 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-forest/15 border-forest text-forest ring-1 ring-forest'
                          : 'bg-surface border-line hover:border-ink/30'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {catError && <p className="text-xs text-rust font-medium">{catError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cancelCategoryEdit}
                className="px-3 py-1.5 bg-surface border border-line rounded-lg text-xs font-semibold text-ink/70 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90"
              >
                {editingCatId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <div
                key={cat.id}
                className="p-3 bg-paper border border-line rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: cat.color ? `${cat.color}20` : '#2F5D5020',
                      color: cat.color || '#2F5D50',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-ink truncate">{cat.name}</p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        cat.is_income ? 'text-forest' : 'text-rust'
                      }`}
                    >
                      {cat.is_income ? 'Income' : 'Expense'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEditCategory(cat)}
                    aria-label={`Edit category ${cat.name}`}
                    className="p-1.5 text-ink/50 hover:text-forest hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchiveCategory(cat)}
                    aria-label={`Archive category ${cat.name}`}
                    className="p-1.5 text-ink/50 hover:text-rust hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Budget Limits per Category */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink tracking-tight">Category Monthly Budgets</h2>
          <p className="text-xs text-ink/50">
            Set spending guardrails to trigger progress bar alerts on the dashboard
          </p>
        </div>

        <div className="space-y-2.5">
          {expenseCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const isSavingThis = savingBudgetId === cat.id;

            return (
              <div
                key={cat.id}
                className="p-3 bg-paper border border-line rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: cat.color ? `${cat.color}20` : '#2F5D5020',
                      color: cat.color || '#2F5D50',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-ink truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-ink/40">$</span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={getBudgetValue(cat.id)}
                    onChange={(e) =>
                      setBudgetOverrides((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    onBlur={() => handleSaveBudget(cat.id)}
                    placeholder="No limit"
                    className="w-24 px-2.5 py-1 bg-surface border border-line rounded-lg text-xs font-bold tabular text-ink focus:outline-none focus:border-forest text-right"
                  />
                  <div className="w-14 flex items-center justify-center">
                    {isSavingThis ? (
                      <Loader2 className="w-3.5 h-3.5 text-forest animate-spin" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveBudget(cat.id)}
                        className="px-2 py-0.5 text-[10px] font-bold text-forest/70 hover:text-forest transition-colors cursor-pointer"
                      >
                        Auto-saved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Sync Log & RxDB Storage Details */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight">
              Cloud Sync
            </h2>
            <p className="text-xs text-ink/50">
              Your data is backed up to the cloud whenever you&apos;re online
            </p>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {syncMessage && (
          <div className="p-3 bg-paper border border-forest/30 text-forest text-xs rounded-xl font-medium">
            {syncMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider">
              Network Mode
            </span>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-forest" />
                  <span className="text-xs font-bold text-forest">Online (Active)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-rust" />
                  <span className="text-xs font-bold text-rust">Offline (IndexedDB)</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider">
              Last Synced
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink/60" />
              <span className="text-xs font-bold text-ink tabular">
                {lastSyncTime || 'Pending replication'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider">
              Local Records
            </span>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-forest" />
              <span className="text-xs font-bold text-ink tabular">
                {transactions.length} items cached
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-paper/60 border border-line rounded-xl text-xs text-ink/60 space-y-1">
          <p className="font-semibold text-ink">Conflict Resolution Policy:</p>
          <p>
            Last-Write-Wins (LWW) evaluated against UTC timestamps (<code className="font-mono text-ink">updated_at</code>). Remote updates supersede local state only when newer. An alert toast is automatically dispatched when a conflict is reconciled.
          </p>
        </div>
      </section>
    </div>
  );
}
