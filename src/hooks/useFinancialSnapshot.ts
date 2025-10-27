import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StrategyFinancialSnapshot } from "@/types/strategy";
import { useCallback, useEffect, useState } from "react";

interface UseFinancialSnapshotState {
  snapshot: StrategyFinancialSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useFinancialSnapshot = (): UseFinancialSnapshotState => {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<StrategyFinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (!user) {
      setSnapshot(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("type, amount, category, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (txError) {
        throw txError;
      }

      const { data: status, error: statusError } = await supabase
        .from("umkm_status")
        .select("level, annual_revenue")
        .eq("user_id", user.id)
        .maybeSingle();

      if (statusError && statusError.code !== "PGRST116") {
        // Ignore 406 no rows, surface other errors
        throw statusError;
      }

      const typedTransactions = (transactions ?? []).map((t) => ({
        ...t,
        amount: Number(t.amount ?? 0),
        date: t.date,
      }));

      const totalIncome = typedTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = typedTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      const aggregateByCategory = (type: "income" | "expense") => {
        const totals = typedTransactions
          .filter((t) => t.type === type)
          .reduce<Record<string, number>>((acc, t) => {
            const key = t.category ?? "Lainnya";
            acc[key] = (acc[key] ?? 0) + t.amount;
            return acc;
          }, {});

        const total = type === "income" ? totalIncome : totalExpense;

        return Object.entries(totals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : "0",
          }));
      };

      const topIncomeCategories = aggregateByCategory("income");
      const topExpenseCategories = aggregateByCategory("expense");

      const monthlyTrends: StrategyFinancialSnapshot["monthlyTrends"] = [];
      for (let i = 5; i >= 0; i -= 1) {
        const reference = new Date();
        reference.setMonth(reference.getMonth() - i);
        reference.setDate(1);

        const monthTx = typedTransactions.filter((t) => {
          const txDate = new Date(t.date);
          return (
            txDate.getFullYear() === reference.getFullYear() &&
            txDate.getMonth() === reference.getMonth()
          );
        });

        const income = monthTx
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTx
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        monthlyTrends.push({
          month: new Intl.DateTimeFormat("id-ID", {
            month: "long",
            year: "numeric",
          }).format(reference),
          income,
          expense,
          profit: income - expense,
        });
      }

      setSnapshot({
        umkmLevel: status?.level ?? "ultra_mikro",
        annualRevenue: Number(status?.annual_revenue ?? 0),
        yearToDate: {
          totalIncome,
          totalExpense,
          netProfit,
          profitMargin: Number.isFinite(profitMargin) ? profitMargin : 0,
          transactionCount: typedTransactions.length,
        },
        topIncomeCategories,
        topExpenseCategories,
        monthlyTrends,
      });
    } catch (err) {
      console.error("Failed to load financial snapshot", err);
      setError("Gagal memuat ringkasan keuangan");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchSnapshot();
    } else {
      setSnapshot(null);
    }
  }, [fetchSnapshot, user?.id]);

  return {
    snapshot,
    loading,
    error,
    refresh: fetchSnapshot,
  };
};
