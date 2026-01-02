DROP FUNCTION IF EXISTS public.get_dashboard_stats();

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  net_profit numeric,
  transaction_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH totals AS (
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS total_expense,
      COUNT(*)::bigint AS transaction_count
    FROM public.transactions
    WHERE user_id = auth.uid()
  )
  SELECT
    total_income,
    total_expense,
    total_income - total_expense AS net_profit,
    transaction_count
  FROM totals;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO service_role;
