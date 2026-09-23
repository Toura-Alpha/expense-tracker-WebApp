export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TransactionType = 'income' | 'expense';

export interface Profile {
  id: string;
  email: string;
  default_currency: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_income: boolean;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  merchant_name: string | null;
  note: string | null;
  date: string;
  is_recurring: boolean;
  receipt_url: string | null;
  updated_at: string;
  deleted_at: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  template_transaction_id: string;
  frequency: RecurringFrequency;
  next_run_date: string;
  updated_at: string;
  deleted_at: string | null;
}

