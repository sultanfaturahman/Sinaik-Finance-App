-- Create report frequency enum to differentiate daily and monthly notes
CREATE TYPE public.report_frequency AS ENUM ('daily', 'monthly');

-- Create financial reports table to store daily/monthly summaries without touching transactions
CREATE TABLE public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency report_frequency NOT NULL,
  report_date DATE NOT NULL,
  total_income DECIMAL(15,2) DEFAULT 0 CHECK (total_income >= 0),
  total_expense DECIMAL(15,2) DEFAULT 0 CHECK (total_expense >= 0),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, frequency, report_date)
);

-- Enable RLS for proper multi-tenant separation
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- Policies to allow users to manage only their own notes
CREATE POLICY "Users can view own financial reports"
  ON public.financial_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial reports"
  ON public.financial_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial reports"
  ON public.financial_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial reports"
  ON public.financial_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Reuse the generic updated_at trigger to keep timestamps fresh
CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON public.financial_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
