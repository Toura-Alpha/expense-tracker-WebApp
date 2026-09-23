import type { RxJsonSchema } from 'rxdb';

// -----------------------------------------------------------------------------
// 1. Categories Schema (public.categories)
// -----------------------------------------------------------------------------
export interface CategoryDocType {
  id: string;
  user_id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  is_income: boolean;
  updated_at: string;
  deleted_at?: string | null;
  _deleted: boolean;
}

export const categorySchema: RxJsonSchema<CategoryDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    user_id: {
      type: 'string',
      maxLength: 36,
    },
    name: {
      type: 'string',
    },
    icon: {
      type: ['string', 'null'],
    },
    color: {
      type: ['string', 'null'],
    },
    is_income: {
      type: 'boolean',
    },
    updated_at: {
      type: 'string',
      maxLength: 50,
    },
    deleted_at: {
      type: ['string', 'null'],
      maxLength: 50,
    },
    _deleted: {
      type: 'boolean',
    },
  },
  required: ['id', 'user_id', 'name', 'is_income', 'updated_at', '_deleted'],
  indexes: ['updated_at', 'user_id'],
};

// -----------------------------------------------------------------------------
// 2. Transactions Schema (public.transactions)
// -----------------------------------------------------------------------------
export interface TransactionDocType {
  id: string;
  user_id: string;
  category_id?: string | null;
  amount: number;
  currency: string;
  merchant_name?: string | null;
  note?: string | null;
  date: string;
  is_recurring: boolean;
  receipt_url?: string | null;
  updated_at: string;
  deleted_at?: string | null;
  _deleted: boolean;
}

export const transactionSchema: RxJsonSchema<TransactionDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    user_id: {
      type: 'string',
      maxLength: 36,
    },
    category_id: {
      type: ['string', 'null'],
      maxLength: 36,
    },
    amount: {
      type: 'number',
    },
    currency: {
      type: 'string',
      maxLength: 3,
    },
    merchant_name: {
      type: ['string', 'null'],
    },
    note: {
      type: ['string', 'null'],
    },
    date: {
      type: 'string',
      maxLength: 50,
    },
    is_recurring: {
      type: 'boolean',
    },
    receipt_url: {
      type: ['string', 'null'],
    },
    updated_at: {
      type: 'string',
      maxLength: 50,
    },
    deleted_at: {
      type: ['string', 'null'],
      maxLength: 50,
    },
    _deleted: {
      type: 'boolean',
    },
  },
  required: ['id', 'user_id', 'amount', 'currency', 'date', 'is_recurring', 'updated_at', '_deleted'],
  indexes: ['updated_at', 'date', 'user_id'],
};

// -----------------------------------------------------------------------------
// 3. Budgets Schema (public.budgets)
// -----------------------------------------------------------------------------
export interface BudgetDocType {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  updated_at: string;
  deleted_at?: string | null;
  _deleted: boolean;
}

export const budgetSchema: RxJsonSchema<BudgetDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    user_id: {
      type: 'string',
      maxLength: 36,
    },
    category_id: {
      type: 'string',
      maxLength: 36,
    },
    monthly_limit: {
      type: 'number',
    },
    updated_at: {
      type: 'string',
      maxLength: 50,
    },
    deleted_at: {
      type: ['string', 'null'],
      maxLength: 50,
    },
    _deleted: {
      type: 'boolean',
    },
  },
  required: ['id', 'user_id', 'category_id', 'monthly_limit', 'updated_at', '_deleted'],
  indexes: ['updated_at', 'user_id'],
};

// -----------------------------------------------------------------------------
// 4. Recurring Rules Schema (public.recurring_rules)
// -----------------------------------------------------------------------------
export interface RecurringRuleDocType {
  id: string;
  user_id: string;
  template_transaction_id?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_run_date: string;
  updated_at: string;
  deleted_at?: string | null;
  _deleted: boolean;
}

export const recurringRuleSchema: RxJsonSchema<RecurringRuleDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    user_id: {
      type: 'string',
      maxLength: 36,
    },
    template_transaction_id: {
      type: ['string', 'null'],
      maxLength: 36,
    },
    frequency: {
      type: 'string',
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    next_run_date: {
      type: 'string',
      maxLength: 50,
    },
    updated_at: {
      type: 'string',
      maxLength: 50,
    },
    deleted_at: {
      type: ['string', 'null'],
      maxLength: 50,
    },
    _deleted: {
      type: 'boolean',
    },
  },
  required: ['id', 'user_id', 'frequency', 'next_run_date', 'updated_at', '_deleted'],
  indexes: ['updated_at', 'user_id'],
};
