-- ==============================================================================
-- Migration: 0001_init.sql
-- Description: Core schema, row-level security, and new user onboarding trigger
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  default_currency VARCHAR(3) DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_income BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Transactions Table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  merchant_name TEXT,
  note TEXT,
  date TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  receipt_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 4. Budgets Table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(12, 2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 5. Recurring Rules Table
CREATE TABLE public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  frequency TEXT CHECK (frequency IN ('daily','weekly','monthly','yearly')) NOT NULL,
  next_run_date TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for performance & sync
CREATE INDEX idx_transactions_user_date ON public.transactions (user_id, date DESC);
CREATE INDEX idx_transactions_category ON public.transactions (category_id);
CREATE INDEX idx_transactions_sync ON public.transactions (user_id, updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recurring rules" ON public.recurring_rules FOR ALL USING (auth.uid() = user_id);

-- Function & Trigger: Automatic profile creation & default category seeding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create a matching profile
  INSERT INTO public.profiles (id, email, default_currency, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'USD',
    NOW()
  );

  -- 2. Seed 9 default categories with distinct colors and Lucide icon names
  INSERT INTO public.categories (user_id, name, icon, color, is_income)
  VALUES
    (NEW.id, 'Food & Dining', 'utensils', '#B4472C', FALSE),
    (NEW.id, 'Transportation', 'car', '#3B82F6', FALSE),
    (NEW.id, 'Housing', 'home', '#8B5CF6', FALSE),
    (NEW.id, 'Utilities', 'zap', '#F59E0B', FALSE),
    (NEW.id, 'Shopping', 'shopping-bag', '#EC4899', FALSE),
    (NEW.id, 'Entertainment', 'film', '#10B981', FALSE),
    (NEW.id, 'Health', 'heart-pulse', '#EF4444', FALSE),
    (NEW.id, 'Income', 'wallet', '#2F5D50', TRUE),
    (NEW.id, 'Other', 'circle-ellipsis', '#6B7280', FALSE);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
