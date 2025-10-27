-- Table to cache AI strategy runs per user and input payload
CREATE TABLE public.ai_strategy_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload_hash TEXT NOT NULL,
  profile JSONB NOT NULL,
  financial_summary JSONB NOT NULL,
  goals JSONB NOT NULL,
  strategy JSONB NOT NULL,
  raw_response TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, payload_hash)
);

ALTER TABLE public.ai_strategy_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategy runs"
  ON public.ai_strategy_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategy runs"
  ON public.ai_strategy_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy runs"
  ON public.ai_strategy_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy runs"
  ON public.ai_strategy_runs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX ai_strategy_runs_user_id_created_at_idx
  ON public.ai_strategy_runs (user_id, created_at DESC);

CREATE TRIGGER update_ai_strategy_runs_updated_at
  BEFORE UPDATE ON public.ai_strategy_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
