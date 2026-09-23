-- ==============================================================================
-- Migration: 0002_rate_limits.sql
-- Description: Table for tracking login attempts and rate-limiting brute force attacks
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  success BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts (email, attempt_time DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow system/backend functions to record and query login attempts
CREATE POLICY "Users cannot directly manipulate login attempts" 
  ON public.login_attempts 
  FOR ALL 
  USING (false);
