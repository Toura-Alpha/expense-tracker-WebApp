'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Camera,
  Check,
  Calendar,
  Tag,
  Building2,
  FileText,
  Trash2,
} from 'lucide-react';
import { useData } from '@/lib/db/useRxData';
import { getCurrencySymbol } from '@/lib/formatters';

export function TransactionModal() {
  const { isModalOpen } = useData();
  if (!isModalOpen) return null;
  return <TransactionModalDialog />;
}

function TransactionModalDialog() {
  const {
    editingTransaction,
    prefillData,
    closeModal,
    categories,
    currency,
    createTransaction,
    updateTransaction,
  } = useData();

  // Natural language input state
  const [nlpInput, setNlpInput] = useState('');
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [nlpSuccessMessage, setNlpSuccessMessage] = useState<string | null>(null);
  const [nlpError, setNlpError] = useState<string | null>(null);

  // Initialize structured form states on mount
  const [txType, setTxType] = useState<'expense' | 'income'>(() => {
    if (editingTransaction) {
      return editingTransaction.amount < 0 ? 'expense' : 'income';
    }
    if (prefillData?.amount !== undefined) {
      return prefillData.amount < 0 ? 'expense' : 'income';
    }
    return 'expense';
  });

  const [amountStr, setAmountStr] = useState(() => {
    if (editingTransaction) return Math.abs(editingTransaction.amount).toString();
    if (prefillData?.amount !== undefined) return Math.abs(prefillData.amount).toString();
    return '';
  });

  const [categoryId, setCategoryId] = useState(() => {
    if (editingTransaction?.category_id) return editingTransaction.category_id;
    if (prefillData?.category_id) return prefillData.category_id;
    const defaultCat = categories.find((c) => !c.is_income);
    return defaultCat ? defaultCat.id : categories[0]?.id || '';
  });

  const [merchantName, setMerchantName] = useState(() => {
    return editingTransaction?.merchant_name || prefillData?.merchant_name || '';
  });

  const [dateStr, setDateStr] = useState(() => {
    if (editingTransaction?.date) return editingTransaction.date.split('T')[0];
    if (prefillData?.date) return prefillData.date.split('T')[0];
    return new Date().toISOString().split('T')[0];
  });

  const [note, setNote] = useState(() => {
    return editingTransaction?.note || prefillData?.note || '';
  });

  const [receiptPreview, setReceiptPreview] = useState<string | null>(() => {
    return editingTransaction?.receipt_url || null;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle NLP Parsing
  const handleParseNlp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlpInput.trim() || isParsingNlp) return;

    try {
      setIsParsingNlp(true);
      setNlpError(null);
      setNlpSuccessMessage(null);

      const res = await fetch('/api/parse-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: nlpInput }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Could not parse text');
      }

      const { description, amount, type, category, date } = json.data;

      // Auto-fill structured form fields
      if (amount !== undefined && amount !== null) {
        setAmountStr(Math.abs(Number(amount)).toString());
      }
      if (type) {
        setTxType(type === 'income' ? 'income' : 'expense');
      }
      if (description) {
        setMerchantName(description);
      }
      if (date) {
        setDateStr(date);
      }

      // Match category
      if (category) {
        const lowerCat = String(category).toLowerCase();
        const matched = categories.find(
          (c) =>
            c.name.toLowerCase().includes(lowerCat) ||
            lowerCat.includes(c.name.toLowerCase())
        );
        if (matched) {
          setCategoryId(matched.id);
        }
      }

      setNlpSuccessMessage(`Auto-filled: ${description || 'Transaction'} for $${amount}`);
      setTimeout(() => setNlpSuccessMessage(null), 4000);
    } catch (err: any) {
      setNlpError(err.message || 'Failed to parse natural language');
    } finally {
      setIsParsingNlp(false);
    }
  };

  // Receipt image selection (OCR stub)
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }

    // Expenses are stored as negative numbers; income as positive numbers
    const finalAmount = txType === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    try {
      setIsSaving(true);
      const isoDate = dateStr
        ? new Date(dateStr + 'T12:00:00.000Z').toISOString()
        : new Date().toISOString();

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          amount: finalAmount,
          category_id: categoryId || null,
          merchant_name: merchantName.trim() || null,
          note: note.trim() || null,
          date: isoDate,
          currency,
          receipt_url: receiptPreview,
        });
      } else {
        await createTransaction({
          amount: finalAmount,
          category_id: categoryId || null,
          merchant_name: merchantName.trim() || null,
          note: note.trim() || null,
          date: isoDate,
          currency,
          is_recurring: false,
          receipt_url: receiptPreview,
        });
      }

      closeModal();
    } catch (err: any) {
      console.error('Failed to save transaction:', err);
      setFormError(err.message || 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const symbol = getCurrencySymbol(currency);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs transition-opacity"
    >
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-surface border-0 sm:border sm:border-line sm:rounded-2xl shadow-xl flex flex-col overflow-hidden text-ink animate-fade-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface shrink-0">
          <div>
            <h2 id="transaction-modal-title" className="text-lg font-bold text-ink tracking-tight">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p className="text-xs text-ink/50 mt-0.5">
              Instant local write with background cloud sync
            </p>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-ink/40 hover:text-ink hover:bg-paper transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-forest"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Primary Path: Quick Natural Language Input */}
          {!editingTransaction && (
            <div className="p-4 bg-paper border border-line rounded-xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-forest" />
                Natural Language Quick-Add
              </label>
              <form onSubmit={handleParseNlp} className="flex gap-2">
                <input
                  type="text"
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder='e.g. "Dinner with Sarah $45.50 at Olive Garden"'
                  className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
                />
                <button
                  type="submit"
                  disabled={isParsingNlp || !nlpInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-forest text-white rounded-lg text-xs font-semibold hover:bg-forest/90 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                >
                  {isParsingNlp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Parse
                    </>
                  )}
                </button>
              </form>
              {nlpSuccessMessage && (
                <div className="flex items-center gap-1.5 text-xs text-forest font-medium pt-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{nlpSuccessMessage}</span>
                </div>
              )}
              {nlpError && (
                <p className="text-xs text-rust font-medium pt-1">{nlpError}</p>
              )}
            </div>
          )}

          {/* Structured Form */}
          <form id="tx-form" onSubmit={handleSave} className="space-y-4">
            {/* Type Toggle: Expense / Income */}
            <div className="flex rounded-lg border border-line p-1 bg-paper">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  txType === 'expense'
                    ? 'bg-surface text-rust shadow-2xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  txType === 'income'
                    ? 'bg-surface text-forest shadow-2xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount Field */}
            <div>
              <label htmlFor="amount-input" className="block text-xs font-semibold text-ink/70 mb-1">
                Amount ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-ink/40">
                  {symbol}
                </span>
                <input
                  id="amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-lg text-lg font-bold tabular focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors ${
                    txType === 'expense' ? 'text-rust' : 'text-forest'
                  }`}
                />
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label htmlFor="category-select" className="block text-xs font-semibold text-ink/70 mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
                <select
                  id="category-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-surface border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest appearance-none transition-colors"
                >
                  <option value="">Uncategorized</option>
                  {categories
                    .filter((c) => (txType === 'income' ? c.is_income : !c.is_income))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <div className="absolute right-3.5 top-3.5 pointer-events-none border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-ink/40" />
              </div>
            </div>

            {/* Merchant / Description */}
            <div>
              <label htmlFor="merchant-input" className="block text-xs font-semibold text-ink/70 mb-1">
                Merchant / Description
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
                <input
                  id="merchant-input"
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Whole Foods, Uber, Freelance Client"
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-lg text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
                />
              </div>
            </div>

            {/* Date Field */}
            <div>
              <label htmlFor="date-input" className="block text-xs font-semibold text-ink/70 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
                <input
                  id="date-input"
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
                />
              </div>
            </div>

            {/* Note / Memo */}
            <div>
              <label htmlFor="note-input" className="block text-xs font-semibold text-ink/70 mb-1">
                Note (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
                <input
                  id="note-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add notes, tags, or invoice #"
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-lg text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus-visible:ring-2 focus-visible:ring-forest transition-colors"
                />
              </div>
            </div>

            {/* Receipt Photo Capture Button (Stub for OCR) */}
            <div>
              <span className="block text-xs font-semibold text-ink/70 mb-1">
                Receipt Attachment (OCR Ready)
              </span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleReceiptChange}
                className="hidden"
              />

              {receiptPreview ? (
                <div className="relative p-3 bg-paper border border-line rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-12 h-12 rounded-lg object-cover border border-line"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-ink">Receipt Captured</p>
                      <p className="text-ink/50 text-[11px]">Ready for offline storage</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptPreview(null)}
                    aria-label="Remove receipt image"
                    className="p-1.5 text-rust hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-paper border border-dashed border-line rounded-xl text-xs font-medium text-ink/70 hover:text-forest hover:border-forest hover:bg-forest/5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-forest" />
                  <span>Attach receipt image (photo capture)</span>
                </button>
              )}
            </div>

            {formError && (
              <p className="text-xs text-rust font-medium bg-rust/10 p-2.5 rounded-lg border border-rust/20">
                {formError}
              </p>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-line bg-paper/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border border-line rounded-lg text-xs font-semibold text-ink/70 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="tx-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-forest text-white rounded-lg text-xs font-bold shadow-xs hover:bg-forest/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
