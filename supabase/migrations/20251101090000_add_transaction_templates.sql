-- Create enum for template recurring frequency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'transaction_recurring_frequency'
  ) THEN
    CREATE TYPE public.transaction_recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
  END IF;
END
$$;

-- Transaction templates table
CREATE TABLE IF NOT EXISTS public.transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_frequency transaction_recurring_frequency,
  next_occurrence TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction templates"
  ON public.transaction_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transaction templates"
  ON public.transaction_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction templates"
  ON public.transaction_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction templates"
  ON public.transaction_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS transaction_templates_user_idx
  ON public.transaction_templates(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS transaction_templates_recurring_idx
  ON public.transaction_templates(is_recurring, next_occurrence)
  WHERE is_recurring = TRUE;

-- Trigger to maintain updated_at
CREATE TRIGGER update_transaction_templates_updated_at
  BEFORE UPDATE ON public.transaction_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
